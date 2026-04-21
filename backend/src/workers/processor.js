const { Worker } = require('bullmq');
const { pool } = require('../db');
const { runCode } = require('../docker/runner');

const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379
};

const worker = new Worker('submissions', async (job) => {
  const { id, language, code } = job.data;

  await pool.query('UPDATE submissions SET status = $1 WHERE id = $2', ['running', id]);

  const result = await runCode(language, code);

  await pool.query(
    'UPDATE submissions SET status = $1, output = $2, error = $3, execution_time = $4 WHERE id = $5',
    [result.error ? 'error' : 'success', result.output, result.error, result.executionTime, id]
  );

}, { connection });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed: ${err.message}`);
});

module.exports = { worker };