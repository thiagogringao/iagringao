import { getDb } from '../server/db';
import { users } from '../drizzle/schema';
import { hashPassword } from '../server/auth';
import { eq } from 'drizzle-orm';

async function createAdminUser() {
    console.log('🔐 Criando usuário administrador...\n');

    const db = await getDb();
    if (!db) {
        console.error('❌ Erro: Banco de dados não disponível');
        process.exit(1);
    }

    const adminEmail = 'admin@joalheria.com';
    const adminPassword = 'admin123';
    const adminName = 'Administrador';

    try {
        // Verifica se o usuário já existe
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, adminEmail))
            .limit(1);

        if (existingUser.length > 0) {
            console.log('⚠️  Usuário admin já existe. Atualizando senha...\n');

            const passwordHash = await hashPassword(adminPassword);

            await db
                .update(users)
                .set({
                    passwordHash,
                    role: 'admin',
                    updatedAt: new Date(),
                })
                .where(eq(users.email, adminEmail));

            console.log('✅ Senha do administrador atualizada com sucesso!\n');
        } else {
            console.log('📝 Criando novo usuário administrador...\n');

            const passwordHash = await hashPassword(adminPassword);

            await db.insert(users).values({
                openId: 'admin-user',
                email: adminEmail,
                name: adminName,
                passwordHash,
                role: 'admin',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            console.log('✅ Usuário administrador criado com sucesso!\n');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 CREDENCIAIS DE ACESSO:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Email:    ${adminEmail}`);
        console.log(`   Senha:    ${adminPassword}`);
        console.log(`   Função:   Administrador`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('✨ Você pode fazer login agora!\n');

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Erro ao criar usuário:', error.message);
        process.exit(1);
    }
}

createAdminUser();
