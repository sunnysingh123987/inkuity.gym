# Inkuity Gym QR Code Platform

A comprehensive SaaS platform for gym owners to generate QR codes, track member check-ins, and view detailed analytics.

## Features

### For Gym Owners
- **Gym Management**: Create and manage multiple gym locations
- **QR Code Generation**: Create customizable QR codes for different purposes (check-in, equipment, classes)
- **Member Management**: Track and manage gym members
- **Analytics Dashboard**: View detailed scan analytics including:
  - Total scans and unique visitors
  - Hourly/daily/weekly trends
  - Device and location breakdowns
  - Peak hours identification
  - Conversion tracking
- **Export Reports**: Download analytics reports in various formats

### For Gym Members
- **Easy Check-in**: Scan QR codes for quick gym access
- **Personal Dashboard**: View visit history and analytics
- **Membership Management**: Track membership status

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **QR Generation**: `qrcode` library
- **User Agent Parsing**: `ua-parser-js`
- **Hosting**: Vercel

## Database Schema

### Core Tables

1. **profiles** - Extended user profiles for gym owners
2. **gyms** - Gym locations managed by owners
3. **qr_codes** - QR code configurations and metadata
4. **members** - Gym members/customers
5. **scans** - Scan events with detailed tracking data
6. **check_ins** - Check-in records for gym visits
7. **daily_analytics** - Pre-aggregated daily statistics

See `database-schema.sql` for complete schema with indexes, RLS policies, and functions.

## Project Structure

```
app/
├── (auth)/           # Login, register, reset password
├── (dashboard)/      # Protected dashboard routes
│   ├── dashboard/    # Overview
│   ├── gyms/         # Gym management
│   ├── qr-codes/     # QR code management
│   ├── members/      # Member management
│   ├── analytics/    # Analytics & reports
│   └── settings/     # Account settings
├── (landing)/        # Public pages
├── [slug]/           # Public gym landing pages
└── s/[code]/         # QR scan handler (tracking endpoint)

lib/
├── actions/          # Server Actions
├── utils/            # Utilities (QR, analytics)
├── supabase/         # Supabase clients
└── types/            # TypeScript types
```

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key
3. Get your service role key (for server-side operations)

### 2. Run Database Migrations

Copy the contents of `database-schema.sql` into the Supabase SQL Editor and run it.

Alternatively, use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## QR Code Flow

1. **Gym Owner Creates QR Code**
   - Goes to Dashboard → QR Codes → Create New
   - Sets name, type, colors, optional redirect URL
   - System generates unique code: `GYM-{timestamp}-{random}`

2. **QR Code Scanned**
   - User scans QR code at `https://inkuity.com/s/GYM-XXX`
   - System records:
     - QR code ID and gym ID
     - Device type, browser, OS
     - IP address and geolocation
     - Referrer and UTM parameters
     - Timestamp

3. **Redirect to Landing Page**
   - User redirected to gym's public page: `https://inkuity.com/{gym-slug}`
   - Query params included for tracking: `?scan_id=xxx&qr_code=GYM-XXX`

4. **Analytics Available**
   - Gym owner sees scan in real-time
   - Dashboard shows trends and insights
   - Can export reports

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/s/[code]` | GET | QR code scan handler (tracking + redirect) |
| `/api/auth/callback` | GET | OAuth callback handler |
| `/api/webhooks/supabase` | POST | Supabase webhook handler |

## Server Actions

All mutations use Next.js Server Actions for secure database operations:

- `createGym()` - Create new gym
- `updateGym()` - Update gym details
- `createQRCode()` - Generate new QR code
- `getAnalyticsSummary()` - Get analytics for dashboard
- `trackScan()` - Record a scan event

## Security

- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication**: Supabase Auth with email/password and OAuth
- **Validation**: Zod schema validation on all inputs
- **Rate Limiting**: Built into Next.js Route Handlers

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Supabase Functions (Optional)

For edge functions like analytics aggregation:

```bash
supabase functions deploy aggregate-analytics
```

## Subscription Tiers (Future)

| Feature | Free | Starter | Pro |
|---------|------|---------|-----|
| Gyms | 1 | 3 | Unlimited |
| QR Codes | 5 | 20 | Unlimited |
| Scan History | 30 days | 1 year | Unlimited |
| Analytics | Basic | Advanced | Custom Reports |
| Custom Branding | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ |

## Next Steps

1. [ ] Create onboarding flow for gym owners
2. [ ] Add email notifications for new check-ins
3. [ ] Build member portal for self-service
4. [ ] Add integration with popular gym management software
5. [ ] Implement subscription billing with Stripe
6. [ ] Add team/employee management
7. [ ] Create mobile app for gym owners

## License

MIT License - feel free to use this as a starting point for your own project.
