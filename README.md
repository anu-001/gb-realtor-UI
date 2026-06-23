# GB Realtor UI

Frontend for the GB & Associates real estate platform.

## Local Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Run the backend API locally.
5. Start the frontend:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - type-check and build the production bundle
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint
- `npm run type-check` - run the TypeScript compiler
- `npm run test` - run the Vitest suite
- `npm run test:unit` - run unit tests
- `npm run test:integration` - run integration tests
- `npm run test:e2e` - run Playwright tests
- `npm run api:types` - regenerate OpenAPI types from `openapi.json`
- `npm run api:sync` - download the latest OpenAPI spec and regenerate types

## Environment Variables

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the backend API |
| `VITE_APP_ENV` | Runtime environment label |
| `VITE_MAPBOX_TOKEN` | Mapbox access token used by lazy-loaded map features |
| `VITE_API_DOCS_URL` | Backend Swagger/OpenAPI docs URL |

## References

- Backend repository: update this link to your API repository
- Swagger docs: use the URL defined in `VITE_API_DOCS_URL`

## Project Structure

- `src/app` - application shell, layouts, and routing
- `src/features` - route-level feature modules
- `src/components` - shared UI and layout components
- `src/hooks` - reusable React hooks
- `src/services` - API clients and backend adapters
- `src/store` - Redux Toolkit store and slices
- `src/types` - shared TypeScript contracts
- `src/constants` - enums and permissions
- `src/utils` - utility helpers
