import { z } from "zod";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const sendMessageSchema = z.object({
  recipientId: z.number().int(),
  swimmerId: z.string().uuid().optional(),
  subject: z.string().optional(),
  body: z.string(),
});

const markAsReadSchema = z.object({
  messageId: z.string().uuid(),
});

const deleteMessageSchema = z.object({
  messageId: z.string().uuid(),
});

const messagingRouter = router({
  /**
   * Send a message
   */
  send: authedProcedure.input(sendMessageSchema).mutation(async ({ ctx, input }) => {
    // Verify recipient exists
    const recipient = await ctx.prisma.user.findUnique({
      where: { id: input.recipientId },
    });
    if (!recipient) throw new Error("Recipient not found");

    // Optional: Verify swimmer context if provided
    if (input.swimmerId) {
      const swimmer = await ctx.prisma.swimmer.findUnique({
        where: { id: input.swimmerId },
      });
      if (!swimmer) throw new Error("Swimmer not found");
    }

    return ctx.prisma.swimMessage.create({
      data: {
        senderId: ctx.user?.id!,
        recipientId: input.recipientId,
        swimmerId: input.swimmerId,
        subject: input.subject,
        body: input.body,
      },
    });
  }),

  /**
   * Get inbox (messages where user is recipient)
   */
  getInbox: authedProcedure
    .input(z.object({ unreadOnly: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.swimMessage.findMany({
        where: {
          recipientId: ctx.user?.id,
          ...(input.unreadOnly ? { read: false } : {}),
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          swimmer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return messages.map((msg) => ({
        id: msg.id,
        sender: msg.sender,
        swimmer: msg.swimmer
          ? { id: msg.swimmer.id, name: `${msg.swimmer.firstName} ${msg.swimmer.lastName}` }
          : null,
        subject: msg.subject,
        body: msg.body,
        read: msg.read,
        readAt: msg.readAt,
        createdAt: msg.createdAt,
      }));
    }),

  /**
   * Get sent messages
   */
  getSent: authedProcedure.query(async ({ ctx }) => {
    const messages = await ctx.prisma.swimMessage.findMany({
      where: { senderId: ctx.user?.id },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        swimmer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return messages.map((msg) => ({
      id: msg.id,
      recipient: msg.recipient,
      swimmer: msg.swimmer
        ? { id: msg.swimmer.id, name: `${msg.swimmer.firstName} ${msg.swimmer.lastName}` }
        : null,
      subject: msg.subject,
      body: msg.body,
      read: msg.read,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
    }));
  }),

  /**
   * Get unread count
   */
  getUnreadCount: authedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.swimMessage.count({
      where: {
        recipientId: ctx.user?.id,
        read: false,
      },
    });
  }),

  /**
   * Mark message as read
   */
  markAsRead: authedProcedure.input(markAsReadSchema).mutation(async ({ ctx, input }) => {
    // Verify user is recipient
    const message = await ctx.prisma.swimMessage.findFirst({
      where: {
        id: input.messageId,
        recipientId: ctx.user?.id,
      },
    });
    if (!message) throw new Error("Message not found");

    return ctx.prisma.swimMessage.update({
      where: { id: input.messageId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }),

  /**
   * Delete message
   */
  delete: authedProcedure.input(deleteMessageSchema).mutation(async ({ ctx, input }) => {
    // Verify user is sender or recipient
    const message = await ctx.prisma.swimMessage.findFirst({
      where: {
        id: input.messageId,
        OR: [{ senderId: ctx.user?.id }, { recipientId: ctx.user?.id }],
      },
    });
    if (!message) throw new Error("Message not found");

    await ctx.prisma.swimMessage.delete({
      where: { id: input.messageId },
    });

    return { success: true };
  }),

  /**
   * Get conversation with a specific user
   */
  getConversation: authedProcedure
    .input(z.object({ userId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.swimMessage.findMany({
        where: {
          OR: [
            { senderId: ctx.user?.id, recipientId: input.userId },
            { senderId: input.userId, recipientId: ctx.user?.id },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
          swimmer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return messages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.sender.name,
        swimmer: msg.swimmer
          ? { id: msg.swimmer.id, name: `${msg.swimmer.firstName} ${msg.swimmer.lastName}` }
          : null,
        subject: msg.subject,
        body: msg.body,
        read: msg.read,
        createdAt: msg.createdAt,
        isMine: msg.senderId === ctx.user?.id,
      }));
    }),
});

export default messagingRouter;
