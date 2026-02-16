# Inkuity Platform - Setup Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Vercel account (for deployment)

## Step 1: Clone and Install

```bash
# Navigate to the project directory
cd inkuity.com

# Install dependencies
npm install
```

## Step 2: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down:
   - Project URL
   - Project API Keys (anon key)
   - Service Role Key (in Project Settings > API)

### Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a **New Query**
4. Copy the contents of `database-schema.sql`
5. Run the query

This will create all tables, indexes, triggers, and RLS policies.

## Step 3: Environment Variables

Create a `.env.local` file in the root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the values with your actual Supabase credentials.

## Step 4: Configure OAuth (Optional but Recommended)

1. In Supabase Dashboard, go to **Authentication > Providers**
2. Enable **Google**
3. Add your Google OAuth credentials
4. Set the callback URL: `https://your-domain.com/api/auth/callback`

## Step 5: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Step 6: Deploy to Vercel

### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Using Vercel Dashboard

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel Dashboard
4. Deploy

## Testing the QR Code Flow

1. **Register/Login** as a gym owner
2. **Create a Gym** - Go to Dashboard > Gyms > Add Gym
3. **Create QR Code** - Go to Dashboard > QR Codes > Create QR Code
4. **Scan QR Code** - Use your phone to scan the generated QR code
5. **Track Analytics** - View scans in Dashboard > Analytics

## Folder Structure

```
inkuity.com/
├── app/                    # Next.js app router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected dashboard
│   ├── (landing)/         # Public landing pages
│   ├── [slug]/            # Public gym landing pages
│   ├── api/               # API routes
│   └── s/[code]/          # QR scan handler
├── components/             # React components
│   ├── dashboard/         # Dashboard components
│   ├── auth/              # Auth components
│   ├── landing/           # Landing page components
│   └── ui/                # UI components
├── lib/                   # Utilities
│   ├── actions/           # Server Actions
│   ├── supabase/          # Supabase clients
│   └── utils/             # Utilities
├── types/                 # TypeScript types
└── database-schema.sql    # Supabase schema
```

## Troubleshooting

### Supabase Auth Issues
- Check that your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Ensure callback URLs are configured in Supabase Auth settings
- Verify RLS policies are set up correctly

### Database Issues
- Run the schema SQL again if tables are missing
- Check Supabase logs in the dashboard

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Clear cache: `rm -rf .next node_modules && npm install`

## Next Steps

1. Set up email notifications for new check-ins
2. Add Stripe integration for billing
3. Create member portal for self-service
4. Add more QR code customization options

## Support

For issues and questions:
- Check the README.md
- Create an issue in your repository
- Review Supabase documentation
