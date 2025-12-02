# Swimming-Lessons.com Strategy: Cal.com Customization Approach

## Decision: Customize Cal.com vs Build from Scratch

**Chosen Approach:** Customize existing Cal.com codebase for swim school management

**Rationale:**
- Cal.com provides 80%+ of required functionality (scheduling, payments, multi-tenant, auth)
- Reduces development time from 6 weeks to 2-3 weeks
- Battle-tested infrastructure with proven scalability
- Built-in Stripe, SendGrid, Twilio integrations
- Active maintenance and security updates

---

## What We Get from Cal.com "For Free"

### ✅ Already Implemented
1. **User Authentication & Authorization**
   - NextAuth.js with multi-role support
   - JWT tokens, session management
   - Password reset, email verification
   - Rate limiting

2. **Multi-Tenant Architecture**
   - Team/Organization model (→ becomes "School")
   - User memberships with roles
   - Data isolation between tenants
   - Invite system

3. **Scheduling System**
   - EventType model (→ becomes "Lesson")
   - Recurring events support
   - Booking system with capacity management
   - Availability management
   - Calendar integrations

4. **Payment Processing**
   - Stripe integration (Connect for multi-tenant)
   - Recurring billing
   - Invoice generation
   - Webhook handling
   - Payment status tracking

5. **Communication Infrastructure**
   - Email notifications (SendGrid)
   - SMS notifications (Twilio)
   - Template system
   - Webhook system

6. **Admin Dashboard**
   - Role-based dashboards
   - User management
   - Analytics and reporting
   - Settings management

### 🔧 What We Need to Customize

1. **Database Schema Extensions**
   - Add `Swimmer` model (child profiles)
   - Add `ProgressNote` model
   - Add `AttendanceRecord` model
   - Extend `Booking` with attendance status
   - Add swim-specific fields to EventType

2. **Swim-Specific Features**
   - Attendance check-in interface (mobile-optimized)
   - Progress tracking system
   - Parent-child relationship management
   - Emergency contact management
   - Swim level/skill tracking

3. **UI/UX Rebrand**
   - Swim school branding and terminology
   - Simplified navigation for 3 personas (manager, instructor, parent)
   - Mobile-first attendance interface
   - Parent-friendly payment flows

4. **Feature Removal/Simplification**
   - Remove video conferencing options (Zoom, Meet, Daily)
   - Remove complex routing forms
   - Remove booking questions (use simple forms)
   - Simplify event type creation for lessons

---

## Implementation Plan (3 Weeks)

### Week 1: Setup & Database Extensions

**Day 1-2: Environment Setup**
- [ ] Review Cal.com architecture and codebase
- [ ] Set up development environment
- [ ] Configure environment variables
- [ ] Run `yarn dx` to start dev environment
- [ ] Understand existing database schema
- [ ] Review existing API routes

**Day 3-5: Database Schema Extensions**
```prisma
// Add to packages/prisma/schema.prisma

model Swimmer {
  id              String   @id @default(uuid())
  userId          Int      // Link to parent User
  user            User     @relation("parent_swimmer", fields: [userId], references: [id])
  firstName       String
  lastName        String
  dateOfBirth     DateTime
  medicalNotes    String?
  emergencyContact Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  progressNotes   ProgressNote[]
  attendanceRecords AttendanceRecord[]
  
  @@index([userId])
}

model ProgressNote {
  id          String   @id @default(uuid())
  swimmerId   String
  swimmer     Swimmer  @relation(fields: [swimmerId], references: [id])
  bookingId   Int
  booking     Booking  @relation(fields: [bookingId], references: [id])
  instructorId Int
  instructor  User     @relation(fields: [instructorId], references: [id])
  note        String
  skills      Json?    // Array of skills practiced
  createdAt   DateTime @default(now())
  
  @@index([swimmerId])
  @@index([bookingId])
}

model AttendanceRecord {
  id          String   @id @default(uuid())
  swimmerId   String
  swimmer     Swimmer  @relation(fields: [swimmerId], references: [id])
  bookingId   Int
  booking     Booking  @relation(fields: [bookingId], references: [id])
  status      AttendanceStatus
  markedById  Int
  markedBy    User     @relation(fields: [markedById], references: [id])
  markedAt    DateTime @default(now())
  notes       String?
  
  @@unique([swimmerId, bookingId])
  @@index([bookingId])
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  EXCUSED
  LATE
}

// Extend existing User model
model User {
  // ... existing fields
  swimmers    Swimmer[] @relation("parent_swimmer")
  progressNotes ProgressNote[]
  attendanceMarked AttendanceRecord[]
}

// Extend existing Booking model
model Booking {
  // ... existing fields
  progressNotes ProgressNote[]
  attendanceRecords AttendanceRecord[]
}
```

**Tasks:**
- [ ] Add new models to Prisma schema
- [ ] Create migration: `yarn workspace @calcom/prisma db-migrate`
- [ ] Generate Prisma client: `yarn prisma generate`
- [ ] Update seed data for testing

---

### Week 2: Core Swim Features

**Day 1-3: Attendance & Progress Tracking APIs**

**Create new API routes in `apps/web/pages/api/swim/`:**

```typescript
// apps/web/pages/api/swim/swimmers.ts
// CRUD operations for swimmers (child profiles)

// apps/web/pages/api/swim/attendance.ts
// Mark attendance, bulk operations

// apps/web/pages/api/swim/progress-notes.ts
// Add/view progress notes

// apps/web/pages/api/swim/roster.ts
// Get lesson roster with attendance status
```

**Tasks:**
- [ ] Create swimmer management API endpoints
- [ ] Create attendance tracking API endpoints
- [ ] Create progress notes API endpoints
- [ ] Add authorization checks (instructor-only, parent-only)
- [ ] Write API tests

**Day 4-5: Attendance UI (Mobile-First)**

**Create new pages in `apps/web/pages/swim/`:**

```typescript
// apps/web/pages/swim/attendance/[bookingId].tsx
// Mobile-optimized attendance check-in for instructors

// apps/web/pages/swim/swimmers/index.tsx
// Parent view of their swimmers

// apps/web/pages/swim/progress/[swimmerId].tsx
// Progress history for a swimmer
```

**Tasks:**
- [ ] Build mobile attendance check-in UI
- [ ] Add quick tap to mark present
- [ ] Add swipe gestures for absent/excused
- [ ] Implement optimistic UI updates
- [ ] Add offline support with local storage sync

---

### Week 3: Dashboards & Launch Prep

**Day 1-2: Role-Specific Dashboards**

**Customize existing dashboards:**

```typescript
// apps/web/pages/dashboard/index.tsx
// Modify to show swim-specific widgets:
// - Manager: Today's lessons, attendance rates, payment status
// - Instructor: Today's schedule, quick attendance access
// - Parent: Child's upcoming lessons, recent progress

// Use existing Cal.com widgets from packages/ui
// Add new swim-specific widgets in apps/web/components/swim/
```

**Tasks:**
- [ ] Customize manager dashboard with swim metrics
- [ ] Customize instructor dashboard with attendance shortcuts
- [ ] Customize parent dashboard with child progress
- [ ] Add quick actions for each role

**Day 3-4: UI/UX Polish & Branding**

**Rebrand for swim schools:**

```typescript
// Update apps/web/public/
// - Replace logo with swimming-lessons.com branding
// - Update favicon
// - Update meta tags and SEO

// Update packages/config/constants.ts
// - Change terminology: "Event Type" → "Lesson"
// - Change terminology: "Booking" → "Enrollment"
// - Update navigation labels

// Update email templates in packages/emails/templates/
// - Rebrand for swim school context
// - Update copy for lesson confirmations
// - Update payment reminder templates
```

**Tasks:**
- [ ] Replace branding assets
- [ ] Update terminology throughout UI
- [ ] Simplify navigation for swim school users
- [ ] Update email templates
- [ ] Create swim school onboarding flow

**Day 5: Testing & Deployment**

**Tasks:**
- [ ] Manual testing of all user flows
- [ ] Test on real mobile devices (iOS/Android)
- [ ] Run type check: `yarn type-check:ci --force`
- [ ] Run tests: `TZ=UTC yarn test`
- [ ] Deploy to Vercel staging
- [ ] Create production database
- [ ] Deploy to production
- [ ] Create first pilot school

---

## Feature Mapping: Cal.com → Swimming-Lessons

| Cal.com Feature | Swimming-Lessons Use |
|----------------|---------------------|
| Team/Organization | Swim School |
| EventType | Lesson Template |
| Booking | Lesson Enrollment |
| User (with roles) | Manager/Instructor/Parent |
| Availability | Instructor Schedule |
| Payment (Stripe) | Lesson Fees |
| Webhooks | Notifications |
| Email/SMS | Parent Communication |
| Dashboard | Role-specific Views |

### New Features to Add
- ✅ Swimmer profiles (children)
- ✅ Attendance tracking
- ✅ Progress notes
- ✅ Emergency contacts
- ✅ Mobile-first attendance UI

### Features to Remove/Hide
- ❌ Video conferencing integrations
- ❌ Routing forms (use simple booking)
- ❌ Multiple event types per user (simplify to lessons only)
- ❌ Round-robin scheduling (use fixed instructor assignment)
- ❌ Complex availability rules (use simple weekly schedule)

---

## Directory Structure

```
swimming-lessons/
├── apps/
│   └── web/
│       ├── pages/
│       │   ├── api/swim/          # New swim-specific APIs
│       │   ├── swim/               # New swim-specific pages
│       │   └── dashboard/          # Customize existing
│       └── components/
│           └── swim/               # New swim-specific components
├── packages/
│   ├── prisma/
│   │   └── schema.prisma          # Extend with swim models
│   ├── features/
│   │   └── swim/                  # New swim-specific features
│   ├── ui/
│   │   └── components/            # Use existing, add swim-specific
│   └── emails/
│       └── templates/             # Customize for swim context
└── [Keep all other Cal.com infrastructure]
```

---

## Migration Strategy

### Phase 1: Parallel Development (Weeks 1-3)
- Keep all Cal.com functionality intact
- Add swim features alongside existing features
- Test both systems work together

### Phase 2: Feature Cleanup (Week 4)
- Hide/remove unused Cal.com features
- Simplify UI for swim school context
- Lock down to swim-specific flows

### Phase 3: Production Hardening (Week 5-6)
- Beta testing with 2-3 swim schools
- Performance optimization
- Security audit
- Production deployment

---

## Risks & Mitigation

### Risk: Cal.com updates break our customizations
**Mitigation:** 
- Fork repo and manage our own version
- Cherry-pick security updates only
- Document all customizations clearly

### Risk: Too much complexity from Cal.com
**Mitigation:**
- Hide unused features rather than delete
- Create simplified swim-specific entry points
- Custom onboarding that bypasses complex features

### Risk: Learning curve for Cal.com codebase
**Mitigation:**
- Use existing WARP.md and .agents/ documentation
- Focus on API layer (tRPC routes) first
- Leverage Cal.com Discord community for questions

---

## Success Metrics

### Week 1 Success
- [ ] Development environment running
- [ ] New Prisma models added and migrated
- [ ] Understand Cal.com architecture

### Week 2 Success
- [ ] Attendance API working
- [ ] Mobile attendance UI functional
- [ ] Progress notes system working

### Week 3 Success
- [ ] All 3 dashboards customized
- [ ] Branding complete
- [ ] Deployed to staging
- [ ] First pilot school onboarded

---

## Decision Log

**Date:** 2025-11-05  
**Decision:** Use Cal.com as base platform, customize for swim schools  
**Rationale:** 80% feature overlap, 3-week timeline vs 6-week from scratch, proven infrastructure  
**Trade-offs:** Some complexity overhead, but massive time savings

---

## Next Actions

1. **Immediate (Today):**
   - [ ] Review existing Cal.com codebase structure
   - [ ] Run `yarn dx` to start development
   - [ ] Explore existing dashboards and user flows
   - [ ] Read `.agents/` documentation thoroughly

2. **This Week:**
   - [ ] Create detailed task list for Week 1
   - [ ] Set up project tracking (GitHub Projects)
   - [ ] Schedule daily standups
   - [ ] Begin Prisma schema extensions

3. **Ongoing:**
   - [ ] Document all customizations in `/docs/swim-customizations.md`
   - [ ] Keep STRATEGY.md updated with learnings
   - [ ] Track which Cal.com features we use vs hide
