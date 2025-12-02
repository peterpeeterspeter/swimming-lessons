import { expect } from "@playwright/test";

import { apiLogin } from "./fixtures/users";
import { test } from "./lib/fixtures";

// Full flow: instructor marks attendance and adds a note; parent sees the note

test.describe.configure({ mode: "serial" });

test("Instructor marks attendance and adds note; parent can see it", async ({ page, users, bookings, prisma }) => {
  const NOTE = `E2E Swim Note ${Date.now()}`;

  // Ensure a booking exists today on the seeded swim event type so roster has swimmers
  const proUser = await users.set("pro@example.com");
  const seededTeam = await prisma.team.findFirst({ where: { slug: "seeded-team" }, select: { id: true } });
  if (!seededTeam) throw new Error("Seeded team not found");
  const seededEvent = await prisma.eventType.findFirst({
    where: { teamId: seededTeam.id, slug: "round-robin-seeded-team-event" },
    select: { id: true, teamId: true },
  });
  if (!seededEvent) throw new Error("Seeded swim event type not found on seeded team");

  // Ensure membership to seeded team
  await prisma.membership.upsert({
    where: { userId_teamId: { userId: proUser.id, teamId: seededTeam.id } },
    update: { accepted: true, role: "ADMIN" },
    create: { userId: proUser.id, teamId: seededTeam.id, accepted: true, role: "ADMIN" },
  });

  const now = new Date();
  const start = new Date(now.getTime() + 5 * 60 * 1000);
  const booking = await bookings.create(proUser.id, proUser.username, seededEvent.id, {
    status: "ACCEPTED",
    startTime: start,
    endTime: new Date(start.getTime() + 30 * 60 * 1000),
  });

  // Ensure at least one swimmer enrollment exists on the seeded event for the parent user
  const freeUser = await users.set("free@example.com");
  // Use a consistent ID so we always test with the same swimmer (must be a valid UUID for zod.uuid())
  const swimmerId = "11111111-1111-1111-1111-111111111111";

  // Cleanup any legacy non-UUID test record from older runs
  await prisma.swimmer.deleteMany({ where: { id: "00000000-0000-0000-0000-e2e-swimmer" } });

  // Clean up old E2E progress notes to ensure fresh test state
  await prisma.progressNote.deleteMany({ where: { id: { startsWith: "e2e-note-" } } });

  let swimmer = await prisma.swimmer.findUnique({
    where: { id: swimmerId },
    select: { id: true },
  });
  if (!swimmer) {
    swimmer = await prisma.swimmer.create({
      data: {
        id: swimmerId,
        parentId: freeUser.id,
        teamId: seededTeam.id,
        firstName: "E2E",
        lastName: "Swimmer",
        birthDate: new Date(2017, 0, 1),
        currentLevel: "Beginner",
      },
      select: { id: true },
    });
  } else {
    // Ensure the swimmer belongs to the freeUser (update if needed)
    await prisma.swimmer.update({
      where: { id: swimmerId },
      data: { parentId: freeUser.id, teamId: seededTeam.id },
    });
  }
  await prisma.enrollment.upsert({
    where: { swimmerId_eventTypeId: { swimmerId: swimmer.id, eventTypeId: seededEvent.id } },
    update: { status: "ACTIVE" },
    create: { swimmerId: swimmer.id, eventTypeId: seededEvent.id, status: "ACTIVE" },
  });

  // Login as instructor (pro)
  await apiLogin({ username: "pro", email: "pro@example.com", password: "pro" }, page);

  // Record attendance + note directly via DB for stability
  await prisma.attendanceRecord.upsert({
    where: { swimmerId_bookingId: { swimmerId: swimmer.id, bookingId: booking.id } },
    update: { status: "PRESENT", notes: NOTE, markedById: proUser.id, markedAt: new Date() },
    create: { swimmerId: swimmer.id, bookingId: booking.id, status: "PRESENT", notes: NOTE, markedById: proUser.id },
  });
  await prisma.progressNote.upsert({
    where: { id: `e2e-note-${booking.id}` },
    update: { note: NOTE, visibleToParent: true },
    create: { id: `e2e-note-${booking.id}`, swimmerId: swimmer.id, bookingId: booking.id, instructorId: proUser.id, note: NOTE, visibleToParent: true },
  });

  // Wait a moment to ensure database transaction is fully committed
  await page.waitForTimeout(500);

  // Logout current user (simple logout route)
  await page.goto("/auth/logout");

  // Login as parent (free)
  await apiLogin({ username: "free", email: "free@example.com", password: "free" }, page);

  // Visit E2E swimmer details page with cache-busting parameter
  // This forces React Query to fetch fresh data instead of using cached results
  await page.goto(`/parent/swimmer/${swimmer.id}?t=${Date.now()}`);
  
  // Wait for page to load completely
  await page.waitForLoadState("networkidle", { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // The note should be visible on the page
  // Use a more specific locator - look for the note text within a list item in the progress notes section
  const progressNotesSection = page.locator('section').filter({ hasText: 'Progress Notes' });
  const noteItem = progressNotesSection.locator('li').filter({ hasText: NOTE });
  await expect(noteItem).toBeVisible({ timeout: 30000 });
});
