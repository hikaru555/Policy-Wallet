
const express = require('express');
const { Pool } = require('pg');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. Production Environment Detection
// In GCP Cloud Run, K_SERVICE is always set.
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE;
const CLOUD_SQL_CONNECTION_NAME = process.env.CLOUD_SQL_CONNECTION_NAME || 'gen-lang-client-0928682283:us-central1:tiered-web-app-db-bbbd';
const BUCKET_NAME = 'policywallet';

const dbConfig = {
  user: 'policywallet',
  password: '.E9iAtlC[I5;g&<3',
  database: 'policywallet',
  // Use Unix socket in production, localhost in dev (for Cloud SQL Auth Proxy)
  host: isProduction ? `/cloudsql/${CLOUD_SQL_CONNECTION_NAME}` : 'localhost',
  port: 5432,
  connectionTimeoutMillis: 5000, 
  max: 10, // Optimized for Cloud Run concurrency
};

let pool;
try {
  pool = new Pool(dbConfig);
  pool.on('error', (err) => console.error('DATABASE POOL ERROR:', err.message));
} catch (e) {
  console.error('CRITICAL: Pool initialization failed:', e.message);
}

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

// 2. Database Schema Initialization (Non-blocking)
const initDb = async () => {
  if (!pool) return;
  console.log('⏳ Checking database connectivity...');
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        policies JSONB DEFAULT '[]'::jsonb,
        profile JSONB DEFAULT '{}'::jsonb,
        last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    client.release();
    console.log('✅ PostgreSQL Schema Verified and Ready');
  } catch (err) {
    console.warn('⚠️ Database not ready yet:', err.message);
    console.log('💡 Note: Bridge will stay online. Check Cloud SQL Auth Proxy settings.');
  }
};

// Start initialization in background
initDb();

// --- API ENDPOINTS ---

// Simple Ping for health checks
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'pong', 
    env: isProduction ? 'production' : 'development',
    time: new Date().toISOString()
  });
});

// Detailed Infrastructure Health
app.get('/api/admin/health', async (req, res) => {
  const health = {
    status: 'online',
    database: 'checking',
    storage: 'checking',
    env: isProduction ? 'production' : 'development'
  };

  if (pool) {
    try {
      await pool.query('SELECT 1');
      health.database = 'connected';
    } catch (err) {
      health.database = 'error';
      health.dbError = err.message;
    }
  }

  try {
    const [exists] = await bucket.exists();
    health.storage = exists ? 'connected' : 'not_found';
  } catch (err) {
    health.storage = 'error';
    health.storageError = err.message;
  }

  res.json(health);
});

// Portfolio Persistence
app.get('/api/portfolio/:userId', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DB Pool Down' });
  try {
    const result = await pool.query('SELECT policies, profile FROM users WHERE id = $1', [req.params.userId]);
    res.json(result.rows[0] || { policies: [], profile: null });
  } catch (err) {
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

app.post('/api/policies/sync', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId || !pool) return res.status(400).json({ error: 'Missing context' });
  try {
    await pool.query(`
      INSERT INTO users (id, policies, last_sync) 
      VALUES ($1, $2, NOW()) 
      ON CONFLICT (id) DO UPDATE SET policies = EXCLUDED.policies, last_sync = NOW()
    `, [userId, JSON.stringify(req.body.policies)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile/sync', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId || !pool) return res.status(400).json({ error: 'Missing context' });
  try {
    await pool.query(`
      INSERT INTO users (id, profile, last_sync) 
      VALUES ($1, $2, NOW()) 
      ON CONFLICT (id) DO UPDATE SET profile = EXCLUDED.profile, last_sync = NOW()
    `, [userId, JSON.stringify(req.body.profile)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vault Management
app.post('/api/vault/upload', upload.single('file'), async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId || !req.file) return res.status(400).json({ error: 'Upload failed' });
  try {
    const blob = bucket.file(`vault/${userId}/${Date.now()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: req.file.mimetype,
      public: true, 
    });
    blobStream.on('error', (err) => res.status(500).json({ error: err.message }));
    blobStream.on('finish', () => {
      res.json({ 
        url: `https://storage.googleapis.com/${BUCKET_NAME}/${blob.name}`, 
        name: req.file.originalname, 
        mimeType: req.file.mimetype 
      });
    });
    blobStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Static Assets
app.use(express.static(__dirname));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Policy Wallet Bridge listening on port ${PORT}`);
  console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`📦 Cloud SQL Socket: ${dbConfig.host}\n`);
});
