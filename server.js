const express = require('express');
const { Pool } = require('pg');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// 1. Core Middleware
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '10mb' }));

// 2. Production-Grade Configuration
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE;
// Fallback for local dev, usually overridden by Cloud Run env vars
const CLOUD_SQL_CONNECTION_NAME = process.env.CLOUD_SQL_CONNECTION_NAME || 'gen-lang-client-0928682283:us-central1:tiered-web-app-db-bbbd';
const BUCKET_NAME = process.env.BUCKET_NAME || 'policywallet';

const dbConfig = {
  user: process.env.DB_USER || 'policywallet',
  password: process.env.DB_PASSWORD || '.E9iAtlC[I5;g&<3',
  database: process.env.DB_NAME || 'policywallet',
  host: isProduction ? `/cloudsql/${CLOUD_SQL_CONNECTION_NAME}` : 'localhost',
  port: 5432,
  connectionTimeoutMillis: 5000, 
  max: 10,
};

let pool;
let dbStatus = 'initializing';
let dbErrorMessage = '';

try {
  pool = new Pool(dbConfig);
  pool.on('error', (err) => {
    console.error('DATABASE POOL ERROR:', err.message);
    dbStatus = 'error';
    dbErrorMessage = err.message;
  });
} catch (e) {
  dbStatus = 'config_error';
  dbErrorMessage = e.message;
}

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

// 3. Background Database Initialization
const initDb = async () => {
  if (!pool) return;
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
    dbStatus = 'connected';
    console.log('✅ PostgreSQL Schema Verified');
  } catch (err) {
    dbStatus = 'error';
    dbErrorMessage = err.message;
    console.warn('⚠️ DB Connection Failed:', err.message);
  }
};

// --- API ENDPOINTS ---

app.get('/api/ping', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json({ 
    status: 'ok', 
    timestamp: Date.now(),
    env: process.env.NODE_ENV
  });
});

app.get('/api/admin/health', async (req, res) => {
  let storageStatus = 'checking';
  try {
    const [exists] = await bucket.exists();
    storageStatus = exists ? 'connected' : 'bucket_not_found';
  } catch (e) {
    storageStatus = 'error';
  }

  res.json({
    status: 'online',
    database: dbStatus,
    dbError: dbErrorMessage,
    storage: storageStatus,
    env: isProduction ? 'production' : 'development',
    sqlProxy: CLOUD_SQL_CONNECTION_NAME,
    bucket: BUCKET_NAME,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/portfolio/:userId', async (req, res) => {
  if (dbStatus !== 'connected') return res.status(503).json({ error: 'Database unavailable' });
  try {
    const result = await pool.query('SELECT policies, profile FROM users WHERE id = $1', [req.params.userId]);
    res.json(result.rows[0] || { policies: [], profile: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/policies/sync', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId || dbStatus !== 'connected') return res.status(400).json({ error: 'Context unavailable' });
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
  if (!userId || dbStatus !== 'connected') return res.status(400).json({ error: 'Context unavailable' });
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

app.post('/api/vault/upload', upload.single('file'), async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId || !req.file) return res.status(400).json({ error: 'Upload failed' });
  try {
    const blob = bucket.file(`vault/${userId}/${Date.now()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({ resumable: false, contentType: req.file.mimetype, public: true });
    blobStream.on('error', (err) => res.status(500).json({ error: err.message }));
    blobStream.on('finish', () => {
      res.json({ url: `https://storage.googleapis.com/${BUCKET_NAME}/${blob.name}`, name: req.file.originalname, mimeType: req.file.mimetype });
    });
    blobStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vault/delete', async (req, res) => {
  const { fileName } = req.body;
  if (!fileName) return res.status(400).json({ error: 'Missing filename' });
  try {
    await bucket.file(fileName).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Static Assets - Serve from root directory
app.use(express.static(path.join(__dirname, '.')));

// SPA Route - Serve index.html for all non-API paths
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Policy Wallet Bridge listening on port ${PORT} (Mode: ${process.env.NODE_ENV || 'development'})`);
  initDb();
});
