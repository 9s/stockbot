import {prisma} from "../index.ts";
import {Command} from "@sapphire/framework";
import {type SlashCommandBuilder} from "discord.js";
import {fetchPrice} from "./api.ts";

export const tradeCommand = (builder: SlashCommandBuilder, action: TradeAction): SlashCommandBuilder => {
    return <SlashCommandBuilder>builder
        .setName(action.toLowerCase())
        .setDescription(`${action.toLowerCase()} an asset`)
        .addStringOption(option => option
            .setName('ticker')
            .setDescription('ticker of the asset')
        )
        .addIntegerOption(option => option
            .setName('amount')
            .setDescription('number of shares')
        )
}

export enum TradeAction {
    BUY = 'BUY',
    SELL = 'SELL',
}

// cent balance
export const START_BALANCE = 10_000 * 100;

export const tradeAsset = async (interaction: Command.ChatInputCommandInteraction, action: TradeAction) => {
    const opts = interaction.options;
    let ticker = opts.getString('ticker');
    const amount = opts.getInteger('amount');

    if (!ticker || !amount) {
        await interaction.reply({
            content: 'please provide a ticker and quantity',
        });
        return;
    }

    ticker = ticker.toUpperCase();

    if (amount < 0 || amount > 1_000_000) {
        await interaction.reply({
            content: '0 < amount < 1,000,000',
        });
        return;
    }

    const userId = interaction.user.id;

    await lazyInitBalance(userId);
    await execTrade(
        ticker,
        amount,
        action,
        userId,
        interaction
    );
}

// todo: put this in a middleware or something
const lazyInitBalance = async (userId: string) => {
    const hasBalance = await prisma.holding.count({
        where: {
            userId
        }
    }) > 0

    if (hasBalance) {
        return
    }

    await prisma.holding.create({
        data: {
            ticker: 'USD',
            amount: START_BALANCE,
            userId
        }
    })
}

const execTrade = async (
    ticker: string,
    amount: number,
    action: TradeAction,
    userId: string,
    interaction: Command.ChatInputCommandInteraction
) => {
    const holding = await prisma.holding.findFirst({
        where: {
            userId,
            ticker
        }
    });

    if (action == TradeAction.SELL && (!holding || holding.amount < amount)) {
        await interaction.reply({
            content: 'you do not have enough shares to sell',
        });
        return;
    }

    const balance = await prisma.holding.findFirst({
        where: {
            userId,
            ticker: 'USD'
        }
    });

    let price = 0;

    try {
        price = await fetchPrice(ticker);
    } catch (e) {
        await interaction.reply({
            content: 'failed to fetch price',
        });
        return;
    }

    if (!balance || amount * price > balance.amount / 100) {
        await interaction.reply({
            content: 'you do not have enough liquidity',
        });
        return;
    }

    await updateHoldings(
        action,
        ticker,
        userId,
        amount,
        price
    )

    await interaction.reply({
        content: `${action} ${amount}x${ticker} @${price}`,
    });
}

const updateHoldings = async (
    action: TradeAction,
    ticker: string,
    userId: string,
    amount: number,
    price: number
) => {
    await prisma.$transaction(async (tx) => {
        // todo: delete holding when final amount is 0
        await tx.holding.upsert({
            where: {
                hid: {
                    ticker,
                    userId,
                }
            },
            create: {
                ticker,
                amount,
                userId
            },
            update: {
                amount: {
                    [TradeAction.BUY ? 'increment' : 'decrement']: amount
                }
            }
        });

        await tx.holding.update({
            where: {
                hid: {
                    ticker: 'USD',
                    userId,
                }
            },
            data: {
                amount: {
                    [TradeAction.BUY ? 'decrement' : 'increment']: price * amount * 100
                }
            }
        });
    })
}

export const formatNumber = (n: number): string => {
    return n.toLocaleString('en-US', {minimumFractionDigits: 2})
}
