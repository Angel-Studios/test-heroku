const express = require('express');
const Queue = require('bull');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Create a Bull queue with proper Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
console.log('Connecting to Redis at:', REDIS_URL.replace(/rediss?:\/\/.*@/, 'redis[s]://***@')); // Hide credentials

// Configure Bull with the Redis URL
const webhookQueue = new Queue('webhook-queue', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true,
    removeOnFail: false
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