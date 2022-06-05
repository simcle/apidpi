const Notification = require('../models/notification');

module.exports = async (from, to, type, content) => {
    const notification = new Notification({
        sender: from,
        receiver: to,
        type: type,
        content: content
    })
    await notification.save()
}