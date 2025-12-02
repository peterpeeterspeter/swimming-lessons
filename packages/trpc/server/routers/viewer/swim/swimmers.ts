import { z } from "zod";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const createSwimmerSchema = z.object({
  teamId: z.number().int(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().datetime().optional(),
  currentLevel: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContacts: z.any().optional(),
});

const updateSwimmerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  birthDate: z.string().datetime().optional().nullable(),
  currentLevel: z.string().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
  emergencyContacts: z.any().optional().nullable(),
});

const swimmersRouter = router({
  listMine: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return [];
    return ctx.prisma.swimmer.findMany({
      where: { parentId: userId },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: authedProcedure.input(createSwimmerSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Unauthorized");

    const birthDate = input.birthDate ? new Date(input.birthDate) : undefined;

    return ctx.prisma.swimmer.create({
      data: {
        parentId: userId,
        teamId: input.teamId,
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate,
        currentLevel: input.currentLevel,
        medicalNotes: input.medicalNotes,
        emergencyContacts: (input.emergencyContacts as any) ?? undefined,
      },
    });
  }),

  update: authedProcedure.input(updateSwimmerSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Unauthorized");

    const { id, birthDate, ...rest } = input;

    // Ensure the swimmer belongs to the caller
    const swimmer = await ctx.prisma.swimmer.findFirst({ where: { id, parentId: userId } });
    if (!swimmer) throw new Error("Not found");

    return ctx.prisma.swimmer.update({
      where: { id },
      data: {
        ...rest,
        birthDate: birthDate === undefined ? undefined : birthDate ? new Date(birthDate) : null,
      },
    });
  }),

  delete: authedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Unauthorized");

    // Ensure the swimmer belongs to the caller
    const swimmer = await ctx.prisma.swimmer.findFirst({ where: { id: input.id, parentId: userId } });
    if (!swimmer) throw new Error("Not found");

    await ctx.prisma.swimmer.delete({ where: { id: input.id } });
    return { ok: true };
  }),
});

export default swimmersRouter;
