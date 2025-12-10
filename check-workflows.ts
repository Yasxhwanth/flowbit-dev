import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const workflows = await prisma.workflow.findMany({
        include: {
            user: true,
        },
    });

    console.log(JSON.stringify(workflows.map(w => ({
        id: w.id,
        name: w.name,
        userId: w.userId,
        userEmail: w.user.email
    })), null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
