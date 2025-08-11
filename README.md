# Personal Finance App

A modern AI-powered personal finance management application built with Next.js, Supabase, and Plaid.

## Features

- 🏦 **Bank Account Integration** - Connect multiple bank accounts via Plaid
- 💳 **Transaction Management** - Auto-import and categorize transactions
- 🤖 **AI Financial Assistant** - Chat-based insights and analysis
- 📊 **Spending Insights** - Track spending by category with visualizations
- 💰 **Budget Management** - Set and monitor monthly budgets
- 🔄 **Auto-categorization** - Rules-based transaction categorization
- 📱 **Mobile-responsive** - Works seamlessly on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), Edge Functions
- **Auth**: Google OAuth via Supabase
- **Banking**: Plaid API
- **AI**: OpenAI GPT-4o-mini
- **Deployment**: Vercel

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. Supabase account and project
3. Plaid account (sandbox for development)
4. OpenAI API key
5. Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/swilhoit/personal-finance.git
cd personal-finance
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
- Supabase URL and keys
- Plaid client ID and secret
- OpenAI API key

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment to Vercel

1. Push your code to GitHub

2. Connect your GitHub repo to Vercel

3. Add environment variables in Vercel dashboard:
   - All variables from `.env.local`
   - Set `PLAID_ENV` to `sandbox` for testing or `production` for live
   - Update `PLAID_WEBHOOK_URL` to your Vercel domain

4. Deploy!

## Database Setup

The app uses Supabase with the following schema:

- **profiles** - User profiles
- **plaid_items** - Connected banks
- **plaid_accounts** - Bank accounts
- **transactions** - Financial transactions
- **categories** - Transaction categories
- **budgets** - Monthly budgets
- **category_rules** - Auto-categorization rules
- **recurring_merchants** - Detected recurring payments

Run the SQL migrations in your Supabase dashboard to set up the schema.

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Plaid
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
PLAID_WEBHOOK_URL=

# OpenAI
OPENAI_API_KEY=
```

## License

MIT