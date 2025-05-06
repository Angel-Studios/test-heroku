const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// In-memory job queue for demonstration
const jobs = [];

// Basic route to trigger the webhook
app.post('/trigger-webhook', async (req, res) => {
  try {
    console.log('Received webhook trigger request');
    
    // Create a job
    const jobId = Date.now().toString();
    const job = { 
      id: jobId,
      timestamp: new Date(),
      message: 'Starting to process sketch job',
      status: 'pending'
    };
    
    // Add job to in-memory queue
    jobs.push(job);
    
    console.log('Job created:', jobId);
    
    // Send the response immediately
    res.json({ success: true, message: 'Webhook job added to queue', jobId });
    
    // Process the job asynchronously
    setTimeout(async () => {
      try {
        job.status = 'processing';
        
        // Hit the webhook URL
        const response = await axios.post('https://3bb9-66-219-246-75.ngrok-free.app/webhook', {
          message: job.message,
          jobId: job.id,
          timestamp: job.timestamp
        }, {
          timeout: 5000 // 5 second timeout for the request
        });
        
        job.status = 'completed';
        job.result = {
          status: response.status,
          data: response.data
        };
        
        console.log(`Job ${jobId} completed:`, response.status);
      } catch (error) {
        job.status = 'failed';
        job.error = error.message;
        console.error(`Job ${jobId} failed:`, error.message);
      }
    }, 100); // Small delay to process after response is sent
    
  } catch (error) {
    console.error('Error processing webhook request:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get job status
app.get('/job/:id', (req, res) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

// List jobs
app.get('/jobs', (req, res) => {
  res.json(jobs);
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 