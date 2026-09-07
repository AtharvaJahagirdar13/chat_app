# Deployment

Deploy the backend as a Node container, the frontend as static files, MongoDB on Atlas, and image storage on Cloudinary. Do not place credentials in the image or frontend build variables.

## Backend container

Build from the repository root:

```sh
docker build -t chat-app-backend ./backend
```

Create a local `backend/.env.production` file (it is gitignored), then run:

```sh
docker run --rm --name chat-app-backend -p 5002:5002 --env-file backend/.env.production chat-app-backend
```

Required production variables:

- `MONGODB_URI`: Atlas connection string; permit the deployment network and use a least-privilege database user.
- `JWT_SECRET`: random secret of at least 32 characters.
- `CLIENT_ORIGIN`: exact HTTPS frontend origin, with no wildcard.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: server-side Cloudinary credentials.

Optional variables:

- `PORT` (default `5002`)
- `JSON_BODY_LIMIT` (default `2mb`)
- `COOKIE_SAME_SITE` (default `strict`)

Keep `COOKIE_SAME_SITE=strict` when frontend and API use same-site custom domains such as `app.example.com` and `api.example.com`. For genuinely cross-site HTTPS hosting, set it to `none`; production cookies remain `HttpOnly` and `Secure`. Never use wildcard credentialed CORS.

Health check: `GET /api/health` returns `{ "status": "ok" }`.

## Frontend static build

Set these build-time variables on the static host:

```text
VITE_API_URL=https://api.example.com/api
VITE_SOCKET_URL=https://api.example.com
```

Then build:

```sh
npm ci --prefix frontend
npm run build --prefix frontend
```

Publish `frontend/dist/` on a static host with SPA fallback routing to `index.html`. Set backend `CLIENT_ORIGIN` to the exact deployed frontend origin.

## Conversation migration

Never run migration automatically during server startup. Back up the database, then run the dry run first:

```sh
npm run migrate:conversations:dry-run --prefix backend
```

Review duplicate keys and every orphan record. Execute intentionally only after review:

```sh
npm run migrate:conversations --prefix backend
```
