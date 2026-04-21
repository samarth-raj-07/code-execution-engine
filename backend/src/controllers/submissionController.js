const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { addJob } = require('../workers/queue');

const submitCode = async (req, res) => {
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: 'language and code are required' });
  }

  const id = uuidv4();

  await pool.query(
    'INSERT INTO submissions (id, language, code, status) VALUES ($1, $2, $3, $4)',
    [id, language, code, 'pending']
  );

  await addJob({ id, language, code });

  res.status(201).json({ id, status: 'pending' });
};

const getSubmission = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM submissions WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  res.json(result.rows[0]);
};

module.exports = { submitCode, getSubmission };