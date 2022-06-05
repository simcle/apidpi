const express = require('express');
const router = express.Router();

const NotificationController = require('../controllers/notifications');

router.get('/unread', NotificationController.getNotificationUread);
router.delete('/delete', NotificationController.deleteNotificationType);
module.exports = router;