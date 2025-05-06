const express = require('express');
const Queue = require('bull');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Create a Bull queue with proper Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
console.log('Connecting to Redis at:', REDIS_URL.replace(/redis:\/\/.*@/, 'redis://***@')); // Hide credentials in logs

// Better connection options for Bull/Redis
const webhookQueue = new Queue('webhook-queue', {
  redis: {
    port: parseInt(process.env.REDIS_PORT) || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1',
    password: process.env.REDIS_PASSWORD || '',
    db: 0,
    tls: process.env.REDIS_TLS_URL ? { rejectUnauthorized: false } : undefined,
    enableReadyCheck: false,
    maxRetriesPerRequest: 5,
    enableOfflineQueue: false,
    connectTimeout: 30000,
    retryStrategy: function(times) {
      const delay = Math.min(times * 500, 5000);
      console.log(`Redis retry attempt ${times} with delay ${delay}ms`);
      return delay;
    }
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

// Listen for Redis connection events
webhookQueue.on('error', (error) => {
  console.error('Redis connection error:', error.message);
});

webhookQueue.on('ready', () => {
  console.log('Redis connection established');
});

// Basic route to trigger the webhook
app.post('/trigger-webhook', async (req, res) => {
  try {
    console.log('Received webhook trigger request');
    
    // Add job to the queue
    const job = await webhookQueue.add({ 
      timestamp: new Date(),
      message: 'Starting to process sketch job'
    });
    
    console.log('Job added to queue:', job.id);
    res.json({ success: true, message: 'Webhook job added to queue', jobId: job.id });
  } catch (error) {
    console.error('Error adding job to queue:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 