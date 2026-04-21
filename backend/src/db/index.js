const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id UUID PRIMARY KEY,
      language VARCHAR(20) NOT NULL,
      code TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      output TEXT,
      error TEXT,
      execution_time INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('Database initialized');
};

module.exports = { pool, initDB };
