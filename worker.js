const Queue = require('bull');
const axios = require('axios');
const throng = require('throng');
const Redis = require('ioredis');

// Set up worker configuration
const workers = process.env.WEB_CONCURRENCY || 2;
const maxJobsPerWorker = 50;

// Redis connection
const redisURL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

function start() {
  console.log(`Worker started with concurrency: ${workers}`);
  console.log('Redis URL detected:', redisURL.replace(/rediss?:\/\/.*@/, 'redis[s]://***@'));

  // Configure Redis client with TLS options if needed
  const redisOptions = {
    tls: redisURL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    connectTimeout: 10000
  };

  // Create Bull queue
  const webhookQueue = new Queue('webhook-queue', {
    createClient: (type) => {
      return new Redis(redisURL, redisOptions);
    },
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

  // Handle Redis connection events
  webhookQueue.on('error', (error) => {
    console.error('Queue error:', error.message);
  });

  webhookQueue.on('ready', () => {
    console.log('Queue is ready');
  });

  // Process jobs from the queue
  webhookQueue.process(maxJobsPerWorker, async (job) => {
    console.log(`Processing job ${job.id}`, job.data);
    
    try {
      // Hit the webhook URL
      const response = await axios.post('https://3bb9-66-219-246-75.ngrok-free.app/webhook', {
        message: 'Starting to process sketch job',
        jobId: job.id,
        timestamp: job.data.timestamp
      }, {
        timeout: 5000 // 5 second timeout for the request
      });
      
      console.log(`Job ${job.id} completed:`, response.status, response.data);
      return { success: true, status: response.status };
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

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...');
    await webhookQueue.close();
    process.exit(0);
  });
}

// Start the worker cluster
throng({ workers, start }); 