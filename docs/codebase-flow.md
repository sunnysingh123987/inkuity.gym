# Inkuity - Complete Application Flow

## 1. High-Level Application Architecture

```mermaid
flowchart TB
    subgraph Entry["Entry Points"]
        LP["Landing Page /"]
        QR["QR Code Scan /s/[code]"]
        DIRECT["Direct URL /[slug]"]
    end

    subgraph Auth["Authentication"]
        LOGIN["/login"]
        REGISTER["/register"]
        RESET["/reset-password"]
        SUPABASE_AUTH["Supabase Auth"]
    end

    subgraph Onboarding["Gym Owner Onboarding"]
        OB["/onboarding"]
        OB_STEP1["Create Gym Profile"]
        OB_STEP2["Setup QR Codes"]
        OB_STEP3["Configure Settings"]
    end

    subgraph OwnerDash["Gym Owner Dashboard"]
        DASH["/dashboard"]
        MEMBERS["/members"]
        SETTINGS["/settings"]
    end

    subgraph MemberPortal["Member Portal /[slug]/portal"]
        SIGNIN["/sign-in"]
        PORTAL_DASH["/dashboard"]
        PROFILE["/profile"]
        STREAK["/streak"]
        WORKOUTS["/workouts"]
        CHECKIN_SUCCESS["/check-in-success"]
        QUICK_CHECKIN["/quick-check-in"]
    end

    LP -->|"Sign Up"| REGISTER
    LP -->|"Log In"| LOGIN
    LP -->|"Scan QR"| QR

    LOGIN --> SUPABASE_AUTH
    REGISTER --> SUPABASE_AUTH
    RESET --> SUPABASE_AUTH

    SUPABASE_AUTH -->|"New Owner"| OB
    SUPABASE_AUTH -->|"Existing Owner"| DASH

    OB --> OB_STEP1 --> OB_STEP2 --> OB_STEP3 --> DASH

    DASH --> MEMBERS
    DASH --> SETTINGS

    QR -->|"Check-in QR"| SIGNIN
    QR -->|"Custom URL"| DIRECT
    DIRECT --> SIGNIN

    SIGNIN -->|"PIN Auth"| PORTAL_DASH
    PORTAL_DASH --> PROFILE
    PORTAL_DASH --> STREAK
    PORTAL_DASH --> WORKOUTS
    PORTAL_DASH --> QUICK_CHECKIN
    QUICK_CHECKIN --> CHECKIN_SUCCESS
```

---

## 2. QR Code Scan & Check-In Flow

```mermaid
flowchart TD
    SCAN["Member Scans QR Code"]
    ROUTE["/s/[code] API Route"]
    PARSE["Parse Device Info\n(UA, IP, UTM params)"]
    LOOKUP["Lookup QR Code\nin Database"]

    SCAN --> ROUTE --> PARSE --> LOOKUP

    LOOKUP -->|"Not Found"| QR_404["/qr-not-found"]
    LOOKUP -->|"Custom Redirect"| CUSTOM["Redirect to custom URL"]
    LOOKUP -->|"Check-in Type"| RECORD_SCAN["Record Scan in DB\n(device, browser, OS, location)"]

    RECORD_SCAN --> REDIRECT["Redirect to\n/[slug]/portal/sign-in\n?scan_id&qr_code&checkin=true"]

    REDIRECT --> SIGNIN_PAGE["Member Sign-In Page"]

    SIGNIN_PAGE --> STEP1["Step 1: Enter Email"]
    STEP1 -->|"Existing Member"| STEP2_PIN["Step 2: Enter PIN"]
    STEP1 -->|"New Member"| STEP2_VERIFY["Step 2: Email Verification"]

    STEP2_PIN -->|"Authenticated"| CHECKIN_FLOW
    STEP2_VERIFY --> STEP3["Step 3: Enter Code"]
    STEP3 --> STEP4["Step 4: Create PIN"]
    STEP4 -->|"New Trial Member Created"| CHECKIN_FLOW

    subgraph CHECKIN_FLOW["Check-In Processing"]
        VALIDATE["Validate Location\n(Haversine, 6m radius)"]
        CHECK_BLACKLIST["Check Blacklist Status"]
        CHECK_DAILY["Check Daily Limit\n(1 per member per day)"]
        RECORD_CHECKIN["Record Check-In"]
        SEND_EMAIL["Send Email Notification\n(async)"]
        NOTIFY_OWNER["Notify Owner\n(if trial/inactive)"]
        REVALIDATE["Revalidate Cache\n(/portal/dashboard)"]
    end

    VALIDATE --> CHECK_BLACKLIST --> CHECK_DAILY --> RECORD_CHECKIN
    RECORD_CHECKIN --> SEND_EMAIL
    RECORD_CHECKIN --> NOTIFY_OWNER
    RECORD_CHECKIN --> REVALIDATE

    RECORD_CHECKIN --> SUCCESS["/check-in-success\n(animated confirmation)"]

    SUCCESS --> INFO_FORM{"First Check-In?"}
    INFO_FORM -->|"Yes"| MEMBER_INFO["7-Step Info Form\n(name, phone, DOB, gender,\nblood group, height, weight)"]
    INFO_FORM -->|"No"| PORTAL["/portal/dashboard"]
    MEMBER_INFO --> PORTAL
```

---

## 3. Gym Owner Dashboard Flow

```mermaid
flowchart TD
    subgraph Middleware["Middleware Protection"]
        AUTH_CHECK["Check Supabase Session"]
        OB_CHECK["Check onboarding_completed"]
    end

    AUTH_CHECK -->|"No Session"| LOGIN["/login"]
    AUTH_CHECK -->|"Session Valid"| OB_CHECK
    OB_CHECK -->|"Not Completed"| ONBOARDING["/onboarding"]
    OB_CHECK -->|"Completed"| DASHBOARD

    subgraph DASHBOARD["/dashboard - Main Overview"]
        STATS["Stats Cards\n(Members, Check-ins, Revenue)"]
        PIE["Members Pie Chart\n(Active / Trial / Inactive)"]
        COLLECTION["Collection Card\n(Today, Month, % Change)"]
        FINANCE["Finance Metrics\n(Revenue - Expenses - Salaries)"]
        CHECKIN_METRICS["Check-In Metrics\n(Today, Week, Month + In Gym Now)"]
        LIVE["Live Check-Ins\n(Real-time member list)"]
        RECENT["Recent Members\n(with status badges)"]
        REVIEWS["Recent Reviews\n(star ratings)"]
        FEEDBACK["Feedback Responses"]
    end

    subgraph MEMBERS_PAGE["/members - Member Management"]
        MEMBER_LIST["Member List\n(with stats & filters)"]
        APPROVE["Approve Trial Members"]
        REJECT["Reject Members"]
        BLACKLIST["Blacklist / Unblacklist"]
        EDIT_MEMBER["Edit Member Details"]
        RECORD_PAYMENT["Record Payment"]
    end

    subgraph SETTINGS_PAGE["/settings - Configuration"]
        ACCOUNT["Account Settings"]
        TEAM["Team Management\n(Roles & Permissions)"]
        GYM_SETTINGS["Gym Settings\n(Name, Logo, Address, Timezone)"]
        QR_MANAGE["QR Code Management"]
        WIDGET_TOGGLE["Dashboard Widget Toggle"]
        PAYMENT_CONFIG["Payment QR & Plans"]
    end

    DASHBOARD --> MEMBERS_PAGE
    DASHBOARD --> SETTINGS_PAGE

    MEMBER_LIST --> APPROVE
    MEMBER_LIST --> REJECT
    MEMBER_LIST --> BLACKLIST
    MEMBER_LIST --> EDIT_MEMBER
    MEMBER_LIST --> RECORD_PAYMENT

    subgraph BackgroundJobs["Automated Background Jobs"]
        SYNC_STATUS["syncMemberStatuses()\n(active <-> expired)"]
        EXPIRY_ALERTS["checkSubscriptionExpiry()\n(T-3, T-0, T+1, T+3 days)"]
        ANALYTICS["Aggregate DailyAnalytics"]
    end

    DASHBOARD -.->|"Cron"| BackgroundJobs
```

---

## 4. Member Portal Flow

```mermaid
flowchart TD
    subgraph PortalEntry["Portal Entry Points"]
        QR_SCAN["QR Code Scan"]
        DIRECT_URL["Direct URL\n/[slug]/portal/sign-in"]
        BOOKMARK["PWA Bookmark"]
    end

    QR_SCAN --> SIGNIN
    DIRECT_URL --> SIGNIN
    BOOKMARK --> PORTAL_DASH

    subgraph Auth["PIN Authentication"]
        SIGNIN["/sign-in"]
        PIN_VERIFY["Verify PIN\n(AES-256-CBC encrypted)"]
        SESSION["Set Session Cookie\n(30-day sliding renewal)"]
    end

    SIGNIN --> PIN_VERIFY --> SESSION --> PORTAL_DASH

    subgraph PORTAL_DASH["/portal/dashboard"]
        WELCOME["Welcome Greeting"]
        ANNOUNCEMENTS["Active Announcements\n(emergency/closure/warning/holiday/info)"]
        ACTIVE_CHECKIN["Active Check-In Display\n+ Auto-Checkout Warning\n(1h15m warn, 1h30m auto)"]
        QUICK_ACTIONS["Quick Actions\n(Check In / Check Out / Workouts / Routines)"]
        GYM_TRAFFIC["Live Gym Traffic Count"]
        PEAK_HOURS["Peak Hour Analytics"]
        WEEKLY_BAR["Weekly Activity Bar\n(check-ins + workouts vs goal)"]
        COMPACT_STATS["Compact Stats\n(total check-ins, workouts, routines)"]
        WORKOUT_SUGGEST["Workout Suggestions\n(by days since last muscle group)"]
        PENDING_STATUS["Trial/Pending Status Banner"]
    end

    subgraph PortalPages["Portal Pages"]
        PROFILE["/profile\nPersonal Info & Settings"]
        STREAK["/streak\nStreak Calendar &\nMonthly Check-In History"]
        WORKOUTS["/workouts\nWorkout Session History\nwith Pagination"]
        QUICK_CI["/quick-check-in\nGeo-Validated Check-In/Out"]
        CI_SUCCESS["/check-in-success\nAnimated Confirmation"]
    end

    PORTAL_DASH -->|"Profile"| PROFILE
    PORTAL_DASH -->|"Streak"| STREAK
    PORTAL_DASH -->|"Workouts"| WORKOUTS
    PORTAL_DASH -->|"Check In"| QUICK_CI
    QUICK_CI -->|"Success"| CI_SUCCESS
    CI_SUCCESS --> PORTAL_DASH
```

---

## 5. Workout & Nutrition Tracking Flow

```mermaid
flowchart TD
    subgraph Fitness["Workout Tracking"]
        ROUTINES["Workout Routines\n(name, schedule, exercises)"]
        EXERCISE_LIB["Exercise Library\n(gym catalog + custom)"]
        START_SESSION["Start Workout Session\n(linked to check-in)"]
        LOG_SETS["Log Exercise Sets\n(weight, reps, duration)"]
        COMPLETE["Complete Session\n(duration calculated)"]
        PR["Personal Records\n(auto-detected max lifts)"]
    end

    ROUTINES --> START_SESSION
    EXERCISE_LIB --> ROUTINES
    START_SESSION --> LOG_SETS --> COMPLETE
    LOG_SETS -->|"New Max"| PR

    subgraph Nutrition["Nutrition Tracking"]
        DIET_PLAN["Diet Plan\n(calories, protein, carbs, fat targets)"]
        AI_GENERATE["AI Diet Generation\n(Anthropic API)"]
        MEAL_PLAN["Meal Plans\n(breakfast/lunch/dinner/snack)"]
        FOOD_LOG["Food Log Entries\n(daily tracking)"]
        FOOD_DB["Food Item Database\n(personal + global)"]
        CUSTOM_TRACK["Custom Trackers\n(water, vitamins, etc.)"]
    end

    AI_GENERATE -->|"Generates"| DIET_PLAN
    DIET_PLAN --> MEAL_PLAN
    FOOD_DB --> FOOD_LOG
    CUSTOM_TRACK --> DAILY_LOG["Daily Tracker Logs"]

    subgraph MemberDash["Member Dashboard Impact"]
        WEEKLY["Weekly Activity Bar"]
        SUGGESTIONS["Workout Suggestions\n(days since muscle group)"]
        STATS["Compact Stats"]
    end

    COMPLETE --> WEEKLY
    COMPLETE --> SUGGESTIONS
    COMPLETE --> STATS
```

---

## 6. Data Flow & Server Actions Map

```mermaid
flowchart LR
    subgraph Clients["Supabase Clients"]
        BROWSER["Browser Client\n(lib/supabase/client.ts)"]
        SERVER["Server Client\n(lib/supabase/server.ts)\nRespects RLS"]
        ADMIN["Admin Client\n(lib/supabase/admin.ts)\nBypasses RLS"]
    end

    subgraph Actions["Server Actions (lib/actions/)"]
        A1["checkin-flow.ts\nCheck-in/out, location,\nlive traffic, peak hours"]
        A2["gyms.ts\nGym CRUD, members,\nQR codes, analytics"]
        A3["pin-auth.ts\nPIN encrypt/verify,\nsession management"]
        A4["members-portal.ts\nWorkouts, routines,\nsessions, exercise sets"]
        A5["payments.ts\nRecord payments,\nupload QR, plans"]
        A6["notifications.ts\nIn-app alerts,\nexpiry warnings"]
        A7["ai-diet.ts\nAI diet generation"]
        A8["push-notifications.ts\nPWA push subscriptions"]
        A9["announcements.ts\nGym announcements"]
        A10["reviews.ts\nMember reviews"]
        A11["referrals.ts\nReferral tracking"]
        A12["staff-expenses.ts\nStaff & expenses"]
        A13["gym-roles.ts\nRole-based access"]
        A14["blacklist.ts\nMember blacklisting"]
    end

    subgraph External["External Services"]
        RESEND["Resend\n(Email API)"]
        ANTHROPIC["Anthropic\n(AI Diet Plans)"]
        WEBPUSH["Web Push\n(VAPID Notifications)"]
        STORAGE["Supabase Storage\n(Images, QR codes)"]
    end

    subgraph DB["Supabase PostgreSQL"]
        TABLES["30+ Tables\nwith RLS Policies"]
    end

    BROWSER --> A4
    SERVER --> A1 & A2 & A5 & A6 & A9 & A10 & A12 & A13
    ADMIN --> A1 & A3 & A14

    A1 & A2 & A3 & A4 & A5 & A6 --> TABLES
    A7 --> ANTHROPIC
    A6 --> RESEND
    A8 --> WEBPUSH
    A5 --> STORAGE
```

---

## 7. Notification & Communication Flow

```mermaid
flowchart TD
    subgraph Triggers["Event Triggers"]
        T1["New Member Check-In"]
        T2["Trial Member Check-In"]
        T3["Inactive Member Check-In"]
        T4["Blacklisted Member Scan"]
        T5["Subscription Expiry\n(T-3, T-0, T+1, T+3)"]
        T6["New Announcement"]
        T7["Member Approved"]
    end

    subgraph Channels["Notification Channels"]
        INAPP["In-App Notifications\n(notifications table)"]
        EMAIL["Email via Resend\n(welcome, check-in,\nPIN, alerts)"]
        PUSH["PWA Push\n(web-push + VAPID)"]
    end

    T1 -->|"Email to member"| EMAIL
    T2 -->|"Notify owner"| INAPP
    T3 -->|"Email to owner"| EMAIL
    T4 -->|"Notify owner"| INAPP
    T5 -->|"Notify owner"| INAPP
    T6 -->|"Batch email (100/call)"| EMAIL
    T6 -->|"Push to members"| PUSH
    T7 -->|"Referral reward processed"| INAPP
```

---

## How to View These Diagrams

1. **GitHub** - Push this file; diagrams render automatically
2. **VS Code** - Install "Markdown Preview Mermaid Support" extension
3. **Online** - Paste individual diagram blocks at [mermaid.live](https://mermaid.live)
4. **Export as PNG** - Use Mermaid CLI: `npx @mermaid-js/mermaid-cli mmdc -i docs/codebase-flow.md -o docs/flow.png`
