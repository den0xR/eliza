import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
    Action,
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    ModelClass,
    generateObjectDeprecated,
    composeContext,
} from "@elizaos/core";



// template for the transfer action
const transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "transferFrom": "wallet1",
    "transferTo": [
        { "wallet": "wallet2", "amount": 1.5 },
        { "wallet": "wallet3", "amount": 2.0 }
    ]
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract or generate the following information about the requested transfer:
- Source wallet name
- List of recipient wallets and amounts

Respond with a JSON markdown block containing only the extracted values.`;

export const transferFundsOneToMany: Action = {
    name: "TRANSFER_FUNDS_ONE_TO_MANY",
    similes: ["SEND_TO_MULTIPLE", "MULTI_TRANSFER", "BATCH_SEND"],
    description: "Transfers funds from one wallet to multiple recipient wallets",
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
                template: transferTemplate,
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

            // Get sender wallet
            const senderPrivateKey = runtime.character.settings.secrets?.[`${content.transferFrom.toUpperCase()}_PRIVATE_KEY`];
            if (!senderPrivateKey) {
                throw new Error(`Private key not found for wallet: ${content.transferFrom}`);
            }

            //const senderKeypair = Keypair.fromSecretKey(bs58.decode(senderPrivateKey));
            //for test
            const senderKeypair = {
                privateKey: 12154,
                secretKey: new Uint8Array(32).fill(1), // Mock 32-byte secret key
                publicKey: new PublicKey("11111111111111111111111111111111"), // Mock public key
            };
            // Create and send transactions for each recipient
            const transactions = [];
            for (const recipient of content.transferTo) {
                const recipientPublicKey = runtime.character.settings.secrets?.[`${recipient.wallet.toUpperCase()}_PUBLIC_KEY`];
                if (!recipientPublicKey) {
                    throw new Error(`Public key not found for wallet: ${recipient.wallet}`);
                }

                const transaction = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: senderKeypair.publicKey,
                        toPubkey: new PublicKey(recipientPublicKey),
                        lamports: Math.floor(recipient.amount * LAMPORTS_PER_SOL)
                    })
                );

                const signature = await sendAndConfirmTransaction(
                    connection,
                    transaction,
                    [senderKeypair]
                );

                transactions.push({
                    recipient: recipient.wallet,
                    amount: recipient.amount,
                    signature
                });
            }

            if (callback) {
                callback({
                    text: `Successfully transferred funds from ${content.transferFrom}:\n` +
                        transactions.map(tx =>
                            `- Sent ${tx.amount} SOL to ${tx.recipient} (tx: ${tx.signature})`
                        ).join('\n'),
                    content: {
                        transfers: transactions,
                        sender: content.transferFrom,
                        timestamp: Date.now()
                    }
                });
            }

            return true;

        } catch (error) {
            if (callback) {
                callback({
                    text: `Error during funds transfer: ${error.message}`,
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
                    text: "Transfer 1.5 SOL to wallet2 and 2 SOL to wallet3 from wallet1",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully transferred funds from wallet1:\n- Sent 1.5 SOL to wallet2 (tx: abc...)\n- Sent 2.0 SOL to wallet3 (tx: def...)",
                    action: "TRANSFER_FUNDS_ONE_TO_MANY",
                    content: {
                        transfers: [
                            {
                                recipient: "wallet2",
                                amount: 1.5,
                                signature: "abc..."
                            },
                            {
                                recipient: "wallet3",
                                amount: 2.0,
                                signature: "def..."
                            }
                        ],
                        sender: "wallet1"
                    },
                },
            },
        ],
    ] as ActionExample[][],
};

