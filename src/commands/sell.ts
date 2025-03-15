import {Command} from "@sapphire/framework";
import {TradeAction, tradeAsset, tradeCommand} from "../internal/trade.ts";

export class SellCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) => tradeCommand(builder, TradeAction.SELL));
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await tradeAsset(interaction, TradeAction.SELL);
    }
}
