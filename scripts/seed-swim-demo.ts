import "dotenv/config";
import dayjs from "dayjs";
import prisma from "@calcom/prisma";
import { MembershipRole } from "@calcom/prisma/enums";

async function main() {
  // Find team (school)
  const team = await prisma.team.findFirst({ where: { slug: "seeded-team" } });
  if (!team) {
    throw new Error("Seeded Team not found. Run base seed first.");
  }

  // Find users
  const parent = await prisma.user.findFirst({ where: { email: "free@example.com" } });
  const instructor = await prisma.user.findFirst({ where: { email: "pro@example.com" } });
  if (!parent || !instructor) {
    throw new Error("Required users not found (free@example.com, pro@example.com)");
  }

  // Ensure instructor is a member of the Seeded Team (required for instructor views)
  // and has at least ADMIN privileges for demo Manager access (without demoting OWNER)
  const existingMembership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: instructor.id, teamId: team.id } },
  });
  if (existingMembership) {
    if (existingMembership.role !== MembershipRole.OWNER) {
      await prisma.membership.update({
        where: { userId_teamId: { userId: instructor.id, teamId: team.id } },
        data: { accepted: true, role: MembershipRole.ADMIN },
      });
    } else if (!existingMembership.accepted) {
      await prisma.membership.update({
        where: { userId_teamId: { userId: instructor.id, teamId: team.id } },
        data: { accepted: true },
      });
    }
  } else {
    await prisma.membership.create({
      data: { userId: instructor.id, teamId: team.id, accepted: true, role: MembershipRole.ADMIN },
    });
  }

  // Find team event type
  const eventType = await prisma.eventType.findFirst({
    where: { slug: "round-robin-seeded-team-event", teamId: team.id },
  });
  if (!eventType) {
    throw new Error("Team event type 'round-robin-seeded-team-event' not found on Seeded Team");
  }

  // Create swimmers for parent in this team
  const swimmersData = [
    { firstName: "Ava", lastName: "Waters", birthDate: new Date(2017, 3, 12) },
    { firstName: "Liam", lastName: "Brooks", birthDate: new Date(2016, 7, 4) },
    { firstName: "Noah", lastName: "Reed", birthDate: new Date(2018, 10, 22) },
  ];

  const swimmers = [] as { id: string }[];
  for (const s of swimmersData) {
    const swimmer = await prisma.swimmer.upsert({
      where: {
        // Upsert by synthetic unique: parent/team/name combo via findFirst then create if not exists
        // Prisma doesn't support composite unique here; emulate with find
        id: "00000000-0000-0000-0000-" + (parent.id + team.id + s.firstName.charCodeAt(0)).toString().padStart(12, "0"),
      },
      update: {},
      create: {
        parentId: parent.id,
        teamId: team.id,
        firstName: s.firstName,
        lastName: s.lastName,
        birthDate: s.birthDate,
        currentLevel: "Beginner",
      },
    }).catch(async () => {
      // Fallback: create normally if the synthesized id conflicts
      return prisma.swimmer.create({
        data: {
          parentId: parent.id,
          teamId: team.id,
          firstName: s.firstName,
          lastName: s.lastName,
          birthDate: s.birthDate,
          currentLevel: "Beginner",
        },
        select: { id: true },
      });
    });
    // Ensure we only push id
    const ensured = await prisma.swimmer.findFirst({ where: { parentId: parent.id, teamId: team.id, firstName: s.firstName, lastName: s.lastName }, select: { id: true } });
    if (ensured) swimmers.push(ensured);
  }

  // Enroll swimmers into the team event type
  for (const sw of swimmers) {
    await prisma.enrollment.upsert({
      where: { swimmerId_eventTypeId: { swimmerId: sw.id, eventTypeId: eventType.id } },
      update: { status: "ACTIVE" },
      create: { swimmerId: sw.id, eventTypeId: eventType.id, status: "ACTIVE" },
    }).catch(() => undefined);
  }

  // Create a booking for today (anchor at local midday) so instructors can mark attendance reliably across timezones
  const start = dayjs().hour(12).minute(0).second(0).millisecond(0).toDate();
  const end = dayjs(start).add(30, "minute").toDate();
  const booking = await prisma.booking.create({
    data: {
      uid: Math.random().toString(36).slice(2),
      userId: instructor.id,
      eventTypeId: eventType.id,
      title: "Seeded Swim Lesson",
      startTime: start,
      endTime: end,
      status: "ACCEPTED",
    },
    select: { id: true },
  });

  // Pre-mark one swimmer as PRESENT for demo
  if (swimmers[0]) {
    await prisma.attendanceRecord.upsert({
      where: { swimmerId_bookingId: { swimmerId: swimmers[0].id, bookingId: booking.id } },
      update: { status: "PRESENT", markedById: instructor.id, markedAt: new Date(), notes: "On time" },
      create: {
        swimmerId: swimmers[0].id,
        bookingId: booking.id,
        status: "PRESENT",
        markedById: instructor.id,
        notes: "On time",
      },
    });
  }

  console.log(`Seeded ${swimmers.length} swimmers, enrollment to ${eventType.slug}, booking #${booking.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
