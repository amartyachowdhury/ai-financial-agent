# Setup Guide for AI Financial Agent

Complete guide to set up the AI Financial Agent for personal use.

## Prerequisites

- Node.js 18+ installed ([download here](https://nodejs.org/))
- pnpm package manager (installed automatically in step 1)
- A PostgreSQL database (free options available)
- API keys from services below

## Step-by-Step Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy the template and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` in a text editor and configure the following:

#### Required Variables

##### 1. PostgreSQL Database (REQUIRED)

You need a PostgreSQL database. Free options:

**Option A: Vercel Postgres** (Recommended for ease)
1. Go to [Vercel Storage](https://vercel.com/storage)
2. Create a new Postgres database
3. Copy the `POSTGRES_URL` connection string

**Option B: Supabase** (Free tier available)
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (starts with `postgresql://`)

**Option C: Local PostgreSQL**
If you have PostgreSQL installed locally:
```bash
POSTGRES_URL=postgresql://username:password@localhost:5432/ai_financial_agent
```

Paste your connection string into `.env.local`:
```env
POSTGRES_URL=your-actual-postgres-url-here
```

##### 2. OpenAI API Key (REQUIRED)

1. Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-`)

```env
OPENAI_API_KEY=sk-your-key-here
```

**Note:** The app uses GPT models which cost money. Expect ~$0.01-0.10 per conversation depending on usage.

##### 3. Authentication Secret (REQUIRED)

Generate a random secret for session encryption. Use one of these methods:

**Option A: Online generator**
- Go to https://generate-secret.vercel.app/32

**Option B: Command line**
```bash
openssl rand -base64 32
```

```env
AUTH_SECRET=your-random-secret-here
```

#### Optional Variables

##### Financial Datasets API Key (OPTIONAL)

1. Go to [Financial Datasets](https://financialdatasets.ai/)
2. Sign up for free access
3. Get your API key from the dashboard

```env
FINANCIAL_DATASETS_API_KEY=your-key-here
```

**Note:** Free tier includes AAPL, GOOGL, MSFT, NVDA, TSLA. You can also use the API directly without this key in the UI.

##### LangSmith API Key (OPTIONAL - for debugging)

Only needed if you want to trace LLM calls for debugging:
1. Go to [LangSmith](https://smith.langchain.com/)
2. Sign up and create an API key

```env
LANGCHAIN_API_KEY=your-key-here
LANGCHAIN_TRACING_V2=true
```

### 3. Set Up Database

Run the database migrations to create all required tables:

```bash
pnpm run db:migrate
```

This creates all necessary tables (users, chats, messages, etc.)

### 4. Run the Development Server

```bash
pnpm dev
```

The app should start at [http://localhost:3000](http://localhost:3000)

### 5. Verify Installation

1. Open http://localhost:3000 in your browser
2. You should automatically be logged in (using fingerprint-based auth)
3. Try asking: "What's the current price of AAPL?"
4. If you get stock data, everything is working!

## Troubleshooting

### Database Connection Issues

If you see "POSTGRES_URL is not defined":
1. Make sure `.env.local` exists in the project root
2. Check that the file is named exactly `.env.local` (not `.env.local.txt`)
3. Restart the dev server after changing environment variables

### "Cannot read property of undefined" errors

Make sure all required API keys are set in `.env.local`

### API Key Issues

The app supports two ways to provide API keys:
1. **Environment variables** (`.env.local`) - Recommended for development
2. **Browser localStorage** - You'll see a modal to enter keys when you first use the app

## Next Steps

### Your First Query

Try these example queries:
- "Show me AAPL's financial metrics"
- "Compare MSFT and GOOGL revenue growth"
- "What's the P/E ratio of NVDA?"
- "Find tech stocks with revenue > $50B"

### Understanding the Interface

- **Left panel**: Chat conversation with AI
- **Right panel**: Financial data tables and charts
- **Model selector**: Switch between GPT models (top right)
- **History**: Access previous conversations via sidebar

### Data Access

The app uses the Financial Datasets API. Free tier includes:
- Real-time prices for AAPL, GOOGL, MSFT, NVDA, TSLA
- 30+ years of historical data for these stocks
- Financial statements (income, balance sheet, cash flow)
- Key metrics (P/E, P/B, margins, etc.)

For other stocks, you'll need a paid API key from [Financial Datasets](https://financialdatasets.ai/pricing).

## Deployment (Optional)

To deploy to production on Vercel:

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repo
3. Vercel will automatically detect Next.js
4. Add your environment variables in Vercel dashboard
5. Deploy!

The app uses Vercel Postgres and Blob Storage by default in production.

## Support

- **Issues**: Report bugs on [GitHub Issues](https://github.com/virattt/ai-financial-agent/issues)
- **Documentation**: Check the main [README.md](README.md)
- **Demo**: See a live version at [chat.financialdatasets.ai](https://chat.financialdatasets.ai)

## Security Notes

⚠️ **Never commit your `.env.local` file to Git!**

The `.gitignore` should already exclude it, but double-check before pushing to GitHub.
