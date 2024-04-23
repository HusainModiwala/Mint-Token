import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js"
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import fs from "fs";
import {
    updateV1,
    fetchMetadataFromSeeds,
} from '@metaplex-foundation/mpl-token-metadata'
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters"
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';

const umi = createUmi('https://api.devnet.solana.com');
const connection = new Connection(clusterApiUrl("devnet"))
const payer = loadKeyPair("./PayGvCH9iUCaSukeZcQHAFt1Dv3dkZuVFs8pdSumDGM.json");

function loadKeyPair(filePath: string) {
    const secret = JSON.parse(fs.readFileSync(filePath, {encoding: "utf-8"})) as number[];
    const secretKey = Uint8Array.from(secret);
    return Keypair.fromSecretKey(secretKey);
}

async function mintToken(mintAuth: Keypair, mint?: Keypair): Promise<PublicKey> {
    if(mint && PublicKey.isOnCurve(mint?.publicKey)) return mint.publicKey;

    const mintAddress = await createMint(connection, payer, mintAuth.publicKey, null, 9, mint ?? undefined);
    console.log("mint address:- ", mintAddress.toBase58());
    return mintAddress;
}

async function createATA(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
    const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, owner);
    console.log("ata address:- ", ata.address.toBase58());
    return ata.address;
}

async function transferMintTokens(decimalAmt: number, mint: PublicKey, recipient: PublicKey, mintAuth: Keypair): Promise<string> {
    const amount = decimalAmt*10**9;
    const signx = await mintTo(connection, payer, mint, recipient, mintAuth, amount);
    return signx;
}

async function main() {
    const mint = loadKeyPair("./MtaevhpdivVpgiPi6QPcyUHZ2P4jydjsrK7WkZ9vZR6.json");
    const mintAuth = loadKeyPair("./AthdE9W7dh147MbHoMFRTgqs4vHBb8YZFGL7qbqkTWJn.json");

    // mint account
    const mintPubKey = await mintToken(mintAuth, mint);

    // ata for owner
    const owner = loadKeyPair("../../ephkey.json");
    const ata = await createATA(mintPubKey, owner.publicKey);

    // mint to the ata
    const signx = await transferMintTokens(2, mintPubKey, ata, mintAuth);
    console.log("transaction success:- ", signx);
}

// main();


async function updateMetaData(){
    const web3Mint = loadKeyPair("./MtaevhpdivVpgiPi6QPcyUHZ2P4jydjsrK7WkZ9vZR6.json").publicKey
    const mint = fromWeb3JsPublicKey(web3Mint);
    console.log('before');
    
    const initialMetadata = await fetchMetadataFromSeeds(umi, {mint})
    console.log('yes');

    await updateV1(umi, {
        mint,
        data: { ...initialMetadata, name: 'Updated Asset' },
    }).sendAndConfirm(umi)
}
updateMetaData();
