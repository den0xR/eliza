import { type IAgentRuntime, type Memory, type Provider, type State } from "@elizaos/core";
import DLMM, { StrategyType, BinLiquidity, LbPosition } from '@meteora-ag/dlmm';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { settings } from '@elizaos/core';
import BN from 'bn.js';

// Provider configuration
const PROVIDER_CONFIG = {
    DEFAULT_RPC: "https://api.mainnet-beta.solana.com",
};

export class DLMMClient {
    private client: DLMM;
    private connection: Connection;
    private keypair: Keypair;
    public activeBin?: BinLiquidity;
    public userPositions?: LbPosition[];

    constructor(connection: Connection) {
        this.connection = connection;
        this.keypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(settings.SOLANA_PRIVATE_KEY || ''))
        );
    }

    async initializePool() {
        const poolAddress = new PublicKey(settings.DLMM_POOL_ADDRESS || '');
        this.client = await DLMM.create(this.connection, poolAddress);
        await this.updateActiveBin();
    }

    async updateActiveBin() {
        this.activeBin = await this.client.getActiveBin();
    }

    async getActiveBin() {
        if (!this.activeBin) {
            await this.updateActiveBin();
        }
        return this.activeBin;
    }

    async updateUserPositions() {
        const { userPositions } = await this.client.getPositionsByUserAndLbPair(
            this.keypair.publicKey
        );
        this.userPositions = userPositions;
    }

    async getUserPositions() {
        if (!this.userPositions) {
            await this.updateUserPositions();
        }
        return this.userPositions;
    }

    async createPosition(
        strategyType: StrategyType,
        xAmount: BN,
        yAmount: BN,
        bins: number
    ) {
        const positionKeypair = Keypair.generate();
        const minBinId = (await this.getActiveBin()).binId - bins;
        const maxBinId = (await this.getActiveBin()).binId + bins;

        const tx = await this.client.initializePositionAndAddLiquidityByStrategy({
            positionPubKey: positionKeypair.publicKey,
            user: this.keypair.publicKey,
            totalXAmount: xAmount,
            totalYAmount: yAmount,
            strategy: { minBinId, maxBinId, strategyType }
        });

        return { tx, positionKeypair };
    }

    async addLiquidity(position: PublicKey, xAmount: BN, yAmount: BN, bins: number) {
        const minBinId = (await this.getActiveBin()).binId - bins;
        const maxBinId = (await this.getActiveBin()).binId + bins;

        return this.client.addLiquidityByStrategy({
            positionPubKey: position,
            user: this.keypair.publicKey,
            totalXAmount: xAmount,
            totalYAmount: yAmount,
            strategy: { minBinId, maxBinId, strategyType: StrategyType.SpotBalanced }
        });
    }

    async removeLiquidity(position: PublicKey, bins: number[]) {
        return this.client.removeLiquidity({
            position,
            user: this.keypair.publicKey,
            binIds: bins,
            bps: new BN(10000),
            shouldClaimAndClose: true
        });
    }

    async swap(inToken: PublicKey, outToken: PublicKey, amount: BN, slippageBps: BN) {
        const binArrays = await this.client.getBinArrayForSwap(true);
        const quote = await this.client.swapQuote(amount, true, slippageBps, binArrays);
        
        return this.client.swap({
            inToken,
            outToken,
            inAmount: amount,
            lbPair: this.client.pubkey,
            user: this.keypair.publicKey,
            minOutAmount: quote.minOutAmount,
            binArraysPubkey: quote.binArraysPubkey
        });
    }

    public getClient(): DLMM {
        return this.client;
    }
}

export const dlmmProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        _message?: Memory,
        _state?: State
    ): Promise<DLMMClient | null> {
        const connection = new Connection(settings.SOLANA_RPC_URL || '');
        const client = new DLMMClient(connection);
        await client.initializePool();
        return client;
    }
};
