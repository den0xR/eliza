import { AnchorProvider } from "@coral-xyz/anchor";
import { Wallet } from "@coral-xyz/anchor";
import { generateImage } from "@elizaos/core";
import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
    CreateTokenMetadata,
    DEFAULT_DECIMALS,
    PriorityFee,
    PumpFunSDK,
} from "pumpdotfun-sdk";

import { getAssociatedTokenAddressSync } from "@solana/spl-token";
//import bs58 from "bs58";
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
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    MINT_SIZE
} from '@solana/spl-token';

// Add this template for many-to-one transfers
const transferManyToOneTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "transferFrom": ["wallet1", "wallet2", "wallet3"],
    "transferTo": "wallet4"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract or generate the following information about the requested transfer:
- List of source wallet names
- Destination wallet name

Respond with a JSON markdown block containing only the extracted values.`;

export const transferFundsManyToOne: Action = {
    name: "TRANSFER_FUNDS_MANY_TO_ONE",
    similes: ["CONSOLIDATE_FUNDS", "MERGE_WALLETS", "COMBINE_FUNDS"],
    description: "Transfers all available funds from multiple wallets to a single recipient wallet",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true; // Basic validation - can be enhanced based on message content
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            // Compose state if not provided
            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            // Generate structured content from natural language
            const transferContext = composeContext({
                state,
                template: transferManyToOneTemplate,
            });

            const content = await generateObjectDeprecated({
                runtime,
                context: transferContext,
                modelClass: ModelClass.LARGE,
            });

            // Create connection to Solana network
            const connection = new Connection(
                /*runtime.character.settings.SOLANA_RPC_URL ||*/ "https://api.mainnet-beta.solana.com",
                'confirmed'
            );

            // Get recipient wallet public key
            const recipientPublicKey = runtime.character.settings.secrets?.[`${content.transferTo.toUpperCase()}_PUBLIC_KEY`];
            if (!recipientPublicKey) {
                throw new Error(`Public key not found for recipient wallet: ${content.transferTo}`);
            }

            const recipientPubkey = new PublicKey(recipientPublicKey);
            const transactions = [];

            // Process transfers from each sender wallet
            for (const senderWallet of content.transferFrom) {
                try {
                    // Get sender's private key
                    const senderPrivateKey = runtime.character.settings.secrets?.[`${senderWallet.toUpperCase()}_PRIVATE_KEY`];
                    if (!senderPrivateKey) {
                        throw new Error(`Private key not found for wallet: ${senderWallet}`);
                    }

                    //const senderKeypair = Keypair.fromSecretKey(bs58.decode(senderPrivateKey));
                    const senderKeypair = {
                        privateKey: 12154,
                        secretKey: new Uint8Array(32).fill(1), // Mock 32-byte secret key
                        publicKey: new PublicKey("11111111111111111111111111111111"), // Mock public key
                    };
                    // Get sender's balance
                    const balance = await connection.getBalance(senderKeypair.publicKey);

                    // Calculate transfer amount (balance minus fee)
                    const minimumRent = await connection.getMinimumBalanceForRentExemption(0);
                    const transferAmount = balance - minimumRent;

                    if (transferAmount <= 0) {
                        transactions.push({
                            sender: senderWallet,
                            amount: 0,
                            status: "skipped",
                            reason: "Insufficient balance"
                        });
                        continue;
                    }

                    // Create and send transaction
                    const transaction = new Transaction().add(
                        SystemProgram.transfer({
                            fromPubkey: senderKeypair.publicKey,
                            toPubkey: recipientPubkey,
                            lamports: transferAmount
                        })
                    );

                    const signature = await sendAndConfirmTransaction(
                        connection,
                        transaction,
                        [senderKeypair]
                    );

                    transactions.push({
                        sender: senderWallet,
                        amount: transferAmount / LAMPORTS_PER_SOL,
                        signature,
                        status: "success"
                    });

                } catch (error) {
                    transactions.push({
                        sender: senderWallet,
                        status: "failed",
                        error: error.message
                    });
                }
            }

            // Calculate total transferred amount
            const totalTransferred = transactions
                .filter(tx => tx.status === "success")
                .reduce((sum, tx) => sum + (tx.amount || 0), 0);

            if (callback) {
                const successfulTransfers = transactions.filter(tx => tx.status === "success");
                const failedTransfers = transactions.filter(tx => tx.status !== "success");

                let message = `Consolidated funds to ${content.transferTo}:\n`;

                if (successfulTransfers.length > 0) {
                    message += successfulTransfers
                        .map(tx => `- Transferred ${tx.amount.toFixed(4)} SOL from ${tx.sender} (tx: ${tx.signature})`)
                        .join('\n');
                }

                if (failedTransfers.length > 0) {
                    message += '\n\nFailed transfers:\n' + failedTransfers
                        .map(tx => `- ${tx.sender}: ${tx.reason || tx.error}`)
                        .join('\n');
                }

                message += `\n\nTotal transferred: ${totalTransferred.toFixed(4)} SOL`;

                callback({
                    text: message,
                    content: {
                        transfers: transactions,
                        recipient: content.transferTo,
                        totalTransferred,
                        timestamp: Date.now()
                    }
                });
            }

            return transactions.some(tx => tx.status === "success");

        } catch (error) {
            if (callback) {
                callback({
                    text: `Error during funds consolidation: ${error.message}`,
                    content: { error: error.message }
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Consolidate all funds from wallet1, wallet2, and wallet3 into wallet4",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Consolidated funds to wallet4:\n- Transferred 1.5 SOL from wallet1 (tx: abc...)\n- Transferred 2.0 SOL from wallet2 (tx: def...)\n- Transferred 0.5 SOL from wallet3 (tx: ghi...)\n\nTotal transferred: 4.0000 SOL",
                    action: "TRANSFER_FUNDS_MANY_TO_ONE",
                    content: {
                        transfers: [
                            {
                                sender: "wallet1",
                                amount: 1.5,
                                signature: "abc...",
                                status: "success"
                            },
                            {
                                sender: "wallet2",
                                amount: 2.0,
                                signature: "def...",
                                status: "success"
                            },
                            {
                                sender: "wallet3",
                                amount: 0.5,
                                signature: "ghi...",
                                status: "success"
                            }
                        ],
                        recipient: "wallet4",
                        totalTransferred: 4.0
                    },
                },
            },
        ],
    ] as ActionExample[][],
};

