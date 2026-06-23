# Setup Guide

## From Zero

1. Install Node.js 22 or newer.
2. Clone the repository.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```
5. Fill in `VITE_API_BASE_URL`, `VITE_MAPBOX_TOKEN`, and `VITE_API_DOCS_URL`.
6. Run the backend API locally.
7. Start the frontend:
   ```bash
   npm run dev
   ```

## Running With Docker

1. Build the image with your preferred Dockerfile.
2. Pass the environment variables through your compose file or container runtime.
3. Expose the Vite preview port if you are serving the built frontend.

## Running Frontend and Backend Together

1. Start the backend API first.
2. Start the frontend with `npm run dev`.
3. Confirm the frontend points at the backend via `VITE_API_BASE_URL`.

## Regenerating API Types

After backend contract changes:

```bash
npm run api:sync
```

If you already have the updated `openapi.json`:

```bash
npm run api:types
```
