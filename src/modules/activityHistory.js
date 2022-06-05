const Activity = require('../models/activity');
const User = require('../models/users');
const pusher = require('../modules/pusher');
const notification = require('../modules/notification');

module.exports = (event, document, documentId, documentName, userId, original, updated) => {
    switch (event) {
        case 'insert':
            const insert = new Activity({
                event: event,
                action: 'Create New',
                document: document,
                documentId: documentId,
                documentName: documentName,
                original: original,
                updated: updated,
                userId: userId
            })
            insert.save()
            break;
        case 'update':
            const update = new Activity({
                event: event,
                action: 'Edit',
                document: document,
                documentId: documentId,
                documentName: documentName,
                original: original,
                updated: updated,
                userId: userId
            })
            update.save()
            break
    }
    User.find()
    .then(async (result) => {
        for await (let user of result) {
            await notification(userId, user._id, 'activity', 'history')
        }
        pusher.trigger('broadcast', 'activity', {
            message: 'history activity'
        })
    })
}