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
- `POST /chat` – Accepts JSON `{prompt}` and returns `{message, position?, tool?}`. Includes DB‑grounded system prompt, caching, and per‑IP concurrency limiting (max 2 concurrent).

### Tests
```bash
npm test
```
Runs Jest + Supertest suite covering the API and scraper logic.

