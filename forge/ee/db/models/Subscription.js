const {
    DataTypes
} = require('sequelize')

// A subset of the statuses on Stripe that are important to FlowForge
// https://stripe.com/docs/billing/subscriptions/overview#subscription-statuses
// And the statuses used to track team trial state
const STATUS = {
    // Any changes to this list *must* be made via migration.
    // See forge/db/migrations/20230130-01-add-subscription-trial-date.js for example
    ACTIVE: 'active',
    CANCELED: 'canceled',
    TRIAL: 'trial'
}

const TRIAL_STATUS = {
    NONE: 'none',
    CREATED: 'created',
    WEEK_EMAIL_SENT: 'week_email_sent',
    DAY_EMAIL_SENT: 'day_email_sent',
    ENDED: 'ended'
}

Object.freeze(STATUS)

module.exports = {
    name: 'Subscription',
    schema: {
        // Customer ID from stripe, e.g. cus_xyz123
        // Each team has one subscription, that is tied to a single stripe customer, via the customer ID field
        customer: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // Subscription ID from stripe e.g. sub_xyz123
        // Stored for reference only, Stripe events should only be matched to subscription objects via
        // the customer field
        subscription: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM(Object.values(STATUS)),
            allowNull: false,
            defaultValue: STATUS.ACTIVE
        },
        trialStatus: {
            type: DataTypes.ENUM(Object.values(TRIAL_STATUS)),
            allowNull: false,
            defaultValue: TRIAL_STATUS.NONE
        },
        trialEndsAt: { type: DataTypes.DATE, defaultValue: null, allowNull: true }
    },
    associations: function (M) {
        this.belongsTo(M.Team)
    },
    finders: function (M) {
        const self = this
        return {
            instance: {
                // Should this subscription be treated as active/usable
                // Stripe states such as past_due and trialing are still active
                isActive () {
                    return this.status === STATUS.ACTIVE
                },
                isCanceled () {
                    return this.status === STATUS.CANCELED
                },
                isTrial () {
                    return !!this.trialEndsAt
                },
                isTrialEnded () {
                    return this.isTrial() && this.trialEndsAt < Date.now()
                }

            },
            static: {
                STATUS,
                TRIAL_STATUS,
                byTeamId: async function (teamId) {
                    if (typeof teamId === 'string') {
                        teamId = M.Team.decodeHashid(teamId)
                    }
                    return self.findOne({
                        where: {
                            TeamId: teamId
                        },
                        include: {
                            model: M.Team,
                            attributes: ['id', 'name', 'slug', 'links']
                        }
                    })
                },
                byCustomerId: async function (stripeCustomerId) {
                    return self.findOne({
                        where: {
                            customer: stripeCustomerId
                        },
                        include: {
                            model: M.Team,
                            attributes: ['id', 'name', 'slug', 'links']
                        }
                    })
                }
            }
        }
    }
}
