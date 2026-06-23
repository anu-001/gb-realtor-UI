# GB Realtor UI

Production-grade frontend scaffold for the GB & Associates real estate platform.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your local environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Start the app:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - type-safe production build
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint
- `npm run type-check` - run the TypeScript compiler
- `npm run test` - run the Vitest suite
- `npm run test:unit` - run unit tests once
- `npm run test:watch` - run unit tests in watch mode
- `npm run e2e` - run Playwright tests
- `npm run api:types` - regenerate OpenAPI types from `openapi.json`
- `npm run api:sync` - sync `openapi.json` from the backend docs endpoint

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000` |
| `VITE_MAPBOX_TOKEN` | Mapbox access token | `""` |
| `VITE_APP_ENV` | Runtime environment label | `development` |
| `VITE_API_DOCS_URL` | OpenAPI docs URL | `http://localhost:3000/docs.json` |

## Project Structure

- `src/app` - application shell, routes, and layouts
- `src/features` - route-level feature modules
- `src/components` - reusable UI building blocks
- `src/hooks` - shared React hooks
- `src/services` - typed API and backend integration
- `src/store` - Redux Toolkit store and slices
- `src/types` - shared TypeScript contracts
- `src/constants` - enums, permissions, and app constants
- `src/utils` - shared helpers

