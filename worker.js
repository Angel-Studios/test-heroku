const Queue = require('bull');
const axios = require('axios');

// Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
console.log('Worker starting, connecting to Redis at:', REDIS_URL.replace(/rediss?:\/\/.*@/, 'redis[s]://***@'));

// Create a Bull queue
const webhookQueue = new Queue('webhook-queue', REDIS_URL);

console.log('Worker initialized, waiting for jobs...');

// Process jobs from the queue
webhookQueue.process(async (job) => {
  console.log(`Processing job ${job.id}:`, job.data);
  
  try {
    // Hit the webhook URL
    const response = await axios.post('https://3bb9-66-219-246-75.ngrok-free.app/webhook', {
      message: 'Testing QUEUE worker 1',
      jobId: job.id,
      timestamp: job.data.timestamp
    }, {
      timeout: 5000 // 5 second timeout for the request
    });
    
    console.log(`Job ${job.id} completed with status:`, response.status);
    console.log(`Response data:`, response.data);
    
    return { 
      success: true, 
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error.message);
    throw new Error(`Failed to hit webhook: ${error.message}`);
  }
});

// Monitor queue events
webhookQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

webhookQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error.message);
});

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await webhookQueue.close();
  process.exit(0);
}); 