const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./db');
const submissionRoutes = require('./routes/submissions');
require('./workers/processor');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/submissions', submissionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();