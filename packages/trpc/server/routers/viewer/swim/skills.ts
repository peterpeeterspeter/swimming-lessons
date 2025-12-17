import { z } from "zod";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const createSkillLevelSchema = z.object({
  teamId: z.number().int(),
  name: z.string(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  skills: z.array(z.string()), // Array of skill names
  color: z.string().optional(),
  order: z.number().int().default(0),
});

const recordAchievementSchema = z.object({
  swimmerId: z.string().uuid(),
  skillLevelId: z.string().uuid(),
  skillName: z.string(),
  notes: z.string().optional(),
});

const getSwimmerProgressSchema = z.object({
  swimmerId: z.string().uuid(),
});

const generateCertificateSchema = z.object({
  swimmerId: z.string().uuid(),
  skillLevelId: z.string().uuid(),
});

const skillsRouter = router({
  /**
   * Create skill level (manager)
   */
  createSkillLevel: authedProcedure.input(createSkillLevelSchema).mutation(async ({ ctx, input }) => {
    // Verify user is team admin/owner
    const membership = await ctx.prisma.membership.findFirst({
      where: {
        teamId: input.teamId,
        userId: ctx.user?.id,
        role: { in: ["ADMIN", "OWNER"] },
      },
    });
    if (!membership) throw new Error("Unauthorized");

    const skillLevel = await ctx.prisma.skillLevel.create({
      data: {
        teamId: input.teamId,
        name: input.name,
        description: input.description,
        parentId: input.parentId,
        skills: input.skills,
        color: input.color,
        order: input.order,
      },
    });

    return skillLevel;
  }),

  /**
   * Get skill tree for team (manager/instructor view)
   */
  getSkillTree: authedProcedure
    .input(z.object({ teamId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      // Verify user is team member
      const membership = await ctx.prisma.membership.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.user?.id,
        },
      });
      if (!membership) throw new Error("Unauthorized");

      const skillLevels = await ctx.prisma.skillLevel.findMany({
        where: { teamId: input.teamId },
        include: {
          parent: true,
          children: true,
        },
        orderBy: { order: "asc" },
      });

      return skillLevels;
    }),

  /**
   * Update skill level
   */
  updateSkillLevel: authedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        skills: z.array(z.string()).optional(),
        color: z.string().optional(),
        order: z.number().int().optional(),
        parentId: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Get skill level to check team access
      const skillLevel = await ctx.prisma.skillLevel.findUnique({
        where: { id },
      });
      if (!skillLevel) throw new Error("Skill level not found");

      // Verify user is team admin/owner
      const membership = await ctx.prisma.membership.findFirst({
        where: {
          teamId: skillLevel.teamId,
          userId: ctx.user?.id,
          role: { in: ["ADMIN", "OWNER"] },
        },
      });
      if (!membership) throw new Error("Unauthorized");

      const updated = await ctx.prisma.skillLevel.update({
        where: { id },
        data,
      });

      return updated;
    }),

  /**
   * Delete skill level
   */
  deleteSkillLevel: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const skillLevel = await ctx.prisma.skillLevel.findUnique({
        where: { id: input.id },
      });
      if (!skillLevel) throw new Error("Skill level not found");

      // Verify user is team admin/owner
      const membership = await ctx.prisma.membership.findFirst({
        where: {
          teamId: skillLevel.teamId,
          userId: ctx.user?.id,
          role: { in: ["ADMIN", "OWNER"] },
        },
      });
      if (!membership) throw new Error("Unauthorized");

      await ctx.prisma.skillLevel.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Record skill achievement (instructor)
   */
  recordAchievement: authedProcedure.input(recordAchievementSchema).mutation(async ({ ctx, input }) => {
    // Verify swimmer access
    const swimmer = await ctx.prisma.swimmer.findUnique({
      where: { id: input.swimmerId },
      select: { teamId: true },
    });
    if (!swimmer) throw new Error("Swimmer not found");

    // Verify user is team member
    const membership = await ctx.prisma.membership.findFirst({
      where: {
        teamId: swimmer.teamId,
        userId: ctx.user?.id,
      },
    });
    if (!membership) throw new Error("Unauthorized");

    // Create achievement
    const achievement = await ctx.prisma.skillAchievement.create({
      data: {
        swimmerId: input.swimmerId,
        skillLevelId: input.skillLevelId,
        skillName: input.skillName,
        markedById: ctx.user?.id,
        notes: input.notes,
      },
    });

    // Check if all skills in level are now complete
    const skillLevel = await ctx.prisma.skillLevel.findUnique({
      where: { id: input.skillLevelId },
    });

    if (skillLevel) {
      const levelSkills = skillLevel.skills as string[];
      const swimmerAchievements = await ctx.prisma.skillAchievement.findMany({
        where: {
          swimmerId: input.swimmerId,
          skillLevelId: input.skillLevelId,
        },
      });

      const achievedSkills = swimmerAchievements.map((a) => a.skillName);
      const allComplete = levelSkills.every((skill) => achievedSkills.includes(skill));

      // Auto-generate certificate if level complete
      if (allComplete) {
        const certificateNumber = `SWIM-${Date.now()}-${input.swimmerId.slice(0, 8)}`;

        await ctx.prisma.certificate.create({
          data: {
            swimmerId: input.swimmerId,
            skillLevelId: input.skillLevelId,
            certificateNumber,
            data: {
              swimmerName: "", // Will be filled from swimmer data
              levelName: skillLevel.name,
              completedSkills: levelSkills,
              issuedDate: new Date().toISOString(),
            },
          },
        });

        // TODO: Generate PDF and upload to S3
      }

      return { ...achievement, levelComplete: allComplete };
    }

    return achievement;
  }),

  /**
   * Get swimmer progress across all levels
   */
  getSwimmerProgress: authedProcedure.input(getSwimmerProgressSchema).query(async ({ ctx, input }) => {
    // Verify access (parent or team member)
    const swimmer = await ctx.prisma.swimmer.findUnique({
      where: { id: input.swimmerId },
      select: { parentId: true, teamId: true },
    });

    if (!swimmer) throw new Error("Swimmer not found");

    const isParent = swimmer.parentId === ctx.user?.id;
    const isMember = await ctx.prisma.membership.findFirst({
      where: {
        teamId: swimmer.teamId,
        userId: ctx.user?.id,
      },
    });

    if (!isParent && !isMember) throw new Error("Unauthorized");

    // Get all skill levels for team
    const skillLevels = await ctx.prisma.skillLevel.findMany({
      where: { teamId: swimmer.teamId },
      orderBy: { order: "asc" },
    });

    // Get swimmer's achievements
    const achievements = await ctx.prisma.skillAchievement.findMany({
      where: { swimmerId: input.swimmerId },
      include: {
        markedBy: {
          select: { name: true },
        },
      },
    });

    // Get certificates
    const certificates = await ctx.prisma.certificate.findMany({
      where: { swimmerId: input.swimmerId },
      include: {
        skillLevel: true,
      },
      orderBy: { issuedAt: "desc" },
    });

    // Calculate progress for each level
    const progress = skillLevels.map((level) => {
      const levelSkills = level.skills as string[];
      const levelAchievements = achievements.filter((a) => a.skillLevelId === level.id);
      const achievedSkills = levelAchievements.map((a) => a.skillName);

      const completionPercentage =
        levelSkills.length > 0 ? Math.round((achievedSkills.length / levelSkills.length) * 100) : 0;

      const certificate = certificates.find((c) => c.skillLevelId === level.id);

      return {
        level,
        totalSkills: levelSkills.length,
        achievedSkills: achievedSkills.length,
        completionPercentage,
        achievements: levelAchievements,
        certificate,
      };
    });

    return { progress, certificates };
  }),

  /**
   * Generate certificate manually (if not auto-generated)
   */
  generateCertificate: authedProcedure.input(generateCertificateSchema).mutation(async ({ ctx, input }) => {
    // Verify instructor/admin access
    const swimmer = await ctx.prisma.swimmer.findUnique({
      where: { id: input.swimmerId },
      select: { teamId: true, firstName: true, lastName: true },
    });
    if (!swimmer) throw new Error("Swimmer not found");

    const membership = await ctx.prisma.membership.findFirst({
      where: {
        teamId: swimmer.teamId,
        userId: ctx.user?.id,
      },
    });
    if (!membership) throw new Error("Unauthorized");

    // Check if certificate already exists
    const existing = await ctx.prisma.certificate.findFirst({
      where: {
        swimmerId: input.swimmerId,
        skillLevelId: input.skillLevelId,
      },
    });

    if (existing) {
      return { success: true, certificate: existing, alreadyExists: true };
    }

    // Get skill level
    const skillLevel = await ctx.prisma.skillLevel.findUnique({
      where: { id: input.skillLevelId },
    });
    if (!skillLevel) throw new Error("Skill level not found");

    const certificateNumber = `SWIM-${Date.now()}-${input.swimmerId.slice(0, 8)}`;

    const certificate = await ctx.prisma.certificate.create({
      data: {
        swimmerId: input.swimmerId,
        skillLevelId: input.skillLevelId,
        certificateNumber,
        data: {
          swimmerName: `${swimmer.firstName} ${swimmer.lastName}`,
          levelName: skillLevel.name,
          issuedDate: new Date().toISOString(),
        },
      },
    });

    // TODO: Generate PDF and upload

    return { success: true, certificate, alreadyExists: false };
  }),
});

export default skillsRouter;
