import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./trpc";
import { authenticateUser, createUser, hashPassword } from "./auth";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const authRouter = router({
    // Login
    login: publicProcedure
        .input(
            z.object({
                email: z.string().email("Email inválido"),
                password: z.string().min(1, "Senha é obrigatória"),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const result = await authenticateUser(input.email, input.password);
                return {
                    success: true,
                    token: result.token,
                    user: result.user,
                };
            } catch (error: any) {
                throw new Error(error.message || "Erro ao fazer login");
            }
        }),

    // Verificar token (para manter sessão)
    verifyToken: publicProcedure
        .input(z.object({ token: z.string() }))
        .query(async ({ input }) => {
            const { verifyToken } = await import("./auth");
            const payload = verifyToken(input.token);

            if (!payload) {
                throw new Error("Token inválido ou expirado");
            }

            return {
                success: true,
                user: {
                    id: payload.userId,
                    email: payload.email,
                    name: payload.name,
                },
            };
        }),

    // Listar usuários (apenas admin)
    listUsers: protectedProcedure.query(async ({ ctx }) => {
        // Verifica se é admin
        if (ctx.user.role !== 'admin') {
            throw new Error("Acesso negado. Apenas administradores podem listar usuários.");
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const allUsers = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            createdAt: users.createdAt,
        }).from(users);

        return allUsers;
    }),

    // Criar usuário (apenas admin)
    createUser: protectedProcedure
        .input(
            z.object({
                email: z.string().email("Email inválido"),
                password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
                name: z.string().min(1, "Nome é obrigatório"),
                role: z.enum(["user", "admin"]).default("user"),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // Verifica se é admin
            if (ctx.user.role !== 'admin') {
                throw new Error("Acesso negado. Apenas administradores podem criar usuários.");
            }

            try {
                const newUser = await createUser({
                    email: input.email,
                    password: input.password,
                    name: input.name,
                });

                // Atualiza o role se necessário
                if (input.role === 'admin') {
                    const db = await getDb();
                    if (db) {
                        await db.update(users)
                            .set({ role: 'admin' })
                            .where(eq(users.id, newUser.id));
                    }
                }

                return {
                    success: true,
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        name: newUser.name,
                        role: input.role,
                    },
                };
            } catch (error: any) {
                throw new Error(error.message || "Erro ao criar usuário");
            }
        }),

    // Atualizar usuário (apenas admin)
    updateUser: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                email: z.string().email("Email inválido").optional(),
                name: z.string().min(1, "Nome é obrigatório").optional(),
                password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
                role: z.enum(["user", "admin"]).optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // Verifica se é admin
            if (ctx.user.role !== 'admin') {
                throw new Error("Acesso negado. Apenas administradores podem atualizar usuários.");
            }

            const db = await getDb();
            if (!db) throw new Error('Database not available');

            const updateData: any = {
                updatedAt: new Date(),
            };

            if (input.email) updateData.email = input.email;
            if (input.name) updateData.name = input.name;
            if (input.role) updateData.role = input.role;
            if (input.password) {
                updateData.passwordHash = await hashPassword(input.password);
            }

            await db.update(users)
                .set(updateData)
                .where(eq(users.id, input.id));

            return { success: true };
        }),

    // Deletar usuário (apenas admin)
    deleteUser: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
            // Verifica se é admin
            if (ctx.user.role !== 'admin') {
                throw new Error("Acesso negado. Apenas administradores podem deletar usuários.");
            }

            // Não permite deletar a si mesmo
            if (input.id === ctx.user.id) {
                throw new Error("Você não pode deletar seu próprio usuário.");
            }

            const db = await getDb();
            if (!db) throw new Error('Database not available');

            await db.delete(users).where(eq(users.id, input.id));

            return { success: true };
        }),
});
