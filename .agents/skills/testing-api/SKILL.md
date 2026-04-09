# Testing sistema-preventa API

How to set up and test the pre-sale system API locally.

## Devin Secrets Needed

No external secrets required for local testing. The app uses a local PostgreSQL database.

For testing against production/staging Supabase, you would need:
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `RESEND_API_KEY` — For email notifications (optional, emails will fail gracefully during testing)

## Local Environment Setup

1. **Start PostgreSQL:**
   ```bash
   sudo pg_ctlcluster 14 main start
   ```

2. **Create local DB (if not exists):**
   ```bash
   sudo -u postgres psql -c "CREATE USER preventa WITH PASSWORD 'preventa123' CREATEDB;" || true
   sudo -u postgres psql -c "CREATE DATABASE preventa_test OWNER preventa;" || true
   ```

3. **Create `.env` file** (do NOT commit this):
   ```
   DATABASE_URL="postgresql://preventa:preventa123@localhost:5432/preventa_test"
   JWT_SECRET="test-secret-key-min-32-characters-long-for-dev!!"
   REFRESH_SECRET="test-refresh-secret-key-min-32-characters-long!!"
   RESEND_API_KEY="re_placeholder_not_real"
   ADMIN_EMAIL="admin@test.local"
   NODE_ENV="development"
   ```

4. **Push schema and seed:**
   ```bash
   npx prisma db push
   npx ts-node prisma/seed.ts
   ```

5. **Start dev server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3000`

## Key API Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/products` | GET | Public | List available products (cached 1h) |
| `/api/orders` | POST | Public | Create order |
| `/api/orders` | GET | Public | List all orders |
| `/api/orders/[code]/upload-comprobante` | POST | Public | Upload payment receipt |
| `/api/orders/[code]/validate` | POST | Admin | Validate payment |
| `/api/orders/[code]/reject` | POST | Admin | Reject payment |
| `/api/auth/login` | POST | Public | Login (returns JWT cookies) |

## Testing Patterns

### Creating an Order (POST /api/orders)
```bash
curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerEmail": "unique-email@test.com",
    "customerPhone": "+5491112345678",
    "items": [{"productId": "agua-mineral", "quantity": 2}],
    "total": 6000
  }'
```

### Verifying Stock via Database
The products API uses server-side caching (1h TTL), so query the DB directly for accurate stock:
```bash
PGPASSWORD=preventa123 psql -U preventa -d preventa_test -h localhost -t \
  -c "SELECT stock FROM products WHERE id='agua-mineral';"
```

### Rate Limiting Considerations
- **2 orders per email per hour** — use unique emails for each test
- **5 orders per IP per hour** — may hit this with many tests
- **1 order per email per 5 minutes** — deduplication window

## Seeded Test Data

### Products (available)
- `agua-mineral` — $3,000, stock: 300
- `coca-cola-lata` — $6,000, stock: 250
- `quilmes-lata` — $6,000, stock: 200
- `stella-artois` — $7,000, stock: 180
- `remera-diez` — $15,000, stock: 100 (sizes: S/M/L/XL)
- `entrada-envio` — $35,000, stock: 500
- `combo-fernet-coca` — $40,000, stock: 80
- `fernet-medianol` — $8,000, stock: 120
- `pack-quilmes-4` — $24,000, stock: 150

### Admin Login (seeded)
- Email: `admin@preventa.local`, Password: `admin123`
- Staff: `staff1@preventa.local` / `staff2@preventa.local`, Password: `staff123`

## Known Issues

- **ESLint broken:** `npm run lint` fails due to eslint v10 vs eslint-plugin-react compatibility. Use `npx tsc --noEmit` for type checking instead.
- **Products API caching:** `GET /api/products` caches for 1 hour. Use `POST /api/products` to invalidate, or query DB directly.
- **Email sending:** Will fail with placeholder API key but won't crash order creation (emails are only sent in upload-comprobante flow, not during order creation).
- **Middleware deprecation warning:** Next.js 16 shows a warning about middleware being deprecated in favor of proxy. The middleware still works.
