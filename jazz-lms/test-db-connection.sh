#!/bin/bash

# Supabase Connection Test Script
# This script tests the database connection and provides troubleshooting info

echo "🔍 Testing Supabase Database Connection..."
echo ""
echo "⚠️  Note: Most Supabase databases are IPv6-only and won't be reachable from IPv4 networks."
echo "    This is normal. Use the Session Pooler instead."
echo ""

# Load environment variables
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
fi

# Extract host from DATABASE_URL if available
if [ -n "$DATABASE_URL" ]; then
    DB_HOST=$(printf '%s\n' "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    echo "Testing connection to: $DB_HOST"
    echo ""

    # Test Session Pooler connection
    echo "1️⃣ Testing Session Pooler connection..."
    timeout 5 nc -zv "$DB_HOST" 5432 2>&1 | grep -q "succeeded" && echo "✅ Session Pooler is reachable" || echo "❌ Session Pooler is not reachable from this network"
else
    echo "⚠️  DATABASE_URL not found in .env file"
fi

echo ""
echo "📋 Troubleshooting Options:"
echo ""
echo "If connection is not reachable from your machine:"
echo ""
echo "Option 1: Use Supabase SQL Editor (RECOMMENDED)"
echo "  • Open: https://supabase.com/dashboard → Your Project → SQL Editor"
echo "  • Copy the SQL from: supabase-migration.sql"
echo "  • Paste and run in the SQL Editor"
echo "  • See: SUPABASE_DATABASE_SETUP.md for detailed instructions"
echo ""
echo "Option 2: Enable IPv4/Port Access"
echo "  • Your network might be blocking PostgreSQL ports"
echo "  • Try a different network or VPN"
echo "  • Check firewall settings"
echo ""
echo "Option 3: Use Vercel to Run Migration"
echo "  • Deploy your app to Vercel first"
echo "  • Vercel will be able to connect to Supabase"
echo "  • Use Vercel's environment to run: npx prisma db push"
echo ""
echo "✨ Next Steps:"
echo "  1. Run the SQL migration in Supabase (see SUPABASE_DATABASE_SETUP.md)"
echo "  2. Configure Vercel environment variables (see VERCEL_SETUP.md)"
echo "  3. Deploy to Vercel"
echo ""

