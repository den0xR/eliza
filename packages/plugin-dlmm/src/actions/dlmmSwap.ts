import {
    type ActionExample,
    composeContext,
    generateObjectDeprecated,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    type Action,
    elizaLogger,
} from "@elizaos/core";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { DLMMClient } from "../providers/dlmm.provider";
import { dlmmProvider } from "../providers/dlmm.provider";

const swapTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "inToken": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "outToken": "So11111111111111111111111111111111111111112",
    "amount": "1000000",
    "slippageBps": "50"
}
\`\`\`

{{recentMessages}}

Extract the following information about the requested token swap:
- Input token address (the token being sold)
- Output token address (the token being bought)
- Amount to swap (in base units)
- Slippage in basis points (default to 50 if not specified)

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined. The result should be a valid JSON object with the following schema:
\`\`\`json
{
    "inToken": string | null,
    "outToken": string | null,
    "amount": string | null,
    "slippageBps": string | null
}
\`\`\``;

export const executeSwap: Action = {
    name: "EXECUTE_DLMM_SWAP",
    similes: ["DLMM_SWAP", "DLMM_TOKEN_SWAP", "DLMM_TRADE"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Validating DLMM swap message:", message);
        return true;
    },
    description: "Perform a token swap using DLMM.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const swapContext = composeContext({
            state,
            template: swapTemplate,
        });

        const response = await generateObjectDeprecated({
            runtime,
            context: swapContext,
            modelClass: ModelClass.LARGE,
        });

        elizaLogger.log("Parsed swap parameters:", response);

        if (!response.inToken || !response.outToken) {
            elizaLogger.log("Missing token addresses, cannot proceed with swap");
            const responseMsg = {
                text: "I need both input and output token addresses to perform the swap",
            };
            callback?.(responseMsg);
            return true;
        }

        if (!response.amount) {
            elizaLogger.log("No amount provided, skipping swap");
            const responseMsg = {
                text: "I need the amount to perform the swap",
            };
            callback?.(responseMsg);
            return true;
        }

        try {
            const client = await dlmmProvider.get(runtime, message, state);
            if (!client) {
                throw new Error("Failed to initialize DLMM client");
            }

            // Ensure pool is initialized
            await client.initializePool();

            const tx = await client.swap(
                new PublicKey(response.inToken),
                new PublicKey(response.outToken),
                new BN(response.amount),
                new BN(response.slippageBps || "50")
            );

            elizaLogger.log("Swap transaction executed:", tx);

            const responseMsg = {
                text: `Swap completed successfully! Transaction: ${tx}`,
            };
            callback?.(responseMsg);

            return true;
        } catch (error) {
            elizaLogger.error("Error during DLMM swap:", error);
            const responseMsg = {
                text: `Failed to execute swap: ${error.message}`,
            };
            callback?.(responseMsg);
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    inToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                    outToken: "So11111111111111111111111111111111111111112",
                    amount: "1000000",
                    text: "Swap 1 USDC for SOL using DLMM",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Swapping 1 USDC for SOL using DLMM...",
                    action: "DLMM_SWAP",
                },
            },
        ],
    ],
};
