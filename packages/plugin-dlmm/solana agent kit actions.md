Deploy a New Token
const result = await agent.deployToken(
  "my ai token", // name
  "uri", // uri
  "token", // symbol
  9, // decimals
  1000000 // initial supply
);

console.log("Token Mint Address:", result.mint.toString());
Create NFT Collection on 3Land
const isDevnet = false; // (Optional) if not present TX takes place in Mainnet
const priorityFeeParam = 1000000; // (Optional) if not present the default priority fee will be 50000

 const collectionOpts: CreateCollectionOptions = {
    collectionName: "",
    collectionSymbol: "",
    collectionDescription: "",
    mainImageUrl: ""
  };

const result = await agent.create3LandCollection(
      collectionOpts,
      isDevnet, // (Optional) if not present TX takes place in Mainnet
      priorityFeeParam, //(Optional)
    );
Create NFT on 3Land
When creating an NFT using 3Land's tool, it automatically goes for sale on 3.land website

const isDevnet = true; // (Optional) if not present TX takes place in Mainnet
const withPool = true; // (Optional) only present if NFT will be created with a Liquidity Pool for a specific SPL token
const priorityFeeParam = 1000000; // (Optional) if not present the default priority fee will be 50000
const collectionAccount = ""; //hash for the collection
const createItemOptions: CreateSingleOptions = {
  itemName: "",
  sellerFee: 500, //5%
  itemAmount: 100, //total items to be created
  itemSymbol: "",
  itemDescription: "",
  traits: [
    { trait_type: "", value: "" },
  ],
  price: 0, //100000000 == 0.1 sol, can be set to 0 for a free mint
  splHash: "", //present if listing is on a specific SPL token, if not present sale will be on $SOL, must be present if "withPool" is true
  poolName: "", // Only present if "withPool" is true
  mainImageUrl: "",
};
const result = await agent.create3LandNft(
  collectionAccount,
  createItemOptions,
  isDevnet, // (Optional) if not present TX takes place in Mainnet
  withPool
  priorityFeeParam, //(Optional)
);
Create NFT Collection
const collection = await agent.deployCollection({
  name: "My NFT Collection",
  uri: "https://arweave.net/metadata.json",
  royaltyBasisPoints: 500, // 5%
  creators: [
    {
      address: "creator-wallet-address",
      percentage: 100,
    },
  ],
});
Swap Tokens
import { PublicKey } from "@solana/web3.js";

const signature = await agent.trade(
  new PublicKey("target-token-mint"),
  100, // amount
  new PublicKey("source-token-mint"),
  300 // 3% slippage
);
Lend Tokens
import { PublicKey } from "@solana/web3.js";

const signature = await agent.lendAssets(
  100 // amount of USDC to lend
);
Stake SOL
const signature = await agent.stake(
  1 // amount in SOL to stake
);
Stake SOL on Solayer
const signature = await agent.restake(
  1 // amount in SOL to stake
);
Send an SPL Token Airdrop via ZK Compression
import { PublicKey } from "@solana/web3.js";

(async () => {
  console.log(
    "~Airdrop cost estimate:",
    getAirdropCostEstimate(
      1000, // recipients
      30_000 // priority fee in lamports
    )
  );

  const signature = await agent.sendCompressedAirdrop(
    new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"), // mint
    42, // amount per recipient
    [
      new PublicKey("1nc1nerator11111111111111111111111111111111"),
      // ... add more recipients
    ],
    30_000 // priority fee in lamports
  );
})();
Fetch Price Data from Pyth
const priceFeedID = await agent.getPythPriceFeedID("SOL");

const price = await agent.getPythPrice(priceFeedID);

console.log("Price of SOL/USD:", price);
Open PERP Trade
import { PublicKey } from "@solana/web3.js";

const signature = await agent.openPerpTradeLong({
  price: 300, // $300 SOL Max price
  collateralAmount: 10, // 10 jitoSOL in
  collateralMint: new PublicKey("J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn"), // jitoSOL
  leverage: 50000, // x5
  tradeMint: new PublicKey("J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn"), // jitoSOL
  slippage: 0.3, // 0.3%
});
Close PERP Trade
import { PublicKey } from "@solana/web3.js";

const signature = await agent.closePerpTradeLong({
  price: 200, // $200 SOL price
  tradeMint: new PublicKey("J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn"), // jitoSOL
});
Close Empty Token Accounts
const { signature } = await agent.closeEmptyTokenAccounts();