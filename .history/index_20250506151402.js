const express = require('express');
const Queue = require('bull');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Create a Bull queue
const webhookQueue = new Queue('webhook-queue', process.env.REDIS_URL);

// Basic route to trigger the webhook
app.post('/trigger-webhook', async (req, res) => {
  try {
    // Add job to the queue
    await webhookQueue.add({ timestamp: new Date() });
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