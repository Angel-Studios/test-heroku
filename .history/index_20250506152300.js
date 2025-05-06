const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Basic route to trigger the webhook
app.post('/trigger-webhook', async (req, res) => {
  try {
    console.log('Received webhook trigger request');
    
    // Directly hit the webhook URL
    const response = await axios.post('https://3bb9-66-219-246-75.ngrok-free.app/webhook', {
      message: 'Starting to process sketch job',
      timestamp: new Date()
    }, {
      timeout: 5000 // 5 second timeout for the request
    });
    
    console.log('Webhook response:', response.status, response.data);
    res.json({ success: true, message: 'Webhook called successfully' });
  } catch (error) {
    console.error('Error hitting webhook:', error.message);
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