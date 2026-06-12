# Aquafit API

Backend API for the Aquafit admin and client applications. Built with Node.js, Express, TypeScript, and MongoDB (Mongoose).

## Production hosting

**This API is deployed on [Koyeb](https://www.koyeb.com/).**

- Set environment variables in the Koyeb dashboard (not via a committed `.env` file).
- Default production port: `8000` (Koyeb maps this to HTTPS).
- After pushing to the connected branch, Koyeb rebuilds and redeploys automatically.

See `.env.example` for the full list of required variables and Koyeb-specific notes.

## Local development

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies: `npm install`
3. Run in dev mode: `npm run start:dev`
4. Build: `npm run build`
5. Run production build locally: `npm start`

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default 8000) | HTTP port |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `MONGO_URI` | Yes | MongoDB connection string |
| `FRONTEND_URL` | Production | Comma-separated UI origin(s) for CORS |

In development, variables are loaded from `.env`. In production on Koyeb, configure them in the service’s **Environment** settings.

## Invoice amounts

Invoice totals are stored on `charge.amount`. Payments are stored in `paymentsApplied[]`, where each entry’s `charge.amount` is the **applied** portion (not necessarily the cash tendered).

Computed fields (not stored in MongoDB):

- **amountDue** — final invoice total after discounts (`charge.amount`)
- **remainingBalance** — `amountDue` minus the sum of applied payment amounts

Overpayments record `amountTendered` and optional `changeDue` on the payment entry; only the applied portion counts toward the balance.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start with ts-node (hot reload via manual restart) |
| `npm run build` | Compile TypeScript and copy locale files |
| `npm start` | Run compiled `dist/server.js` |
