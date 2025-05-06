const Queue = require('bull');
const axios = require('axios');

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

console.log('Worker started, waiting for jobs...');

// Listen for Redis connection errors
webhookQueue.on('error', (error) => {
  console.error('Redis connection error:', error.message);
});

// Process jobs from the queue
webhookQueue.process(async (job) => {
  console.log('Processing job:', job.id, 'Data:', job.data);
  
  try {
    // Hit the webhook URL
    const response = await axios.post('https://3bb9-66-219-246-75.ngrok-free.app/webhook', {
      message: 'Starting to process sketch job',
      jobId: job.id,
      timestamp: job.data.timestamp
    }, {
      timeout: 5000 // 5 second timeout for the request
    });
    
    console.log('Webhook response:', response.status, response.data);
    return { success: true, jobId: job.id };
  } catch (error) {
    console.error('Error hitting webhook:', error.message);
    throw new Error(`Failed to hit webhook: ${error.message}`);
  }
});

// Handle completed jobs
webhookQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

// Handle failed jobs
webhookQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error.message);
}); 