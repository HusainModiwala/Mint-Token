
import {Collection, CreateMetadataAccountV3InstructionAccounts, CreateMetadataAccountV3InstructionDataArgs, Creator, MPL_TOKEN_METADATA_PROGRAM_ID, UpdateMetadataAccountV2InstructionAccounts, UpdateMetadataAccountV2InstructionData, Uses, createMetadataAccountV3, updateMetadataAccountV2, findMetadataPda, DataV2} from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import { PublicKey, createSignerFromKeypair, none, signerIdentity, some } from "@metaplex-foundation/umi";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fromWeb3JsKeypair, fromWeb3JsPublicKey} from '@metaplex-foundation/umi-web3js-adapters';

export function loadWalletKey(keypairFile:string): web3.Keypair {
    const fs = require("fs");
    const loaded = web3.Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
    );
    return loaded;
  }

const INITIALIZE = true;

async function main(){
    console.log("let's name some tokens in 2024!");
    const myKeypair = loadWalletKey("AthdE9W7dh147MbHoMFRTgqs4vHBb8YZFGL7qbqkTWJn.json");
    const mint = loadWalletKey("MtaevhpdivVpgiPi6QPcyUHZ2P4jydjsrK7WkZ9vZR6.json").publicKey;
    console.log(mint);


    const umi = createUmi("https://api.devnet.solana.com");
    const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(myKeypair))
    umi.use(signerIdentity(signer, true))

    const ourMetadata = { // TODO change those values!
        name: "Silly HM Coin",
        symbol: "HM2406",
        uri: "https://raw.githubusercontent.com/HusainModiwala/social-media-app-express.js-project-/main/metadata.json",
    }
    const onChainData = {
        ...ourMetadata,
        // we don't need that
        sellerFeeBasisPoints: 0,
        creators: none<Creator[]>(),
        collection: none<Collection>(),
        uses: none<Uses>(),
    } as DataV2
    if(!INITIALIZE){
        const accounts: CreateMetadataAccountV3InstructionAccounts = {
            mint: fromWeb3JsPublicKey(mint),
            mintAuthority: signer,
        }
        const data: CreateMetadataAccountV3InstructionDataArgs = {
            isMutable: true,
            collectionDetails: null,
            data: onChainData
        }
        console.log('inside');

        const txid = await createMetadataAccountV3(umi, {...accounts, ...data}).sendAndConfirm(umi)
        console.log(txid)
    } else {
        const data: UpdateMetadataAccountV2InstructionData = {
            data: some(onChainData),
            discriminator: 0,
            isMutable: some(true),
            newUpdateAuthority: none<PublicKey>(),
            primarySaleHappened: none<boolean>()
        }
        const accounts: UpdateMetadataAccountV2InstructionAccounts = {
            metadata: findMetadataPda(umi,{mint: fromWeb3JsPublicKey(mint)}),
            updateAuthority: signer
        }
        const txid = await updateMetadataAccountV2(umi, {...accounts, ...data} ).sendAndConfirm(umi);
        console.log(txid)
    }

}

main();