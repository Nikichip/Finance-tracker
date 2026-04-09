# Finance Tracker — Backend

## Project structure

```
src/
  index.js                 ← Express server entry point
  db/index.js              ← PostgreSQL connection + schema
  middleware/auth.js        ← JWT verification middleware
  routes/auth.js            ← POST /auth/signup, POST /auth/login, GET /auth/me
  routes/transactions.js    ← GET/POST/DELETE /transactions  (JWT protected)
api.js                     ← Drop into your frontend HTML to call the API
.env.example               ← Copy to .env and fill in your values
```

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/signup | No | Create account → returns JWT |
| POST | /auth/login | No | Login → returns JWT |
| GET | /auth/me | Bearer JWT | Get current user |
| GET | /transactions | Bearer JWT | List user's transactions |
| POST | /transactions | Bearer JWT | Add a transaction |
| DELETE | /transactions/:id | Bearer JWT | Delete a transaction |

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your values
cp .env.example .env

# 3. Create the database (PostgreSQL must be running)
createdb finance_tracker

# 4. Start the server (tables are created automatically on first run)
npm run dev
```

## Deploy to Render (free tier)

1. Push this folder to a GitHub repo
2. Go to render.com → New → Web Service → connect your repo
3. Set build command: `npm install`
4. Set start command: `node src/index.js`
5. Add environment variables from .env.example in Render's dashboard
6. Add a free PostgreSQL database in Render → copy the connection string to DATABASE_URL
7. Update `API_URL` in `api.js` to your Render URL

## How JWT auth works

1. User signs up or logs in → server creates a signed JWT containing `{ userId }`
2. Frontend stores the token in localStorage
3. Every subsequent request sends `Authorization: Bearer <token>` in headers
4. `middleware/auth.js` verifies the token and sets `req.userId`
5. Transaction routes use `req.userId` to only touch that user's data
