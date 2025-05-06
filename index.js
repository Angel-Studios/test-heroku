const express = require('express');
const Queue = require('bull');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Create a Bull queue
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
console.log('Connecting to Redis at:', REDIS_URL.replace(/rediss?:\/\/.*@/, 'redis[s]://***@'));

// Configure Bull with Redis URL directly
const webhookQueue = new Queue('webhook-queue', REDIS_URL);

// Basic route to trigger the webhook
app.post('/trigger-webhook', async (req, res) => {
  try {
    console.log('Received webhook trigger request');
    
    // Add job to the queue
    const job = await webhookQueue.add({ 
      timestamp: new Date(),
      message: 'Testing QUEUE worker 1'
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

// List all jobs (for debugging)
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await webhookQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
    const simplifiedJobs = jobs.map(job => ({
      id: job.id,
      data: job.data,
      state: job.finishedOn ? 'completed' : job.processedOn ? 'active' : 'waiting'
    }));
    res.json(simplifiedJobs);
  } catch (error) {
    console.error('Error getting jobs:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 