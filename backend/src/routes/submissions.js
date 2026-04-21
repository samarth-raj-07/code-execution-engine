const express = require('express');
const router = express.Router();
const { submitCode, getSubmission } = require('../controllers/submissionController');

router.post('/', submitCode);
router.get('/:id', getSubmission);

module.exports = router;
