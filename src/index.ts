import {SapphireClient} from '@sapphire/framework';
import {PrismaClient} from '@prisma/client'

export const prisma = new PrismaClient();

async function main() {
    const client = new SapphireClient({
        intents: [],
        loadMessageCommandListeners: false,
    });

    await client.login(process.env.BOT_TOKEN);
}

main().then(async () => {
    await prisma.$disconnect();
}).catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
