import { Plugin } from "@elizaos/core";
import { createBundledToken } from "./actions/createBundledToken"
import { transferFundsOneToMany } from "./actions/transferFundsOneToMany"
import { transferFundsManyToOne } from "./actions/transferFundsManyToOne"

export const memeCoinPlugin: Plugin = {
    name: "memecoin",
    //version: "0.1.0",
    actions: [
        createBundledToken,
        transferFundsOneToMany,
    ],
    description: "meme coin plugin for creating and transfering tokens"
};

export default memeCoinPlugin;