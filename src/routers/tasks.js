const express = require('express');
const router = express.Router();

const taskController = require('../controllers/tasks');

router.get('/create', taskController.createTask);
router.post('/insert', taskController.postTask);
router.get('/read/:documentId', taskController.getTask);
router.put('/edit/:taskId', taskController.editTask);
router.put('/update/:taskId', taskController.updateTask);
router.delete('/delete/:taskId', taskController.deleteTask);

module.exports = router;