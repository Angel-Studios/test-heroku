# Heroku Webhook POC

A simple Node.js application that demonstrates webhook processing in a Heroku environment. This is a proof of concept for a background job processing system.

## Simplified Architecture

For this POC, we're using a simplified architecture:

1. Express web server that receives webhook trigger requests
2. In-memory job queue for demonstration purposes
3. Asynchronous job processing using setTimeout

The app simulates a job queue system without external dependencies, making it simple to understand and deploy.

## Setup

1. Create a Heroku app:
```
heroku create
```

2. Deploy to Heroku:
```
git push heroku main
```

## Usage

To trigger a webhook, send a POST request to `/trigger-webhook`:

```
curl -X POST https://your-app-name.herokuapp.com/trigger-webhook
```

This will add a job to the in-memory queue and process it asynchronously, calling the configured webhook URL.

## Monitoring

You can use the following endpoints to monitor jobs:

- `GET /jobs` - List all jobs
- `GET /job/:id` - Get status of a specific job
- `GET /` - Health check endpoint

You can also view the logs:

```
heroku logs --tail
``` 