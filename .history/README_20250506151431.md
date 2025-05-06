# Heroku Worker App

A simple Node.js application with Express and Bull MQ that runs on Heroku. It includes a web process and a worker process that calls a webhook URL.

## Setup

1. Create a Heroku app:
```
heroku create
```

2. Add Redis to your Heroku app:
```
heroku addons:create heroku-redis:mini
```

3. Deploy to Heroku:
```
git push heroku main
```

4. Ensure both web and worker dynos are running:
```
heroku ps:scale web=1 worker=1
```

## Usage

To trigger the webhook, send a POST request to `/trigger-webhook`:

```
curl -X POST https://your-app-name.herokuapp.com/trigger-webhook
```

This will add a job to the queue, which will be processed by the worker dyno. 