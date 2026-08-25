import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "../shared/const";
import * as db from "./db";

const linkSchema = z.object({
  platform: z.string().min(1).max(32),
  label: z.string().min(1).max(120),
  url: z.string().url(),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});

const cardInputSchema = z.object({
  publicSlug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(180),
  jobTitle: z.string().max(180).optional().nullable(),
  company: z.string().max(180).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().max(320).optional().nullable(),
  location: z.string().max(180).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  theme: z.record(z.string(), z.unknown()).optional().nullable(),
  isPublished: z.boolean().default(true),
  links: z.array(linkSchema).max(20).default([]),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  cards: router({
    list: protectedProcedure.query(({ ctx }) => db.listCards(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number().int() })).query(({ ctx, input }) => db.getCardById(input.id, ctx.user.id)),
    getBySlug: publicProcedure.input(z.object({ slug: z.string().min(3).max(80) })).query(({ input }) => db.getPublicCardBySlug(input.slug)),
    create: protectedProcedure.input(cardInputSchema).mutation(({ ctx, input }) => {
      const { links, ...card } = input;
      return db.createCard(ctx.user.id, card, links);
    }),
    update: protectedProcedure.input(cardInputSchema.extend({ id: z.number().int(), clientMutationId: z.string().max(96).optional(), baseVersion: z.number().int().default(0) })).mutation(({ ctx, input }) => {
      const { id, links, clientMutationId, baseVersion, ...card } = input;
      return db.updateCard(ctx.user.id, id, card, links, clientMutationId, baseVersion);
    }),
  }),
  sync: router({
    pull: protectedProcedure.input(z.object({ version: z.number().int().default(0) })).query(({ ctx, input }) => db.getChangesSince(ctx.user.id, input.version)),
  }),
});

export type AppRouter = typeof appRouter;
