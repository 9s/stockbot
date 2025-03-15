import {Command} from "@sapphire/framework";
import {TradeAction, tradeAsset, tradeCommand} from "../internal/trade.ts";

export class BuyCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) => tradeCommand(builder, TradeAction.BUY));
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await tradeAsset(interaction, TradeAction.BUY);
    }
}
