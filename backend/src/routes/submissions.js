const express = require('express');
const router = express.Router();
const { submitCode, getSubmission, getHistory } = require('../controllers/submissionController');

router.post('/', submitCode);
router.get('/history', getHistory);
router.get('/:id', getSubmission);

module.exports = router;