const express = require('express');
const router = express.Router();

const activityController = require('../controllers/activity');


router.get('/recent', activityController.getActivity);

module.exports = router;