import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token válido por 7 dias

export interface JWTPayload {
    userId: number;
    email: string;
    name: string;
}

/**
 * Gera um token JWT para o usuário
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica e decodifica um token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Hash de senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Compara senha com hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Cria um novo usuário
 */
export async function createUser(data: {
    email: string;
    password: string;
    name: string;
}) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Verifica se o email já existe
    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

    if (existingUser.length > 0) {
        throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const passwordHash = await hashPassword(data.password);

    // Cria o usuário
    const newUser = await db.insert(users).values({
        openId: `local-${Date.now()}`,
        email: data.email,
        name: data.name,
        passwordHash: passwordHash,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning();

    return newUser[0];
}

/**
 * Autentica um usuário
 */
export async function authenticateUser(email: string, password: string) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Busca o usuário
    const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (userResult.length === 0) {
        // Se não encontrou o usuário, verifica se é o email demo
        if (email === 'demo@joalheria.com') {
            // Cria usuário demo se não existir
            const demoPasswordHash = await hashPassword('demo123');

            try {
                const newUser = await db.insert(users).values({
                    openId: 'demo-user',
                    email: 'demo@joalheria.com',
                    name: 'Usuário Demo',
                    passwordHash: demoPasswordHash,
                    role: 'admin',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }).returning();

                const token = generateToken({
                    userId: newUser[0].id,
                    email: newUser[0].email || '',
                    name: newUser[0].name || 'Usuário Demo',
                });

                return {
                    token,
                    user: {
                        id: newUser[0].id,
                        email: newUser[0].email,
                        name: newUser[0].name,
                        role: newUser[0].role,
                    },
                };
            } catch (error: any) {
                // Se já existe (erro de unique constraint), tenta buscar novamente
                const existingUser = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1);

                if (existingUser.length > 0) {
                    const user = existingUser[0];
                    const token = generateToken({
                        userId: user.id,
                        email: user.email || '',
                        name: user.name || 'Usuário Demo',
                    });

                    return {
                        token,
                        user: {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                        },
                    };
                }
            }
        }

        throw new Error('Email ou senha incorretos');
    }

    const user = userResult[0];

    // Verifica a senha
    if (user.passwordHash) {
        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Email ou senha incorretos');
        }
    }
    // Se não tem passwordHash, aceita qualquer senha (modo demo/desenvolvimento)

    // Gera o token
    const token = generateToken({
        userId: user.id,
        email: user.email || '',
        name: user.name || 'Usuário',
    });

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    };
}
