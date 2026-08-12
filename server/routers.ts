import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { deleteProject, getProjectById, listProjectsByOwner, saveProject } from "./db";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  projects: router({
    list: protectedProcedure.query(({ ctx }) => listProjectsByOwner(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => getProjectById(ctx.user.id, input.id)),
    save: protectedProcedure.input(z.object({ id: z.number().int().positive().optional(), name: z.string().trim().min(1).max(160), filesJson: z.string().min(2).max(8_000_000), preferencesJson: z.string().min(2).max(100_000) })).mutation(({ ctx, input }) => saveProject(ctx.user.id, input)),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await deleteProject(ctx.user.id, input.id); return { success: true as const }; }),
  }),
});

export type AppRouter = typeof appRouter;
