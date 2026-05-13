#!/bin/bash

echo "=== Environment Variables Validation ===\n"

# Check POSTGRES_URL
if grep -q "POSTGRES_URL=postgresql://" .env.local; then
  echo "✅ POSTGRES_URL: Valid format (Supabase detected)"
else
  echo "❌ POSTGRES_URL: Invalid format"
fi

# Check AUTH_SECRET
if grep -q "^AUTH_SECRET=your-random-secret-here" .env.local; then
  echo "❌ AUTH_SECRET: Still using placeholder - needs to be set!"
elif grep -q "^AUTH_SECRET=" .env.local; then
  echo "✅ AUTH_SECRET: Set"
else
  echo "❌ AUTH_SECRET: Missing"
fi

# Check OPENAI_API_KEY
if grep -q "^OPENAI_API_KEY=sk-proj-" .env.local; then
  echo "✅ OPENAI_API_KEY: Valid format (OpenAI detected)"
else
  echo "❌ OPENAI_API_KEY: Invalid or missing"
fi

# Check FINANCIAL_DATASETS_API_KEY
if grep -q "^FINANCIAL_DATASETS_API_KEY=" .env.local && ! grep -q "^FINANCIAL_DATASETS_API_KEY=$" .env.local; then
  echo "✅ FINANCIAL_DATASETS_API_KEY: Set"
else
  echo "⚠️  FINANCIAL_DATASETS_API_KEY: Optional (not set)"
fi

# Check LANGCHAIN_API_KEY
if grep -q "^LANGCHAIN_API_KEY=" .env.local && ! grep -q "^LANGCHAIN_API_KEY=$" .env.local; then
  echo "✅ LANGCHAIN_API_KEY: Set (optional)"
else
  echo "⚠️  LANGCHAIN_API_KEY: Optional (not set)"
fi

echo "\n=== Summary ==="
echo "Please update AUTH_SECRET to: 9e9gpDn444BpuNWxj+PFFavx5Pw1vF31UE7P+L0VnsA="
