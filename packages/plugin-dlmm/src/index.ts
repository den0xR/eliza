export * from "./providers/dlmm.provider";
import type { Plugin } from "@elizaos/core";
import { dlmmProvider } from './providers/dlmm.provider';

export const dlmmPlugin: Plugin = {
    name: "dlmm",
    description: "DLMM Plugin for Eliza",
    actions: [
       // createPosition,
       // createPair
    ],
    providers: [dlmmProvider]
};
