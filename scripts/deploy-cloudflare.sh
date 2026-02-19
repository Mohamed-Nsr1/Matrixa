#!/bin/bash

# Matrixa Cloudflare Deployment Script
# Run this script to prepare and deploy to Cloudflare Pages

set -e

echo "🚀 Matrixa Cloudflare Deployment"
echo "================================="

# Check for required tools
echo "📦 Checking prerequisites..."

if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install from https://bun.sh"
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler is not installed. Run: npm install -g wrangler"
    exit 1
fi

# Check for required environment variables
echo "🔍 Checking environment variables..."

required_vars=(
    "DATABASE_URL"
    "JWT_ACCESS_SECRET"
    "JWT_REFRESH_SECRET"
    "NEXT_PUBLIC_APP_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    fi
done

echo "✅ All required environment variables are set"

# Install dependencies
echo "📦 Installing dependencies..."
bun install --frozen-lockfile

# Generate Prisma client
echo "🔧 Generating Prisma client..."
bun run db:generate

# Build for Cloudflare
echo "🏗️ Building application..."
bun run build

# Check if this is a preview or production deployment
if [ "$1" == "preview" ]; then
    echo "🚀 Deploying preview..."
    wrangler pages deploy .next --project-name=matrixa
else
    echo "🚀 Deploying to production..."
    wrangler pages deploy .next --project-name=matrixa --branch=main
fi

echo "✅ Deployment complete!"
echo ""
echo "📋 Post-deployment checklist:"
echo "   1. Verify site loads at your domain"
echo "   2. Test user registration"
echo "   3. Test login functionality"
echo "   4. Verify database connectivity"
echo "   5. Check cron job is running"
echo ""
echo "📊 Monitor your deployment:"
echo "   wrangler pages deployment tail --project-name=matrixa"
