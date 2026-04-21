const { Queue } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379
};

const submissionQueue = new Queue('submissions', { connection });

const addJob = async (data) => {
  await submissionQueue.add('execute', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  });
};

module.exports = { submissionQueue, addJob };