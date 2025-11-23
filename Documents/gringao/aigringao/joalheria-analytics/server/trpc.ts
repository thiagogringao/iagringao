import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

export interface Context {
  user?: {
    id: number;
    name?: string;
    email?: string;
    role?: string;
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Não autenticado');
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

