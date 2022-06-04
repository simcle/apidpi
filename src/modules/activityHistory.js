const Activity = require('../models/activity');

module.exports = (event, document, documentId, userId, original, updated) => {
    switch (event) {
        case 'insert':
            break;
        case 'update':
            const activity = new Activity({
                event: event,
                action: 'Edit',
                document: document,
                documentId: documentId,
                original: original,
                updated: updated,
                userId: userId
            })
            activity.save()
            break
    }
}