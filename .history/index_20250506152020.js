const express = require('express');
const Queue = require('bull');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Create a Bull queue with connection options
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
console.log('Connecting to Redis at:', redisUrl.replace(/redis:\/\/.*@/, 'redis://***@')); // Hide credentials in logs

const webhookQueue = new Queue('webhook-queue', {
  redis: redisUrl,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

// Listen for Redis connection errors
webhookQueue.on('error', (error) => {
  console.error('Redis connection error:', error.message);
});

// Basic route to trigger the webhook
app.post('/trigger-webhook', async (req, res) => {
  try {
    // Add job to the queue
    await webhookQueue.add({ timestamp: new Date() }, { timeout: 5000 });
    res.json({ success: true, message: 'Webhook job added to queue' });
  } catch (error) {
    console.error('Error adding job to queue:', error);
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