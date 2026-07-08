import { PrismaClient } from "../packages/prisma/generated/prisma/client";

const prisma = new PrismaClient();
const PWD_HASH = "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"; // "password"

async function main() {
  console.log("🌱 Seeding Neon swim_school database...\n");

  // Admin
  const admin = await prisma.user.create({
    data: {
      username: "admin", email: "admin@swimschool.com", name: "Swim School Admin",
      role: "ADMIN", emailVerified: new Date(), completedOnboarding: true,
      locale: "en", timeZone: "Europe/Amsterdam",
      password: { create: { hash: PWD_HASH } },
    },
  }).catch(() => prisma.user.findFirstOrThrow({ where: { email: "admin@swimschool.com" } }));
  console.log("✅ Admin:", admin.email, "(id:", admin.id, ")");

  // Manager
  const manager = await prisma.user.create({
    data: {
      username: "manager", email: "manager@swimschool.com", name: "Pool Manager",
      emailVerified: new Date(), completedOnboarding: true,
      locale: "en", timeZone: "Europe/Amsterdam",
      password: { create: { hash: PWD_HASH } },
    },
  }).catch(() => prisma.user.findFirstOrThrow({ where: { email: "manager@swimschool.com" } }));
  console.log("✅ Manager:", manager.email, "(id:", manager.id, ")");

  // Instructor
  const instructor = await prisma.user.create({
    data: {
      username: "instructor", email: "instructor@swimschool.com", name: "Sarah Johnson",
      emailVerified: new Date(), completedOnboarding: true,
      locale: "en", timeZone: "Europe/Amsterdam",
      password: { create: { hash: PWD_HASH } },
    },
  }).catch(() => prisma.user.findFirstOrThrow({ where: { email: "instructor@swimschool.com" } }));
  console.log("✅ Instructor:", instructor.email, "(id:", instructor.id, ")");

  // Parent
  const parent = await prisma.user.create({
    data: {
      username: "parent", email: "parent@swimschool.com", name: "John Parent",
      emailVerified: new Date(), completedOnboarding: true,
      locale: "en", timeZone: "Europe/Amsterdam",
      password: { create: { hash: PWD_HASH } },
    },
  }).catch(() => prisma.user.findFirstOrThrow({ where: { email: "parent@swimschool.com" } }));
  console.log("✅ Parent:", parent.email, "(id:", parent.id, ")");

  // Team (parentId null = top-level org)
  const team = await prisma.team.create({
    data: {
      name: "Community Aquatic Center",
      slug: "aquatic-center",
      isOrganization: false,
      hideBranding: false,
      timeZone: "Europe/Amsterdam",
      weekStart: "Monday",
    },
  }).catch(() => prisma.team.findFirstOrThrow({ where: { slug: "aquatic-center" } }));
  console.log("✅ Team:", team.name, "(id:", team.id, ")");

  // Memberships
  await prisma.membership.create({
    data: { userId: manager.id, teamId: team.id, role: "OWNER", accepted: true },
  }).catch(() => null);
  await prisma.membership.create({
    data: { userId: instructor.id, teamId: team.id, role: "MEMBER", accepted: true },
  }).catch(() => null);
  console.log("✅ Memberships created");

  // Swimmers
  const swimmers = [
    { firstName: "Emma", lastName: "Parent", level: "BEGINNER" },
    { firstName: "Lucas", lastName: "Parent", level: "INTERMEDIATE" },
    { firstName: "Sophie", lastName: "Smith", level: "ADVANCED" },
    { firstName: "Daan", lastName: "Jansen", level: "BEGINNER" },
  ];

  for (const s of swimmers) {
    try {
      const sw = await prisma.swimmer.create({
        data: {
          firstName: s.firstName, lastName: s.lastName,
          birthDate: new Date("2017-06-15"),
          currentLevel: s.level,
          parentId: parent.id, teamId: team.id,
          emergencyContacts: [{ name: "John Parent", phone: "+31 6 1234 5678" }],
        },
      });
      console.log("✅ Swimmer:", sw.firstName, sw.lastName);
    } catch { /* skip duplicates */ }
  }

  console.log("\n🌱 Seed completed!");
  console.log("\n📋 Login credentials (password: 'password'):");
  console.log("  Admin:      admin@swimschool.com");
  console.log("  Manager:    manager@swimschool.com");
  console.log("  Instructor: instructor@swimschool.com");
  console.log("  Parent:     parent@swimschool.com");
}

main()
  .catch((e) => { console.error("Seed error:", e.message?.substring(0, 200)); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
