# Project Title

[![CI](https://github.com/${{github.repository}}/actions/workflows/ci.yml/badge.svg)](https://github.com/${{github.repository}}/actions/workflows/ci.yml)

This repository contains the ...

## Backend

### Setup
```bash
cd backend
npm install
```

### Running the server
```bash
npm run dev
```
Server will listen on port `8080` by default.

### Scraping data
```bash
npm run scrape
```
This will fetch the five configured pages and store the extracted content in `backend/data/portfolio.db`.

### API Endpoints
- `GET /static-data/:page` – Returns all scraped content for the given page identifier.
- `GET /entity/:id` – Returns a single entity (heading, paragraph, list, or image) by its database ID.
- `POST /chat` – Accepts a JSON body `{ prompt: string }`. Returns `{ message: string, position?: number, tool?: any }`. The endpoint builds a system prompt grounded to the portfolio DB, calls a mock LLM, parses optional JSON tool calls, and enforces per‑IP concurrency limiting (max 2 concurrent) with a FIFO queue that provides a `position` field for queued requests. Starter prompts are cached for fast responses (<100 ms).

### Tests
```bash
npm test
```
Runs Jest + Supertest suite covering the API and scraper logic.

## Deployment

### Docker

```bash
# Build the backend Docker image
docker build -t gach-backend .

# Run the container (example configuration)
# Adjust LLM_URL, PORT, and NODE_ENV as needed
docker run -p 8080:8080 \
  -e LLM_URL=http://your-llm-service \
  -e PORT=8080 \
  -e NODE_ENV=production \
  gach-backend
```

The container will start the backend server on the specified `PORT`. A health check endpoint is available at `http://localhost:<PORT>/health` and should return a JSON response like `{"status":"ok"}`.

### Netlify deployment

The frontend is exported as a static site (`npm run build && npm run export`). CI automatically deploys the `out/` folder to Netlify. After a successful workflow run, the site will be available at the Netlify URL (e.g., `https://gach.netlify.app`). Verify the deployment by opening the URL and confirming that the chat UI loads and can communicate with the backend container.

