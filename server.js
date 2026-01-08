
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

// 1. Production-Grade Configuration
// K_SERVICE is set by default in Google Cloud Run environments
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE;
const CLOUD_SQL_CONNECTION_NAME = 'gen-lang-client-0928682283:us-central1:tiered-web-app-db-bbbd';
const BUCKET_NAME = 'policywallet';

const dbConfig = {
  user: 'policywallet',
  password: '.E9iAtlC[I5;g&<3',
  database: 'policywallet',
  // In Cloud Run, we use the Unix socket. Locally, we use localhost (proxy).
  host: isProduction ? `/cloudsql/${CLOUD_SQL_CONNECTION_NAME}` : 'localhost',
  port: 5432,
  connectionTimeoutMillis: 5000, 
  max: 20, // Connection pool limit
};

let pool;
try {
  pool = new Pool(dbConfig);
  pool.on('error', (err) => console.error('CRITICAL: DB Pool Error:', err.message));
} catch (e) {
  console.error('CRITICAL: Failed to create DB pool:', e.message);
}

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

// 2. Database Initialization (Non-blocking)
const initDb = async () => {
  if (!pool) return;
  console.log('⏳ Attempting to verify database schema...');
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
    console.log('✅ PostgreSQL Schema Verified');
  } catch (err) {
    console.error('❌ DB Init/Connection Warning:', err.message);
    console.log('💡 Note: Server will continue running in limited mode.');
  }
};

// Start init but don't await it to block the listen
initDb();

// --- API ENDPOINTS ---

app.get('/api/ping', (req, res) => res.json({ status: 'pong', environment: isProduction ? 'prod' : 'dev' }));

// Health check for Admin Console
app.get('/api/admin/health', async (req, res) => {
  const health = {
    status: 'online',
    timestamp: new Date().toISOString(),
    database: 'checking',
    storage: 'checking',
    environment: isProduction ? 'production' : 'development',
    bucket: BUCKET_NAME
  };

  if (pool) {
    try {
      const dbRes = await pool.query('SELECT 1');
      health.database = 'connected';
    } catch (err) {
      health.database = 'error';
      health.dbError = err.message;
    }
  } else {
    health.database = 'pool_not_initialized';
  }

  try {
    const [exists] = await bucket.exists();
    health.storage = exists ? 'connected' : 'bucket_not_found';
  } catch (err) {
    health.storage = 'error';
    health.storageError = err.message;
  }

  res.json(health);
});

// Portfolio Data Retrieval
app.get('/api/portfolio/:userId', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DB Pool Not Ready' });
  try {
    const result = await pool.query('SELECT policies, profile FROM users WHERE id = $1', [req.params.userId]);
    res.json(result.rows[0] || { policies: [], profile: null });
  } catch (err) {
    res.status(500).json({ error: 'Database query failed: ' + err.message });
  }
});

// Policies Sync
app.post('/api/policies/sync', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId || !pool) return res.status(400).json({ error: 'Missing User ID or DB connection' });
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

// Profile Sync
app.post('/api/profile/sync', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId || !pool) return res.status(400).json({ error: 'Missing User ID or DB connection' });
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

// Vault / Cloud Storage Upload
app.post('/api/vault/upload', upload.single('file'), async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId || !req.file) return res.status(400).json({ error: 'Missing file/user' });

  try {
    const blob = bucket.file(`vault/${userId}/${Date.now()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: req.file.mimetype,
      public: true, 
    });

    blobStream.on('error', (err) => res.status(500).json({ error: 'Upload stream error: ' + err.message }));
    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${blob.name}`;
      res.json({ url: publicUrl, name: req.file.originalname, mimeType: req.file.mimetype });
    });

    blobStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: 'Storage error: ' + err.message });
  }
});

app.delete('/api/vault/delete', async (req, res) => {
  const { fileName } = req.body; 
  if (!fileName) return res.status(400).json({ error: 'Missing filename' });
  try {
    await bucket.file(fileName).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed: ' + err.message });
  }
});

// Serve Static Frontend
app.use(express.static(__dirname));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Policy Wallet Bridge listening on port ${PORT}`);
  console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`🔗 DB Connection Path: ${dbConfig.host}\n`);
});
