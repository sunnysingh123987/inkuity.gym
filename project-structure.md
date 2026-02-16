# Inkuity Gym QR Platform - Project Structure

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **QR Code Generation**: qrcode library
- **Hosting**: Vercel

## Folder Structure

```
inkuity-platform/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth routes group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/                  # Protected dashboard routes
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   │   └── loading.tsx
│   │   ├── gyms/
│   │   │   ├── page.tsx              # List gyms
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx          # Gym detail/edit
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Create gym
│   │   │   └── layout.tsx
│   │   ├── qr-codes/
│   │   │   ├── page.tsx              # List QR codes
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx          # QR detail/edit
│   │   │   │   └── analytics/
│   │   │   │       └── page.tsx      # QR-specific analytics
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Create QR code
│   │   │   └── layout.tsx
│   │   ├── members/
│   │   │   ├── page.tsx              # Member list
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Member profile
│   │   │   └── import/
│   │   │       └── page.tsx          # Bulk import members
│   │   ├── analytics/
│   │   │   ├── page.tsx              # Overall analytics
│   │   │   ├── scans/
│   │   │   │   └── page.tsx          # Scan history
│   │   │   └── reports/
│   │   │       └── page.tsx          # Generate reports
│   │   ├── settings/
│   │   │   └── page.tsx              # Account settings
│   │   └── api/
│   │       └── [...]/                 # Dashboard API routes
│   ├── (landing)/                    # Public landing pages
│   │   ├── page.tsx                  # Home page (your current inkuity.com)
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── features/
│   │   │   └── page.tsx
│   │   └── about/
│   │       └── page.tsx
│   ├── [slug]/                       # Public gym landing pages
│   │   └── page.tsx                  # Gym public page
│   ├── s/                            # Scan redirect handler
│   │   └── [code]/
│   │       └── route.ts              # Handle QR scans, track analytics
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts          # OAuth callback
│   │   ├── webhooks/
│   │   │   └── supabase/
│   │   │       └── route.ts          # Supabase webhooks
│   │   └── cron/
│   │       └── aggregate-analytics/
│   │           └── route.ts          # Daily analytics aggregation
│   ├── layout.tsx                    # Root layout
│   ├── globals.css
│   └── not-found.tsx
├── components/                       # React Components
│   ├── ui/                           # shadcn/ui components
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── social-login.tsx
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── stats-cards.tsx
│   │   ├── charts/
│   │   │   ├── scan-chart.tsx
│   │   │   ├── device-chart.tsx
│   │   │   └── location-chart.tsx
│   │   ├── qr-code/
│   │   │   ├── qr-generator.tsx
│   │   │   ├── qr-preview.tsx
│   │   │   ├── qr-download.tsx
│   │   │   └── qr-list.tsx
│   │   ├── gyms/
│   │   │   ├── gym-form.tsx
│   │   │   ├── gym-card.tsx
│   │   │   └── gym-list.tsx
│   │   ├── members/
│   │   │   ├── member-table.tsx
│   │   │   └── member-filters.tsx
│   │   └── analytics/
│   │       ├── date-range-picker.tsx
│   │       ├── scan-table.tsx
│   │       └── export-button.tsx
│   ├── landing/
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── pricing.tsx
│   │   └── cta.tsx
│   └── shared/
│       ├── logo.tsx
│       ├── footer.tsx
│       └── meta.tsx
├── lib/                              # Utilities & Config
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   └── admin.ts                  # Admin client (service role)
│   ├── actions/                      # Server Actions
│   │   ├── auth.ts
│   │   ├── gyms.ts
│   │   ├── qr-codes.ts
│   │   ├── members.ts
│   │   └── scans.ts
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-user.ts
│   │   ├── use-gym.ts
│   │   ├── use-scans.ts
│   │   └── use-analytics.ts
│   ├── utils/
│   │   ├── date.ts
│   │   ├── format.ts
│   │   ├── qr.ts                     # QR code generation
│   │   └── analytics.ts
│   ├── types/
│   │   ├── database.ts               # Supabase types
│   │   ├── index.ts                  # App types
│   │   └── api.ts
│   └── constants.ts
├── public/                           # Static assets
│   ├── logos/
│   ├── qr-templates/
│   └── fonts/
├── supabase/
│   ├── migrations/                   # Database migrations
│   ├── seed.sql                      # Seed data
│   └── config.toml                   # Supabase config
├── tests/
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
