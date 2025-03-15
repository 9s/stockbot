import {Command} from "@sapphire/framework";
import {prisma} from "../index.ts";
import {fetchPrice} from "../internal/api.ts";
import {formatNumber, START_BALANCE} from "../internal/trade.ts";

export class HoldingsCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) => builder
            .setName('holdings')
            .setDescription('view your holdings')
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const holdings = await prisma.holding.findMany({
            where: {
                userId: interaction.user.id,
            },
        })

        let content = '';
        let total = 0;

        for (const holding of holdings) {
            // todo: remove this workaround for zero amount assets
            if (holding.amount === 0 && holding.ticker !== 'USD') {
                continue;
            }

            if (holding.ticker === 'USD') {
                const cash = holding.amount / 100;
                total += cash;
                content += `Cash: $${formatNumber(cash)}\n`;
                continue;
            }

            try {
                // todo: do this in parallel
                const price = await fetchPrice(holding.ticker);
                const value = price * holding.amount;
                total += value;
                content += `${holding.ticker}: ${holding.amount}@${formatNumber(price)} - $${formatNumber(value)}\n`;
            } catch (e) {
                console.error(e);
            }
        }

        total = Math.round(total);
        const rel = (total / (START_BALANCE / 100) - 1) * 100;
        content += `total: $${formatNumber(total)} (${formatNumber(rel)}%)`;

        await interaction.reply(content);
    }
}
