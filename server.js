
const express = require('express');
const { Pool } = require('pg');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. Infrastructure Configuration
const isProduction = process.env.NODE_ENV === 'production';

// Database Config
const dbConfig = {
  user: process.env.DB_USER || 'policywallet',
  password: process.env.DB_PASSWORD || '.E9iAtlC[I5;g&<3',
  database: process.env.DB_NAME || 'policywallet',
  host: process.env.DB_HOST || (isProduction ? `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}` : 'localhost'),
  port: 5432,
  connectionTimeoutMillis: 5000, 
};

// Create pool conditionally to allow startup even if DB is misconfigured
let pool;
try {
  pool = new Pool(dbConfig);
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
} catch (e) {
  console.error('Could not create DB pool:', e.message);
}

// Storage Config
const bucketName = process.env.BUCKET_NAME || 'policywallet';
let storage;
try {
  storage = new Storage();
} catch (e) {
  console.warn('Cloud Storage client failed to initialize (likely missing credentials)');
}

// 2. Database Initialization
const initDb = async () => {
  if (!pool) return;
  console.log('--- Initializing Database ---');
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
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
  }
};

initDb();

// --- API ENDPOINTS ---

// Lightweight Ping (Always JSON)
app.get('/api/ping', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ status: 'pong', timestamp: new Date().toISOString() });
});

// Detailed System Health Check
app.get('/api/admin/health', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const health = {
    status: 'online',
    timestamp: new Date().toISOString(),
    database: 'disconnected',
    storage: 'disconnected',
    environment: isProduction ? 'production' : 'development',
    bucket: bucketName
  };

  if (pool) {
    try {
      const dbCheck = await pool.query('SELECT 1 as connected');
      if (dbCheck.rows.length > 0) {
        health.database = 'connected';
      }
    } catch (err) {
      health.database = 'error';
      health.dbError = err.message;
    }
  } else {
    health.database = 'not_configured';
  }

  if (!storage) {
    health.storage = 'client_not_initialized';
    health.storageError = 'Storage client could not be created';
  } else {
    try {
      const [exists] = await storage.bucket(bucketName).exists();
      health.storage = exists ? 'connected' : 'bucket_not_found';
    } catch (err) {
      health.storage = 'error';
      health.storageError = err.message;
    }
  }

  res.json(health);
});

// Get Combined Portfolio Data
app.get('/api/portfolio/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!pool) return res.status(503).json({ error: 'Database not available' });
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
  if (!pool) return res.status(503).json({ error: 'Database not available' });

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
  if (!pool) return res.status(503).json({ error: 'Database not available' });

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

// Standard health check for Cloud Run
app.get('/health', (req, res) => res.status(200).send('OK'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Bridge Server running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
});
