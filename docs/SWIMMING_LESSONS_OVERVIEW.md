# Swimming Lessons SaaS Platform Documentation

## 1. Project Overview

This project is a comprehensive **SaaS Platform for Swim School Management**, built as a specialized extension of the [Cal.com](https://cal.com) open-source scheduling infrastructure. It leverages Cal.com's robust scheduling, booking, and user management capabilities while adding specific features tailored for swim schools.

### Core Value Proposition

- **For Managers:** complete oversight of instructors, lessons, financials, and skill tracking.
- **For Instructors:** mobile-optimized tools for attendance, progress notes, and schedule management.
- **For Parents:** seamless enrollment, payment management, and visibility into their child's progress.

## 2. Technical Architecture

The platform follows a monorepo structure (Turbo) and uses modern web technologies:

- **Framework:** [Next.js](https://nextjs.org/) (App Router & Pages Router)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **API:** [tRPC](https://trpc.io/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Authentication:** NextAuth.js (Customized)
- **Payments:** Stripe Integration

### Key Directory Structure

- `apps/web`: The main Next.js application.
  - `app/manager`: Manager dashboard routes.
  - `app/instructor`: Instructor dashboard routes.
  - `app/parent`: Parent dashboard routes.
  - `app/kiosk`: Self-service kiosk for attendance/check-in.
- `packages/prisma`: Database schema and migrations.
- `packages/trpc`: Backend API logic.
  - `server/routers/viewer/swim`: Swim-specific API routers.

## 3. Database Schema Extensions

The project extends the core Cal.com schema with specific models for swim schools.

### Core Data Models

- **Swimmer**: Represents a student.
  - _Relations_: Linked to a Parent (`User`) and a School (`Team`).
  - _Data_: Name, birth date, medical notes, skill level.
- **Enrollment**: Links a `Swimmer` to a `EventType` (Lesson Template).
  - _Status_: ACTIVE, WITHDRAWN, COMPLETED, WAITLISTED.
  - _Billing_: Tracks payment frequency and Stripe subscription.
- **AttendanceRecord**: Tracks attendance for a specific lesson instance (`Booking`).
  - _Status_: PRESENT, ABSENT, EXCUSED, LATE.
- **ProgressNote**: Instructor feedback and skill tracking.
  - _Visibility_: Can be visible to parents or internal-only.
- **SkillLevel & SkillAchievement**: Defines the curriculum and tracks student progress.
  - Support for certificates and skill trees.
- **MakeupLesson**: Manages credits for missed lessons.

## 4. Key Features by Role

### 👨‍💼 School Manager

- **Dashboard**: Overview of school performance.
- **Financials**:
  - Track revenue, invoices, and payments.
  - Manage Stripe connections.
- **Waitlist Management**: View and manage waitlisted students for classes.
- **Skill/Certificate Management**: Define skill trees and generate certificates.
- **Kiosk Mode**: Launch a check-in kiosk for the front desk.

### 🏊 Instructor

- **Schedule View**: access upcoming lessons.
- **Attendance**: Mark students as present/absent.
- **Progress Tracking**: Log skills achieved and write notes for parents.

### 👪 Parent

- **Swimmer Profiles**: Manage profiles for their children.
- **Enrollment**: Sign up for classes.
- **Payments**: Manage payment methods and view billing history.
- **Progress**: View skill achievements and instructor notes.
- **Absence Reporting**: Report upcoming absences.

## 5. API Structure (tRPC)

The backend logic is organized into a dedicated `swim` router namespace within tRPC.

**Router Path:** `viewer.swim.*`

| Sub-Router           | Description                                   |
| :------------------- | :-------------------------------------------- |
| `swimmers`           | CRUD operations for swimmer profiles.         |
| `enrollments`        | Manage class sign-ups and status changes.     |
| `enrollmentPayments` | Handle billing logic for enrollments.         |
| `attendance`         | Mark and retrieve attendance records.         |
| `progressNotes`      | Create and view instructor feedback.          |
| `instructor`         | Instructor-specific views and actions.        |
| `manager`            | Admin-level operations for school managers.   |
| `financial`          | Financial reporting and data aggregation.     |
| `skills`             | Manage skill trees and achievements.          |
| `makeup`             | Manage makeup lesson credits and scheduling.  |
| `waitlist`           | Manage class waitlists.                       |
| `kiosk`              | Public-facing kiosk functionality.            |
| `notifications`      | Manage communication preferences and history. |
| `messaging`          | Internal messaging system.                    |

## 6. Deployment & Setup

### Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 13.x
- Redis (optional, for specific features)

### Quick Start

1.  **Clone the repository**.
2.  **Install dependencies**: `yarn install`
3.  **Environment Setup**: Copy `.env.example` to `.env` and configure database URLs and API keys.
4.  **Database Setup**:
    ```bash
    yarn workspace @calcom/prisma db-migrate
    yarn workspace @calcom/prisma db-seed
    ```
5.  **Run Development Server**: `yarn dx` (Runs web app + Prisma Studio)

## 7. Current Status & Roadmap

**Current State**: Phase 3 Feature Completion

- ✅ Core database models implemented.
- ✅ Role-based dashboards (Manager, Instructor, Parent) built.
- ✅ Stripe integration for payments.
- ✅ Skill tree and certificate generation functionality.
- ✅ Mobile-optimized interfaces.

**Planned/Upcoming**:

- Advanced analytics for school managers.
- Enhanced communication tools (SMS/Email automation refinement).
