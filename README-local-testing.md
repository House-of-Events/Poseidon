# Local Testing Setup for Fixtures Daily Worker

This guide will help you set up and run the fixtures daily worker locally for testing purposes.

## Prerequisites

- Docker and Docker Compose installed
- Node.js (version 16 or higher)
- npm

## Quick Start

1. **Start the local infrastructure:**
   ```bash
   npm run docker:up
   ```
   This starts:
   - PostgreSQL database (port 5429)
   - LocalStack (SQS emulator on port 4566)
   - pgAdmin (optional, port 8080)

2. **Set up the local SQS queue:**
   ```bash
   npm run setup:local
   ```

3. **Run the worker:**
   ```bash
   npm run start:local
   ```

4. **Send test messages (in another terminal):**
   ```bash
   npm run send:test
   ```

## Manual Steps

If you prefer to run steps manually:

### 1. Start Docker Services
```bash
docker-compose up -d
```

### 2. Wait for services to be ready
```bash
# Check if services are running
docker-compose ps
```

### 3. Set up SQS Queue
```bash
NODE_ENV=local node scripts/setup-local-sqs.js
```

### 4. Run the Worker
```bash
NODE_ENV=local node workers/route-fixtures-daily/worker.js
```

### 5. Send Test Messages
```bash
NODE_ENV=local node scripts/send-test-message.js
```

## Configuration

The local setup uses the following configuration (`config/local.js`):

- **Database**: PostgreSQL on localhost:5429
- **SQS**: LocalStack on localhost:4566
- **Queue URL**: `http://localhost:4566/000000000000/fixtures-daily-queue`

## Environment Variables

You can override defaults by setting these environment variables:

```bash
export NODE_ENV=local
export DB_HOST=localhost
export DB_PORT=5429
export DB_NAME=poseidon-docker
export DB_USER=admin
export DB_PASSWORD=admin
export SQS_FIXTURES_DAILY_QUEUE_URL=http://localhost:4566/000000000000/fixtures-daily-queue
```

## Database Access

- **PostgreSQL**: `localhost:5429`
  - Database: `poseidon-docker`
  - Username: `admin`
  - Password: `admin`

- **pgAdmin**: `http://localhost:8080`
  - Email: `admin@poseidon.local`
  - Password: `admin`

## Troubleshooting

### Worker not connecting to database
- Ensure PostgreSQL is running: `docker-compose ps`
- Check database connection: `docker-compose logs postgres`

### Worker not receiving messages
- Ensure LocalStack is running: `docker-compose ps`
- Check SQS setup: `docker-compose logs localstack`
- Verify queue exists: `npm run setup:local`

### Clean up
```bash
# Stop all services
npm run docker:down

# Remove volumes (will delete all data)
docker-compose down -v
```

## Development Workflow

1. Start services: `npm run docker:up`
2. Set up queue: `npm run setup:local`
3. Run worker: `npm run start:local`
4. Send test data: `npm run send:test`
5. Monitor logs and database
6. Stop when done: `npm run docker:down` 