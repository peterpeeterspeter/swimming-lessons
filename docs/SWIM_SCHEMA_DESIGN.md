# Swim-Specific Database Schema Design

## Overview

This document outlines the database schema extensions needed to add swim school functionality to the existing Cal.com platform.

## Integration Strategy

We'll **extend** existing Cal.com models rather than replace them:
- `Team` model → becomes "School" (no changes needed)
- `EventType` model → becomes "Lesson Template" (no changes needed)
- `Booking` model → becomes "Lesson Enrollment" (extend with attendance)
- `User` model → extend with Parent role and swimmers relationship

## New Models to Add

### 1. Swimmer Model

Represents a child/student enrolled in swim lessons. Linked to a parent (User).

```prisma
model Swimmer {
  id              String   @id @default(uuid())
  
  // Link to parent User
  parentId        Int
  parent          User     @relation("parent_swimmers", fields: [parentId], references: [id], onDelete: Cascade)
  
  // Link to school (via parent's team membership)
  schoolId        Int?
  school          Team?    @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  // Basic info
  firstName       String
  lastName        String
  dateOfBirth     DateTime
  
  // Medical & emergency info (COPPA compliant)
  medicalNotes    String?
  emergencyContact Json?   // {name, phone, relationship}
  allergies       String?
  
  // Swim-specific
  currentLevel    String?  // e.g., "Beginner", "Intermediate"
  skillNotes      String?
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  enrollments     Enrollment[]
  attendanceRecords AttendanceRecord[]
  progressNotes   ProgressNote[]
  
  @@index([parentId])
  @@index([schoolId])
}
```

**Key Design Decisions:**
- Uses `uuid()` for ID (not sequential) for privacy
- `emergencyContact` is JSON to allow flexible structure
- `schoolId` links swimmer to specific school for multi-tenant queries
- All relations use Cascade delete for data cleanup

---

### 2. Enrollment Model (Extends Booking)

Links a swimmer to a specific lesson (EventType). Similar to Booking but swimmer-specific.

```prisma
model Enrollment {
  id          String   @id @default(uuid())
  
  // Link to swimmer
  swimmerId   String
  swimmer     Swimmer  @relation(fields: [swimmerId], references: [id], onDelete: Cascade)
  
  // Link to lesson (EventType)
  eventTypeId Int
  eventType   EventType @relation(fields: [eventTypeId], references: [id], onDelete: Cascade)
  
  // Enrollment details
  status      EnrollmentStatus @default(ACTIVE)
  enrolledAt  DateTime @default(now())
  endedAt     DateTime?
  
  // Optional: Link to recurring bookings for this enrollment
  bookingId   Int?
  booking     Booking? @relation(fields: [bookingId], references: [id], onDelete: SetNull)
  
  // Metadata
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([swimmerId, eventTypeId])
  @@index([swimmerId])
  @@index([eventTypeId])
  @@index([status])
}

enum EnrollmentStatus {
  ACTIVE      @map("active")
  WITHDRAWN   @map("withdrawn")
  COMPLETED   @map("completed")
  WAITLISTED  @map("waitlisted")
}
```

**Key Design Decisions:**
- Separate from Booking to track ongoing enrollments vs individual lesson instances
- `@@unique([swimmerId, eventTypeId])` prevents duplicate enrollments
- Links to Booking to connect with Cal.com's existing booking flow
- Status enum allows tracking enrollment lifecycle

---

### 3. AttendanceRecord Model

Tracks whether a swimmer attended a specific lesson instance (Booking).

```prisma
model AttendanceRecord {
  id          String   @id @default(uuid())
  
  // Link to swimmer
  swimmerId   String
  swimmer     Swimmer  @relation(fields: [swimmerId], references: [id], onDelete: Cascade)
  
  // Link to specific lesson instance (Booking)
  bookingId   Int
  booking     Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  
  // Attendance status
  status      AttendanceStatus @default(PRESENT)
  
  // Who marked it & when
  markedById  Int
  markedBy    User     @relation("marked_attendance", fields: [markedById], references: [id])
  markedAt    DateTime @default(now())
  
  // Optional notes
  notes       String?
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([swimmerId, bookingId])
  @@index([swimmerId])
  @@index([bookingId])
  @@index([markedAt])
  @@index([status])
}

enum AttendanceStatus {
  PRESENT   @map("present")
  ABSENT    @map("absent")
  EXCUSED   @map("excused")
  LATE      @map("late")
}
```

**Key Design Decisions:**
- Links to Booking (not Enrollment) to track specific lesson instances
- `@@unique([swimmerId, bookingId])` ensures one attendance record per swimmer per lesson
- Tracks who marked attendance for audit purposes
- Supports quick queries by status for reporting

---

### 4. ProgressNote Model

Instructor feedback on a swimmer's progress during a lesson.

```prisma
model ProgressNote {
  id          String   @id @default(uuid())
  
  // Link to swimmer
  swimmerId   String
  swimmer     Swimmer  @relation(fields: [swimmerId], references: [id], onDelete: Cascade)
  
  // Link to specific lesson instance (Booking)
  bookingId   Int
  booking     Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  
  // Who wrote it
  instructorId Int
  instructor  User     @relation("written_progress_notes", fields: [instructorId], references: [id])
  
  // Progress content
  note        String
  skills      Json?    // e.g., ["freestyle", "backstroke", "breathing"]
  rating      Int?     // Optional: 1-5 rating
  
  // Visibility
  visibleToParent Boolean @default(true)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([swimmerId])
  @@index([bookingId])
  @@index([instructorId])
  @@index([createdAt])
}
```

**Key Design Decisions:**
- Separate note per lesson for detailed tracking
- `skills` as JSON array for flexible skill tracking
- `visibleToParent` allows instructors to write internal notes
- Multiple notes per lesson allowed (not unique constraint)

---

## Extending Existing Models

### User Model Extensions

Add relations for swimmers and attendance:

```prisma
model User {
  // ... existing fields ...
  
  // NEW: Parent relation
  swimmers            Swimmer[]           @relation("parent_swimmers")
  markedAttendance    AttendanceRecord[]  @relation("marked_attendance")
  writtenProgressNotes ProgressNote[]     @relation("written_progress_notes")
}
```

---

### Booking Model Extensions

Add relations for attendance and progress:

```prisma
model Booking {
  // ... existing fields ...
  
  // NEW: Swim-specific relations
  attendanceRecords AttendanceRecord[]
  progressNotes     ProgressNote[]
  enrollments       Enrollment[]
}
```

---

### EventType Model Extensions

Add enrollment relation:

```prisma
model EventType {
  // ... existing fields ...
  
  // NEW: Enrollment relation
  enrollments Enrollment[]
}
```

---

### Team Model Extensions

Add swimmers relation (for school-level queries):

```prisma
model Team {
  // ... existing fields ...
  
  // NEW: Swimmers relation
  swimmers Swimmer[]
}
```

---

## Migration Strategy

### Phase 1: Add New Models (Day 2-3)

```bash
# 1. Edit packages/prisma/schema.prisma
# Add all new models above

# 2. Create migration
yarn workspace @calcom/prisma db-migrate --name add_swim_models

# 3. Generate Prisma client
yarn prisma generate

# 4. Test with seed data
```

### Phase 2: Extend Existing Models (Day 3)

```bash
# 1. Add relations to User, Booking, EventType, Team
# 2. Create migration
yarn workspace @calcom/prisma db-migrate --name extend_models_for_swim

# 3. Generate Prisma client
yarn prisma generate
```

---

## Data Flow Examples

### Example 1: Parent Enrolls Child in Lesson

```typescript
// 1. Parent creates swimmer profile
const swimmer = await prisma.swimmer.create({
  data: {
    parentId: user.id,
    schoolId: team.id,
    firstName: "Emma",
    lastName: "Johnson",
    dateOfBirth: new Date("2017-05-15"),
    medicalNotes: "No known allergies",
    emergencyContact: {
      name: "John Johnson",
      phone: "+1234567890",
      relationship: "Father"
    }
  }
});

// 2. Create enrollment (links swimmer to lesson)
const enrollment = await prisma.enrollment.create({
  data: {
    swimmerId: swimmer.id,
    eventTypeId: lesson.id, // EventType = Lesson template
    status: "ACTIVE"
  }
});

// 3. Cal.com's existing booking system handles recurring lesson instances
// (No changes needed to booking flow)
```

### Example 2: Instructor Marks Attendance

```typescript
// Get today's lesson bookings for this EventType
const todayBookings = await prisma.booking.findMany({
  where: {
    eventTypeId: lessonId,
    startTime: { gte: startOfDay, lte: endOfDay }
  },
  include: {
    eventType: {
      include: {
        enrollments: {
          include: { swimmer: true }
        }
      }
    }
  }
});

// Instructor marks each swimmer as present/absent
for (const enrollment of enrollments) {
  await prisma.attendanceRecord.create({
    data: {
      swimmerId: enrollment.swimmerId,
      bookingId: booking.id,
      status: "PRESENT",
      markedById: instructor.id
    }
  });
}
```

### Example 3: Instructor Adds Progress Note

```typescript
const progressNote = await prisma.progressNote.create({
  data: {
    swimmerId: swimmer.id,
    bookingId: booking.id,
    instructorId: instructor.id,
    note: "Emma swam her first 25-meter freestyle without assistance! Ready for next level.",
    skills: ["freestyle", "endurance", "breathing"],
    rating: 5,
    visibleToParent: true
  }
});

// Trigger notification to parent (using Cal.com's existing webhook system)
```

---

## Indexes & Performance

All models include strategic indexes:

- **Swimmer:** `parentId`, `schoolId` (for parent/school queries)
- **Enrollment:** `swimmerId`, `eventTypeId`, `status` (for roster queries)
- **AttendanceRecord:** `swimmerId`, `bookingId`, `markedAt`, `status` (for reports)
- **ProgressNote:** `swimmerId`, `bookingId`, `instructorId`, `createdAt` (for timeline)

These ensure fast queries for common operations:
- "Show all swimmers for parent X"
- "Show roster for lesson Y"
- "Show attendance for date range"
- "Show progress timeline for swimmer"

---

## Security & Privacy (COPPA Compliance)

### Data Protection
- Swimmer data encrypted at rest (Prisma encryption)
- Emergency contacts stored as JSON (flexible, encrypted)
- Medical notes optional and encrypted

### Access Control
- Parents can only see their own swimmers
- Instructors can only see swimmers in their lessons
- Managers can see all swimmers in their school
- Progress notes can be marked internal-only

### Data Retention
- Soft delete swimmers (keep records for auditing)
- GDPR-compliant data export available
- Parent can request data deletion

---

## Next Steps

1. **Day 2-3:** Implement this schema in `packages/prisma/schema.prisma`
2. **Day 3:** Create seed data for testing
3. **Day 4:** Build tRPC API routes for these models
4. **Day 5:** Build UI for swimmer management

---

## Questions & Decisions Needed

- [ ] Should we soft-delete swimmers or hard-delete? (Recommend soft-delete for history)
- [ ] Should progress notes support attachments (photos/videos)? (Recommend post-MVP)
- [ ] Should we track skill certifications (badges)? (Recommend post-MVP)
- [ ] Should attendance support partial attendance (left early)? (Recommend add PARTIAL status)
- [ ] Should we integrate with Cal.com's existing payment model for enrollment fees? (Yes, link via booking)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-05  
**Next Review:** After Day 3 implementation
