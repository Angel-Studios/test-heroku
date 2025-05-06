const Queue = require('bull');
const axios = require('axios');

// Create a Bull queue
const webhookQueue = new Queue('webhook-queue', process.env.REDIS_URL);

console.log('Worker started, waiting for jobs...');

// Process jobs from the queue
webhookQueue.process(async (job) => {
  console.log('Processing job:', job.id, 'Data:', job.data);
  
  try {
    // Hit the webhook URL
    const response = await axios.post('https://3bb9-66-219-246-75.ngrok-free.app/webhook', {
      message: 'Starting to process sketch job',
      jobId: job.id,
      timestamp: job.data.timestamp
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