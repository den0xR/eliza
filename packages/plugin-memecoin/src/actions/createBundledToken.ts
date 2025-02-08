import {
    settings,
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    generateObjectDeprecated,
    composeContext,
    type Action,
} from "@elizaos/core";

import {
    CreateTokenMetadata,
    DEFAULT_DECIMALS,
    PriorityFee,
    PumpFunSDK,
} from "pumpdotfun-sdk";

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface CreateBundledContent extends Content {
    tokenMetadata: {
        name: string;
        symbol: string;
        description: string;
        image_description: string;
        twitter?: string;
        telegram?: string;
        website?: string;
    },
    wallets: string[],
    amounts: number[],
    buyAmountSol: number;
}


// template for bundled token creation
const bundledTokenTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenMetadata": {
        "name": "TestingName Yeah1",
        "symbol": "testico2",
        "description": "Just a tfeest",
        "twitter": "https://x.com/eadlea",
        "telegram": "https://t.me/feaealfeafea",
        "website": "https://www.ffefefefeefeea.fun"
    },
    "wallets": ["wallet1", "wallet2", "wallet3", "wallet4", "wallet5"],
    "amounts": [100000, 50000, 50000, 25000, 25000],
    "initial_supply": 1000000
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract or generate the following information about the requested token creation:
- Token metadata (name, symbol, description, social links)
- List of 5 wallet addresses
- Corresponding amounts for each wallet
- Initial supply

If there is error thrown in callback answer with "Please provide more info"
Respond with a JSON markdown block containing only the extracted values.`;


// function to check wallet balances --- will be edited
/*async function checkWalletBalances(connection: Connection, wallets: string[], requiredAmount: number): Promise<{ success: boolean, message?: string }> {
    try {
        for (const wallet of wallets) {
            const balance = await connection.getBalance(new PublicKey(wallet));
            const solBalance = balance / LAMPORTS_PER_SOL;

            if (solBalance < requiredAmount) {
                return {
                    success: false,
                    message: `Insufficient balance in wallet ${wallet}. Required: ${requiredAmount} SOL, Available: ${solBalance.toFixed(2)} SOL`
                };
            }
        }
        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: `Error checking wallet balances: ${error.message}`
        };
    }
}*/

export const createBundledToken: Action = {
    name: "CREATE_BUNDLED_TOKEN",
    description: "Creates a token on Pump.fun using 5 bundled transactions from different wallets",
    similes: ["BUNDLE_TOKEN", "CREATE_MULTI_WALLET_TOKEN"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Simple initial validation
        return true; // Moved detailed validation to after content generation
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            const bundleContext = composeContext({
                state: await runtime.composeState(message),
                template: bundledTokenTemplate,
            });

            const content = await generateObjectDeprecated({
                runtime,
                context: bundleContext,
                modelClass: ModelClass.LARGE,
            }) as CreateBundledContent;

            // Moved validation here, after content is generated
            if (!content?.tokenMetadata) {
                throw new Error("Token metadata is required");
            }

            // Validate required token metadata fields
            const requiredMetadataFields = {
                name: "string",
                symbol: "string",
                description: "string",
                //image_description: "string"
            };

            for (const [field, type] of Object.entries(requiredMetadataFields)) {
                if (typeof content.tokenMetadata[field] !== type) {
                    throw new Error(`Invalid ${field}: must be a ${type}`);
                }
            }

            // Validate optional social links (if provided)
            const optionalFields = ['twitter', 'telegram', 'website'];
            for (const field of optionalFields) {
                //if (content.tokenMetadata[field] !== undefined &&
                if (content.tokenMetadata[field] != null &&
                    typeof content.tokenMetadata[field] !== 'string') {
                    throw new Error(`Invalid ${field}: must be a string if provided`);
                }
            }

            // Validate wallets array
            if (!Array.isArray(content.wallets)) {
                throw new Error("Wallets must be an array");
            }
            if (content.wallets.length !== 5) {
                throw new Error("Exactly 5 wallet addresses are required");
            }
            if (!content.wallets.every(wallet => typeof wallet === 'string')) {
                throw new Error("All wallet addresses must be strings");
            }

            // Validate amounts array
            if (!Array.isArray(content.amounts)) {
                throw new Error("Amounts must be an array");
            }
            if (content.amounts.length !== 5) {
                throw new Error("Exactly 5 amount values are required");
            }
            if (!content.amounts.every(amount => typeof amount === 'number' && amount > 0)) {
                throw new Error("All amounts must be positive numbers");
            }

            const tokenMetadata: CreateTokenMetadata = {
                ...content.tokenMetadata,
                file: null
            };

            // Create connection to Solana network- To EDIT
            /*const connection = new Connection("https://api.mainnet-beta.solana.com", 'confirmed');

            // Check balances before proceeding
            const balanceCheck = await checkWalletBalances(connection, content.wallets, content.buyAmountSol);
            if (!balanceCheck.success) {
                if (callback) {
                    callback({
                        text: balanceCheck.message,
                        content: { error: balanceCheck.message }
                    });
                }
                return false;
            };*/

            // Initialize SDK with appropriate connection
            /* const pumpSDK = new PumpFunSDK({
                 connection: new Connection("https://api.mainnet-beta.solana.com", 'confirmed'), // Example connection
             });*/

            // Generate keypairs for mint and metadata
            /*const mintKeypair = Keypair.generate();
            const metadataKeypair = Keypair.generate();

            const totalSupply = content.amounts.reduce((sum, amount) => sum + BigInt(amount), BigInt(0));
            const totalAmount = content.amounts.reduce((sum, amount) => sum + BigInt(amount), BigInt(0));

            const bundledTx = await pumpSDK.createAndBuy(
                mintKeypair,
                metadataKeypair,
                tokenMetadata,
                totalAmount,
                // content.wallets.map(wallet => new PublicKey(wallet)),
                totalSupply,
                //PriorityFee.HIGH
            );*/

            var i = 1; //just to test if statement below 
            //if statement should be if (boundledTx.success)
            //some fields are commented out for test purpose, will be changed at the end
            if (i === 1) {
                if (callback) {
                    callback({
                        text: `Token ${tokenMetadata.name} (${tokenMetadata.symbol}) created successfully!\n` +
                            `Contract Address: ${"test"/*mintKeypair.publicKey.toString()*/}\n` +
                            `View at: https://pump.fun/${"test"/*mintKeypair.publicKey.toString()*/}\n\n` +
                            `Social Links:\n` +
                            `Twitter: ${tokenMetadata.twitter}\n` +
                            `Telegram: ${tokenMetadata.telegram}\n` +
                            `Website: ${tokenMetadata.website}`,
                        content: {
                            tokenInfo: {
                                symbol: tokenMetadata.symbol,
                                address: "test" /*mintKeypair.publicKey.toString()*/,
                                name: tokenMetadata.name,
                                description: tokenMetadata.description,
                                social: {
                                    twitter: tokenMetadata.twitter,
                                    telegram: tokenMetadata.telegram,
                                    website: tokenMetadata.website
                                },
                                signature: "test"/*bundledTx.signature*/,
                                wallets: content.wallets,
                                amounts: content.amounts,
                                initial_supply: content.initial_supply,
                                timestamp: Date.now(),
                            },
                        },
                    });
                }
                return true;
            } else {
                if (callback) {
                    callback({
                        text: "Failed to create bundled token. Please try again.",
                        content: {
                            error: "Token creation failed"
                        },
                    });
                }
                throw new Error(String(/*bundledTx.error ||*/ "Failed to create bundled token"));
            }
        } catch (error) {
            if (callback) {
                callback({
                    text: `Error: ${error.message}`,
                    content: {
                        error: error.message
                    },
                });
            }
            console.error("Handler error:", error);
            throw error;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a bundled token called MULTITOKEN with symbol MTK, description 'A multi-wallet test token', and these social links: twitter.com/mtk, t.me/mtk, mtk.fun. Use 5 wallets with amounts [100000, 50000, 50000, 25000, 25000]",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Processing",
                    action: "CREATE_BUNDLED_TOKEN",
                    content: {
                        tokenInfo: {
                            symbol: "MTK",
                            address: "ABC123...",
                            name: "MULTITOKEN",
                            description: "A multi-wallet test token",
                            social: {
                                twitter: "https://twitter.com/mtk",
                                telegram: "https://t.me/mtk",
                                website: "https://mtk.fun"
                            }
                        },
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Launch a new meme token called PEPE SPACE (PSPACE). Description: 'Taking Pepe to the moon and beyond! 🐸🚀'. Social links: twitter.com/pepespace, t.me/pepespacetoken. Distribute with wallets: [200000, 100000, 100000, 50000, 50000]",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Token PEPE SPACE (PSPACE) created successfully!\nContract Address: DEF456...\nView at: https://pump.fun/DEF456...\n\nSocial Links:\nTwitter: https://twitter.com/pepespace\nTelegram: https://t.me/pepespacetoken",
                    action: "CREATE_BUNDLED_TOKEN",
                    content: {
                        tokenInfo: {
                            symbol: "PSPACE",
                            address: "DEF456...",
                            name: "PEPE SPACE",
                            description: "Taking Pepe to the moon and beyond! 🐸🚀",
                            social: {
                                twitter: "https://twitter.com/pepespace",
                                telegram: "https://t.me/pepespacetoken"
                            }
                        },
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a new community token named DOGE WARRIORS (DWAR). Description: 'Unite the Doge army! Much wow, very strong 🐕'. Add social links: twitter.com/dogewarriors, t.me/dogewarriorsofficial, dogewarriors.xyz. Distribution: [150000, 125000, 100000, 75000, 50000]",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Token DOGE WARRIORS (DWAR) created successfully!\nContract Address: GHI789...\nView at: https://pump.fun/GHI789...\n\nSocial Links:\nTwitter: https://twitter.com/dogewarriors\nTelegram: https://t.me/dogewarriorsofficial\nWebsite: https://dogewarriors.xyz",
                    action: "CREATE_BUNDLED_TOKEN",
                    content: {
                        tokenInfo: {
                            symbol: "DWAR",
                            address: "GHI789...",
                            name: "DOGE WARRIORS",
                            description: "Unite the Doge army! Much wow, very strong 🐕",
                            social: {
                                twitter: "https://twitter.com/dogewarriors",
                                telegram: "https://t.me/dogewarriorsofficial",
                                website: "https://dogewarriors.xyz"
                            }
                        },
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Launch a token called MOON CATS (MCAT) with description 'Feline friends reaching for the stars 🐱✨'. Social: twitter.com/mooncatstoken, t.me/mooncatsclub. Split tokens: [300000, 200000, 200000, 150000, 150000]",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Token MOON CATS (MCAT) created successfully!\nContract Address: JKL012...\nView at: https://pump.fun/JKL012...\n\nSocial Links:\nTwitter: https://twitter.com/mooncatstoken\nTelegram: https://t.me/mooncatsclub",
                    action: "CREATE_BUNDLED_TOKEN",
                    content: {
                        tokenInfo: {
                            symbol: "MCAT",
                            address: "JKL012...",
                            name: "MOON CATS",
                            description: "Feline friends reaching for the stars 🐱✨",
                            social: {
                                twitter: "https://twitter.com/mooncatstoken",
                                telegram: "https://t.me/mooncatsclub"
                            }
                        },
                    },
                },
            },
        ],

    ] as ActionExample[][],
}