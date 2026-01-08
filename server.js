
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

// 1. Infrastructure Configuration (Hardcoded as requested)
const isProduction = process.env.NODE_ENV === 'production';
const CLOUD_SQL_CONNECTION_NAME = 'gen-lang-client-0928682283:us-central1:tiered-web-app-db-bbbd';
const BUCKET_NAME = 'policywallet';

const dbConfig = {
  user: 'policywallet',
  password: '.E9iAtlC[I5;g&<3',
  database: 'policywallet',
  // In production (GCP Cloud Run), we connect via the Unix socket path provided by the Cloud SQL Auth Proxy.
  host: isProduction ? `/cloudsql/${CLOUD_SQL_CONNECTION_NAME}` : 'localhost',
  port: 5432,
  connectionTimeoutMillis: 5000, 
};

let pool;
try {
  pool = new Pool(dbConfig);
  pool.on('error', (err) => console.error('DB Pool Error:', err));
} catch (e) {
  console.error('Failed to create DB pool:', e.message);
}

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

// 2. Database Initialization
const initDb = async () => {
  if (!pool) return;
  try {
    const client = await pool.connect();
    // Create users table with JSONB columns for flexible data storage
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        policies JSONB DEFAULT '[]'::jsonb,
        profile JSONB DEFAULT '{}'::jsonb,
        last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    client.release();
    console.log('✅ PostgreSQL Schema Ready and Verified');
  } catch (err) {
    console.error('❌ DB Init Failed:', err.message);
  }
};
initDb();

// --- API ENDPOINTS ---

app.get('/api/ping', (req, res) => res.json({ status: 'pong' }));

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
      await pool.query('SELECT 1');
      health.database = 'connected';
    } catch (err) {
      health.database = 'error';
      health.dbError = err.message;
    }
  }

  if (storage) {
    try {
      const [exists] = await bucket.exists();
      health.storage = exists ? 'connected' : 'bucket_not_found';
    } catch (err) {
      health.storage = 'error';
      health.storageError = err.message;
    }
  }

  res.json(health);
});

// Portfolio Data Retrieval
app.get('/api/portfolio/:userId', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DB Unavailable' });
  try {
    const result = await pool.query('SELECT policies, profile FROM users WHERE id = $1', [req.params.userId]);
    res.json(result.rows[0] || { policies: [], profile: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Policies Sync (Atomic Update)
app.post('/api/policies/sync', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId || !pool) return res.status(400).json({ error: 'Bad Request' });
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

// Profile Sync (Atomic Update)
app.post('/api/profile/sync', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId || !pool) return res.status(400).json({ error: 'Bad Request' });
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

// Vault / Cloud Storage Endpoints
app.post('/api/vault/upload', upload.single('file'), async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId || !req.file) return res.status(400).json({ error: 'No file or user' });

  try {
    const blob = bucket.file(`vault/${userId}/${Date.now()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: req.file.mimetype,
      public: true, 
    });

    blobStream.on('error', (err) => res.status(500).json({ error: err.message }));
    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${blob.name}`;
      res.json({ url: publicUrl, name: req.file.originalname, mimeType: req.file.mimetype });
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

// Static Serving for Frontend
app.use(express.static(__dirname));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Database Bridge Active on ${PORT}`));
