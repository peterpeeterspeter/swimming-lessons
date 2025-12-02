# Week 1, Day 1: Environment Setup & Architecture Review

## ✅ Completed Tasks

1. **Created .env file** with required secrets
   - NEXTAUTH_SECRET: Generated ✅
   - CALENDSO_ENCRYPTION_KEY: Generated ✅

## 🔄 Next Steps (Complete These Now)

### Step 1: Start Docker Desktop
```bash
# Open Docker Desktop application
# Wait for it to fully start (Docker icon in menu bar should be stable)
```

### Step 2: Install Dependencies & Start Development Environment
```bash
# Install all dependencies (takes ~5 minutes)
yarn install

# Start development environment with local Postgres
# This command will:
# - Start Docker container with PostgreSQL
# - Run database migrations
# - Seed test data
# - Start Next.js dev server on port 3000
yarn dx
```

**Test Users Created by `yarn dx`:**
- Manager: `free:free` (username:password)
- Instructor: `pro:pro`
- Parent: `trial:trial`

### Step 3: Explore Existing Cal.com Features

Once `yarn dx` is running, open http://localhost:3000 and test:

**As Manager (free:free):**
- [ ] View dashboard
- [ ] Create an EventType (this becomes a "Lesson")
- [ ] View team settings
- [ ] Explore booking management

**As Instructor (pro:pro):**
- [ ] View schedule
- [ ] Check availability settings
- [ ] Look at booking list

**As Parent (trial:trial):**
- [ ] View bookings
- [ ] Check payment history
- [ ] Explore profile settings

## 📋 Architecture Review Checklist

### Database Schema (packages/prisma/schema.prisma)

Key existing models to review:
- [ ] **User** - Multi-role support, team memberships
- [ ] **Team** - Organization structure (→ becomes "School")
- [ ] **EventType** - Scheduling templates (→ becomes "Lesson")
- [ ] **Booking** - Reservation records (→ becomes "Enrollment")
- [ ] **Membership** - User-team relationships with roles
- [ ] **Payment** - Stripe payment records
- [ ] **Webhook** - Event notifications
- [ ] **Availability** - Instructor schedules

### API Structure (packages/trpc/server/routers/)

Key routers to review:
- [ ] **viewer/** - Authenticated user routes (36 routers)
  - `eventTypes.ts` - Lesson management
  - `bookings.ts` - Enrollment management
  - `teams.ts` - School management
- [ ] **publicViewer/** - Public routes (20 routers)
- [ ] **loggedInViewer/** - Logged-in user routes (24 routers)

### Frontend Structure (apps/web/)

Key pages to review:
- [ ] **pages/dashboard/** - Role-based dashboards
- [ ] **pages/event-types/** - Lesson creation/editing
- [ ] **pages/bookings/** - Booking management
- [ ] **pages/settings/** - User/team settings
- [ ] **components/** - Reusable UI components

## 📝 Notes from Review

### What We'll Reuse from Cal.com:

**Authentication & Users:**
- ✅ NextAuth.js setup
- ✅ User model with roles
- ✅ Team/Organization multi-tenancy
- ✅ Invitation system
- ✅ Session management

**Scheduling:**
- ✅ EventType model (→ Lesson template)
- ✅ Recurring events
- ✅ Booking system (→ Enrollment)
- ✅ Capacity management
- ✅ Availability rules

**Payments:**
- ✅ Stripe integration (already configured)
- ✅ Payment model
- ✅ Webhook handling
- ✅ Invoice generation

**Communication:**
- ✅ Email service (SendGrid ready)
- ✅ SMS service (Twilio ready)
- ✅ Notification system
- ✅ Template engine

### What We Need to Add:

**Swim-Specific Models:**
- ❌ Swimmer (child profiles)
- ❌ ProgressNote (instructor feedback)
- ❌ AttendanceRecord (lesson check-in)
- ❌ Emergency contacts (COPPA compliant)

**Swim-Specific Features:**
- ❌ Mobile attendance check-in UI
- ❌ Progress tracking interface
- ❌ Parent-child relationship management
- ❌ Swim level/skill tracking
- ❌ Absence reporting flow

**Customizations:**
- ❌ Rebrand terminology (EventType → Lesson)
- ❌ Simplify navigation for swim schools
- ❌ Custom dashboards for parent role
- ❌ Swim-specific email templates

## 🎯 End of Day 1 Goals

By end of today, you should have:
- [x] Development environment running
- [ ] Explored existing Cal.com features as 3 user types
- [ ] Reviewed Prisma schema and identified integration points
- [ ] Reviewed tRPC API structure
- [ ] Documented observations and questions
- [ ] Ready to start database schema extensions tomorrow

## 🐛 Troubleshooting

### Docker Issues
```bash
# If Docker won't start
# 1. Restart Docker Desktop
# 2. Check available disk space (need ~10GB)
# 3. Check Docker > Preferences > Resources

# If port 5450 is in use
docker ps -a
docker stop <container-id>
docker rm <container-id>
```

### Yarn Install Issues
```bash
# If dependencies fail to install
rm -rf node_modules
rm yarn.lock
yarn install

# If Prisma generate fails
yarn workspace @calcom/prisma prisma generate
```

### Database Connection Issues
```bash
# Check if Postgres is running
docker ps | grep postgres

# Check database connection
yarn workspace @calcom/prisma prisma db push

# Reset database if needed
docker-compose down -v
yarn dx
```

## 📚 Resources

- **Cal.com Docs:** `.agents/` directory (already created WARP.md)
- **Prisma Docs:** https://www.prisma.io/docs
- **tRPC Docs:** https://trpc.io/docs
- **Next.js Docs:** https://nextjs.org/docs

## 🔜 Tomorrow (Day 2-3)

We'll design and implement the swim-specific database schema:
- Add Swimmer model
- Add ProgressNote model  
- Add AttendanceRecord model
- Extend existing User/Booking models
- Create migrations

---

**Time Tracking:**
- Environment setup: ~30 minutes
- Feature exploration: ~1 hour
- Architecture review: ~1.5 hours
- Documentation: ~30 minutes

**Total Day 1:** ~3.5 hours
