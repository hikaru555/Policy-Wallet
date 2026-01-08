
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. Cloud SQL Configuration
const isProduction = process.env.NODE_ENV === 'production';

const dbConfig = {
  user: process.env.DB_USER || 'policywallet',
  password: process.env.DB_PASSWORD || '.E9iAtlC[I5;g&<3',
  database: process.env.DB_NAME || 'policywallet',
  host: process.env.DB_HOST || (isProduction ? `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}` : 'localhost'),
  port: 5432,
};

const pool = new Pool(dbConfig);

// 2. Database Initialization
const initDb = async () => {
  console.log('--- Initializing Database ---');
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        policies JSONB DEFAULT '[]'::jsonb,
        profile JSONB DEFAULT '{}'::jsonb,
        last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table is ready');
    client.release();
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err.message);
    console.error('Please check your DB_USER, DB_PASSWORD, and DB_HOST environment variables.');
  }
};

initDb();

// --- ENDPOINTS ---

// Get Combined Portfolio Data (Policies + Profile)
app.get('/api/portfolio/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query('SELECT policies, profile FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.json({ policies: [], profile: null });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch Portfolio Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Sync Policies
app.post('/api/policies/sync', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { policies } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    const query = `
      INSERT INTO users (id, policies, last_sync) 
      VALUES ($1, $2, NOW()) 
      ON CONFLICT (id) DO UPDATE SET 
        policies = EXCLUDED.policies, 
        last_sync = NOW()
    `;
    await pool.query(query, [userId, JSON.stringify(policies)]);
    res.json({ success: true });
  } catch (err) {
    console.error('SQL Sync Policies Error:', err.message);
    res.status(500).json({ error: 'Database sync failed' });
  }
});

// Sync Profile
app.post('/api/profile/sync', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { profile } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    const query = `
      INSERT INTO users (id, profile, last_sync) 
      VALUES ($1, $2, NOW()) 
      ON CONFLICT (id) DO UPDATE SET 
        profile = EXCLUDED.profile, 
        last_sync = NOW()
    `;
    await pool.query(query, [userId, JSON.stringify(profile)]);
    res.json({ success: true });
  } catch (err) {
    console.error('Profile sync failed:', err.message);
    res.status(500).json({ error: 'Profile sync failed' });
  }
});

// Public View Summary (Unauthenticated)
app.get('/api/public/view/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query('SELECT policies, profile FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Public fetch failed:', err.message);
    res.status(500).json({ error: 'Public fetch failed' });
  }
});

app.get('/health', (req, res) => res.status(200).send('OK'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Bridge Server running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
});
