module.exports = {
    application: function (app, application) {
        const raw = application.toJSON()
        const filtered = {
            id: raw.hashid,
            name: raw.name,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            links: raw.links
        }
        return filtered
    },

    teamApplicationList: function (app, applications) {
        return applications.map(app => {
            return {
                id: app.hashid,
                name: app.name,
                links: app.links
            }
        })
    }
}