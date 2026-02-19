# Matrixa Setup Guide

> Complete installation and configuration guide for Matrixa

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running Locally](#running-locally)
6. [Production Deployment](#production-deployment)
7. [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| Bun | 1.0+ | Package manager (recommended) |
| Git | Latest | Version control |

### Recommended Tools

| Tool | Purpose |
|------|---------|
| VS Code | Code editor |
| Prisma VS Code Extension | Schema highlighting |
| SQLite Viewer | Database inspection |

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for dependencies
- **OS**: macOS, Linux, or Windows 10+

---

## Installation Steps

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd matrixa
```

### Step 2: Install Dependencies

Using Bun (recommended):
```bash
bun install
```

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

### Step 3: Set Up Environment Variables

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secrets (generate secure 32+ character strings)
JWT_ACCESS_SECRET="your-access-secret-key-at-least-32-characters-long"
JWT_REFRESH_SECRET="your-refresh-secret-key-at-least-32-characters-long"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Matrixa"
```

### Step 4: Initialize Database

```bash
# Push schema to database
bun run db:push

# Seed initial data
bun run db:seed
```

### Step 5: Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

---

## Database Setup

### Development (SQLite)

SQLite is used by default for development. No additional setup required.

Database file location: `prisma/dev.db`

### Production (PostgreSQL)

#### Option 1: Local PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # macOS (Homebrew)
   brew install postgresql
   brew services start postgresql

   # Ubuntu/Debian
   sudo apt install postgresql
   sudo systemctl start postgresql

   # Windows
   # Download from https://www.postgresql.org/download/
   ```

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql postgres

   # Create database
   CREATE DATABASE matrixa;

   # Create user (optional)
   CREATE USER matrixa_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE matrixa TO matrixa_user;
   ```

3. **Update `.env`**
   ```env
   DATABASE_URL="postgresql://matrixa_user:your_password@localhost:5432/matrixa"
   ```

4. **Run Migrations**
   ```bash
   bun run db:push
   bun run db:seed
   ```

#### Option 2: Cloud Database (Supabase, Neon, etc.)

1. **Create a new project** on your preferred platform
2. **Copy the connection string**
3. **Update `.env`**:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
   ```

### Database Commands

```bash
# Push schema changes (development)
bun run db:push

# Generate Prisma client
bun run db:generate

# Create migration
bun run db:migrate

# Reset database (warning: deletes all data)
bun run db:reset

# Open Prisma Studio (database GUI)
bunx prisma studio
```

---

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | 32+ character string |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | 32+ character string |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Matrixa` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PAYMOB_API_KEY` | Paymob API key | - |
| `PAYMOB_INTEGRATION_ID` | Paymob integration ID | - |
| `PAYMOB_IFRAME_ID` | Paymob iframe ID | - |
| `PAYMOB_HMAC_SECRET` | Paymob HMAC secret | - |

### Generating JWT Secrets

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64

# Using Bun
bun -e "console.log(crypto.randomUUID() + crypto.randomUUID())"
```

---

## Running Locally

### Development Mode

```bash
bun run dev
```

Features:
- Hot reload enabled
- Detailed error messages
- Source maps enabled

### Production Mode (Local)

```bash
# Build application
bun run build

# Start production server
bun run start
```

### Development with Database GUI

```bash
# Terminal 1: Run application
bun run dev

# Terminal 2: Open Prisma Studio
bunx prisma studio
```

---

## Production Deployment

### Pre-deployment Checklist

- [ ] Set secure JWT secrets (32+ characters)
- [ ] Configure PostgreSQL database
- [ ] Set `NODE_ENV=production`
- [ ] Configure payment gateway (Paymob)
- [ ] Set up SSL/HTTPS
- [ ] Configure email service (optional)
- [ ] Set up monitoring and logging

### Build for Production

```bash
# Install dependencies
bun install --frozen-lockfile

# Generate Prisma client
bun run db:generate

# Build application
bun run build

# Start server
bun run start
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM oven/bun:1 AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:generate
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t matrixa .
docker run -p 3000:3000 matrixa
```

### Vercel Deployment

1. **Connect Repository** to Vercel
2. **Configure Environment Variables** in Vercel dashboard
3. **Deploy**

Note: Vercel serverless functions have limitations with SQLite. Use PostgreSQL.

### VPS Deployment (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start bun --name matrixa -- run start

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

---

## Common Issues

### Database Issues

#### "Database connection failed"

**Problem**: Cannot connect to database

**Solutions**:
1. Verify `DATABASE_URL` is correct
2. For PostgreSQL, ensure the server is running
3. Check firewall settings
4. Verify credentials

#### "Prisma Client not generated"

**Problem**: Prisma Client is missing

**Solution**:
```bash
bun run db:generate
```

#### "Migration failed"

**Problem**: Schema changes not applying

**Solution**:
```bash
# Reset database (warning: deletes all data)
bun run db:reset

# Or manually fix migrations
rm -rf prisma/migrations
bun run db:push
```

### Authentication Issues

#### "Invalid token"

**Problem**: JWT verification fails

**Solutions**:
1. Verify `JWT_ACCESS_SECRET` matches between sessions
2. Clear browser cookies
3. Check token expiration (15 minutes default)

#### "Session expired"

**Problem**: Refresh token expired

**Solution**:
- Log in again
- Refresh tokens expire after 7 days

### Build Issues

#### "Module not found"

**Problem**: Dependencies missing

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules bun.lock
bun install
```

#### "Type errors"

**Problem**: TypeScript compilation fails

**Solution**:
```bash
# Regenerate Prisma types
bun run db:generate

# Check for type errors
bun run lint
```

### Runtime Issues

#### "API rate limited"

**Problem**: Too many requests

**Solution**:
- Implement rate limiting (future feature)
- Check for infinite loops in components

#### "Memory exceeded"

**Problem**: Server running out of memory

**Solutions**:
1. Increase Node.js memory limit:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" bun run dev
   ```
2. Optimize database queries
3. Implement pagination for large lists

---

## Getting Help

1. **Check Documentation**: Review other docs in `/docs/`
2. **Check Worklog**: See `worklog.md` for known issues
3. **Check Features**: See `FEATURES_CHECKLIST.md` for status
4. **Create Issue**: Submit detailed bug report

---

## Next Steps

After successful setup:

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system
2. Read [API.md](API.md) to understand the endpoints
3. Read [EXTENDING.md](EXTENDING.md) to learn how to add features

---

*Last updated: 2025-01-18*
