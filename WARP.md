# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Cal.com is an open-source scheduling platform (Calendly alternative) built as a monorepo using Yarn workspaces and Turbo. The main application is a Next.js app with tRPC API layer, Prisma ORM, and PostgreSQL database.

**Key Technologies:**
- Next.js 13+ (App Router in some areas)
- tRPC for type-safe APIs
- Prisma ORM with PostgreSQL
- React 18 with TypeScript
- Tailwind CSS
- next-i18next for internationalization

## Common Commands

### Development

```bash
# Start development server (main web app)
yarn dev

# Quick start with Docker (includes local Postgres + test users)
yarn dx

# Start with multiple apps
yarn dev:all          # web, website, console
yarn dev:api          # web, api-proxy, api
yarn dev:console      # web, console
```

### Building & Testing

```bash
# Build all packages
yarn build

# Lint and fix code
yarn lint:fix

# Type check
yarn type-check

# Run all unit tests
yarn test

# Run specific test file
yarn test <filename>

# Run integration tests only
yarn test <filename> -- --integrationTestsOnly

# Run specific test by name
yarn test <filename> -t "<testName>" -- --integrationTestsOnly

# Run E2E tests
yarn e2e

# Run specific E2E test file
yarn e2e <filename>

# Run specific E2E test by name
yarn e2e <filename> --grep "<testName>"

# Test in watch mode
yarn tdd
```

### Database

```bash
# Open Prisma Studio
yarn db-studio

# Run migrations (development)
yarn workspace @calcom/prisma db-migrate

# Deploy migrations (production)
yarn workspace @calcom/prisma db-deploy

# Seed database with test data
yarn db-seed

# Generate Prisma client after schema changes
yarn prisma generate

# Connect to local database
psql "postgresql://postgres:@localhost:5432/calendso"
```

## Architecture

### Monorepo Structure

```
apps/
  web/                    # Main Next.js application
  api/                    # API service
  ui-playground/          # UI component playground

packages/
  prisma/                 # Database schema and migrations
  trpc/                   # tRPC routers and API layer
  ui/                     # Shared UI components
  features/               # Feature-specific code (70+ features)
  app-store/              # Third-party app integrations (140+ apps)
  lib/                    # Shared utilities (160+ files)
  emails/                 # Email templates
  embeds/                 # Embedding functionality
  platform/               # Platform APIs
  kysely/                 # Kysely types (generated)
```

### API Layer (tRPC)

**Router Organization:**
- `packages/trpc/server/routers/_app.ts` - Main router
- `packages/trpc/server/routers/viewer/` - Authenticated user routes (36 routers)
- `packages/trpc/server/routers/publicViewer/` - Public routes (20 routers)
- `packages/trpc/server/routers/loggedInViewer/` - Logged-in user routes (24 routers)
- `packages/trpc/server/routers/apps/` - App-specific routes

**Key Pattern:** All API routes are type-safe via tRPC, providing end-to-end TypeScript types from server to client.

### Database Layer

**Schema Location:** `packages/prisma/schema.prisma`

**Key Models:**
- `User`, `Team`, `Membership` - User management
- `EventType` - Event type definitions
- `Booking` - Booking records
- `Credential` - Integration credentials
- `Webhook`, `Workflow` - Automation
- `DestinationCalendar` - Calendar integrations

**Important Patterns:**
- Always use `select` instead of `include` for better performance
- Never expose `credential.key` field in API responses
- Use database-level filtering instead of JavaScript filtering
- Consider pagination for large datasets

**Generators:**
- Prisma Client (`@prisma/client`)
- Zod schemas (`zod-prisma-types`)
- Kysely types (`prisma-kysely`)
- TypeScript enums (`enum-generator.ts`)

### App Store Integrations

**Location:** `packages/app-store/`

**Structure:**
- 140+ integration directories (e.g., `googlecalendar/`, `zoom/`, `stripe/`)
- Each app has: metadata, API adapter, UI components, and webhook handlers
- Generated files (`*.generated.ts`) created by `app-store-cli`
- Static imports used for browser components (performance optimization)

**Common Integration Types:**
- Calendar services (Google, Outlook, Apple)
- Video conferencing (Zoom, Daily.co, Teams)
- CRM (HubSpot, Salesforce, Zoho)
- Payment (Stripe)

**Working with App Store:**
```bash
yarn create-app           # Create new integration
yarn edit-app            # Edit existing integration
yarn app-store:build     # Build app store
yarn app-store:watch     # Watch for changes
```

### Features Package

**Location:** `packages/features/`

**Key Feature Directories:**
- `ee/` - Enterprise features (workflows, organizations, teams, payments, SSO)
- `bookings/` - Booking management
- `calendar-cache-sql/` - Calendar caching system
- `insights/` - Analytics and insights
- `webhooks/` - Webhook handling
- `auth/` - Authentication flows
- `embed/` - Embed functionality

## Development Guidelines

### Environment Setup

1. Copy `.env.example` to `.env`
2. Generate encryption keys:
   ```bash
   openssl rand -base64 32  # For NEXTAUTH_SECRET
   openssl rand -base64 32  # For CALENDSO_ENCRYPTION_KEY
   ```
3. Configure PostgreSQL:
   - Set `DATABASE_URL` in `.env`
   - Set `DATABASE_DIRECT_URL` to same value
4. Run `yarn dx` for quick setup with Docker

**Local Test Users:**
When using `yarn dx`, test users are created with username:password format (e.g., `free:free`, `pro:pro`).

### Code Quality

**Before pushing:**
```bash
yarn type-check:ci --force    # Check TypeScript errors
yarn lint:fix                 # Fix linting issues
TZ=UTC yarn test              # Run tests with consistent timezone
```

**PR Requirements:**
- Follow Conventional Commits (`feat:`, `fix:`, `refactor:`)
- PR title must be specific, not generic
- Large PRs (>500 lines or >10 files) should be split:
  - Database migrations → Backend logic → Frontend components → Tests
- Type errors must be fixed before test failures
- Never use `as any` type casting

### Testing

**Test File Patterns:**
- Unit tests: `*.test.ts`
- E2E tests: `*.e2e.ts`
- Integration tests: `*.integration-test.ts`

**Running Tests:**
```bash
# Always use TZ=UTC for consistent timezone handling
TZ=UTC yarn test

# E2E tests with proper environment
PLAYWRIGHT_HEADLESS=1 yarn e2e [test-file.e2e.ts]

# Install Playwright browsers if needed
npx playwright install
```

**Test Users:**
E2E tests require proper environment variables (see `.env.example` for E2E_TEST_* variables).

### Database Migrations

**After schema changes:**
1. Create migration: `npx prisma migrate dev --name migration_name`
2. Generate client: `yarn prisma generate`
3. Update Kysely types automatically
4. Remember to squash migrations before merging (see [Prisma docs](https://www.prisma.io/docs/orm/prisma-migrate/workflows/squashing-migrations))

**Migration Patterns:**
- Feature flags: `yarn prisma migrate dev --create-only --name seed_[feature_name]_feature`
- Place in `packages/prisma/migrations/` with timestamp prefix
- Follow existing migration patterns for consistency

### Performance Considerations

- **Query Complexity:** Aim for O(n) or O(n log n), avoid O(n²)
- **Day.js:** Minimize usage in performance-critical paths, consider `.utc()` for operations
- **Database:** Use `select` over `include`, prefer database-level filtering
- **Imports:** Avoid barrel imports (index.ts files), import directly from source:
  ```typescript
  // ✅ Good
  import { Button } from "@calcom/ui/components/button";
  
  // ❌ Bad
  import { Button } from "@calcom/ui";
  ```

### File Naming Conventions

- **Components:** PascalCase (`BookingForm.tsx`)
- **Utilities:** kebab-case (`date-utils.ts`)
- **Types:** PascalCase with `.types.ts` (`Booking.types.ts`)
- **Tests:** Same as source + `.test.ts` or `.spec.ts`
- **Repositories:** Must include `Repository` suffix (`PrismaBookingRepository.ts`)
- **Services:** Must include `Service` suffix (`MembershipService.ts`)
- **Avoid:** Dot-suffixes except for tests, types, specs

### Repository Method Conventions

**Naming Rules:**
1. Don't include entity name in method names:
   ```typescript
   // ✅ Good
   class BookingRepository {
     findById(id: string) { ... }
     findByUserId(userId: string) { ... }
   }
   
   // ❌ Bad
   class BookingRepository {
     findBookingById(id: string) { ... }
   }
   ```

2. Use `include` or `with` keywords for methods fetching relations:
   ```typescript
   findByIdIncludeHosts(id: string)
   findByIdIncludeHostsAndSchedule(id: string)
   ```

### Error Handling

```typescript
// ✅ Good - Descriptive with context
throw new TRPCError({
  code: "BAD_REQUEST",
  message: `Unable to create booking: User ${userId} has no available time slots for ${date}`
});

// ❌ Bad - Generic
throw new Error("Booking failed");
```

### Internationalization

All UI strings must be translated:
1. Add to `en/locale.json`
2. Use i18n hooks in components
3. Follow existing translation patterns
4. Even if similar strings exist, new strings need explicit translation entries

### Logging

Control logging verbosity with `NEXT_PUBLIC_LOGGER_LEVEL` in `.env`:
- 0: silly, 1: trace, 2: debug, 3: info, 4: warn, 5: error, 6: fatal
- Logs at specified level and higher

Example: `NEXT_PUBLIC_LOGGER_LEVEL=3` logs info, warn, error, and fatal.

## Important Notes

### Working with Generated Files

- App store files (`*.generated.ts`) are created by CLI tools
- Don't manually edit generated files unless proof-of-concept
- After modifying generators, verify all generated files
- Check actual exports in source files before fixing imports

### Build Order Dependencies

After pulling updates affecting tRPC or Prisma:
```bash
yarn prisma generate
cd packages/trpc && yarn build
```

### Feature Flags

- Stored in `Feature` table in database
- Seeded via migrations in `packages/prisma/migrations/`
- Follow existing feature seeding patterns
- Default to manual team enablement

### Workflows vs Webhooks

Completely separate systems with different implementations:
- Workflows: `packages/features/ee/workflows/`
- Webhooks: Different directory structure
- Don't confuse or mix implementations

### Calendar Events

Cal.com bookings in external calendars (e.g., Google Calendar) are identified by iCalUID ending with "@Cal.com".

## Troubleshooting

### Common Issues

**Type Errors After Update:**
```bash
yarn prisma generate
cd packages/trpc && yarn build
```

**Test Failures:**
- Always run `TZ=UTC yarn test` for consistent timezone
- Fix type errors first: `yarn type-check:ci --force`
- Check that Playwright browsers are installed: `npx playwright install`

**Missing Dependencies:**
```bash
yarn install
yarn prisma generate
```

**Build Issues:**
```bash
yarn clean  # Remove build artifacts
yarn install
yarn build
```

## Additional Resources

- Full documentation: `.agents/` directory
- Commands reference: `.agents/commands.md`
- Knowledge base: `.agents/knowledge-base.md`
- README: Comprehensive setup and integration guides
- Contributing: `CONTRIBUTING.md`
- License: AGPLv3 for core, Enterprise Edition for multiplayer features
