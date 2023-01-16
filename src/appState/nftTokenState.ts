import {ERC1155ContractData, ERC721ContractData, NFT} from "../state";
import {combineLatest, map, Observable, switchMap} from "rxjs";
import {apolloClientInstance$, zenToRx} from "../graphql";
import {currentProvider$} from "./providerState";
import {selectedSignerAddressUpdate$} from "./tokenState";
import {resolveNftImageLinks} from "../utils/nftUtil";
import {_NFT_IPFS_RESOLVER_FN} from "./util";
import {graphql} from "@reef-chain/util-lib"
import {BigNumber} from "ethers";

const SIGNER_NFTS_GQL=graphql.SIGNER_NFTS_GQL;
/* new graphql
const SIGNER_NFTS_GQL = gql`
  subscription query($accountId: String) {
    tokenHolders(
    orderBy: balance_DESC
    where: {AND: {nftId_isNull: false, token: {id_isNull: false}, signer: {id_eq: $accountId}, balance_gt: "0"}, type_eq: Account},
    limit:100
  ) {
    token {
      id
      type
    }
    balance
    nftId
  }
 }`;
;*/
/*
const SIGNER_NFTS_GQL = gql`
  subscription query($accountId: String) {
    token_holder(
    order_by: { balance: desc }
    where: {
      _and: [{ nft_id: { _is_null: false } }, { signer: { _eq: $accountId } }]
      type: { _eq: "Account" }
    }
  ) {
    token_address
    balance
    nft_id
    info
    contract {
      verified_contract {
        type
        contract_data
      }
    }
  }
 }`;
*/


export interface VerifiedNft {
    token_address: string;
    balance: string;
    nft_id: string;
    info: { symbol: string };
    contract: {
        verified_contract: {
            type: 'ERC1155' | 'ERC721';
            contract_data: ERC1155ContractData | ERC721ContractData;
        }
    }
}

const parseTokenHolderArray = (resArr: VerifiedNft[]): NFT[] => resArr.map(({
        balance,
        nft_id: nftId,
        info: {symbol},
        token_address,
        contract: {
            verified_contract: {
                contract_data,
                type
            }
        },
    }) => {
    return ({
        contractType: type,
        balance: BigNumber.from(balance),
        nftId,
        symbol,
        decimals: 0,
        data: contract_data,
        address: token_address,
        iconUrl: '',
        name: contract_data.type === 'ERC721' ? contract_data.name : '',
    } as NFT)
});

/*async function getSqwidContractNfts(queryResult: any[] | undefined, signer: ReefSigner, provider: Provider) {
    const mainnetGHash = '0x7834781d38e4798d548e34ec947d19deea29df148a7bf32484b7b24dacf8d4b7';
    const network = await provider.api.genesisHash.toHuman();
    const isMainnet = mainnetGHash === network;

    if (queryResult?.length || !isMainnet) {
        return queryResult;
    }

    const sqwid1155Address = '0x0601202b75C96A61CDb9A99D4e2285E43c6e60e4'

    const nftItemsABI = [{
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "getTokensByOwner",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }];
    const sqwid1155Contract = new Contract(sqwid1155Address, nftItemsABI, signer.signer);
    const allTokens: BigNumber[] = await sqwid1155Contract.getTokensByOwner(signer.evmAddress);
    const signerIds = allTokens.reduce((signerTokens:({ amt: string, nftId: string })[],tknAmt:BigNumber,  i:number)=>{
        let amt = tknAmt.toString();
        if(amt !== '0'){
            signerTokens.push({amt, nftId:i.toString()})
        }

        return signerTokens;
    },[]);
    return signerIds.map(nftIdAmt=>({
        token_address: sqwid1155Address,
        balance: nftIdAmt.amt,
        nft_id: nftIdAmt.nftId,
        info: { symbol: '' },
        contract: {
            verified_contract: {
                type: 'ERC1155',
                contract_data: {type:ContractType.ERC1155}
            }
        }
    } as VerifiedNft));
}*/

export const selectedSignerNFTs$: Observable<NFT[]> = combineLatest([
    apolloClientInstance$,
    selectedSignerAddressUpdate$,
    currentProvider$,
])
    .pipe(
        switchMap(([apollo, signer]) => (!signer
            ? []
            : zenToRx(
                apollo.subscribe({
                    query: SIGNER_NFTS_GQL,
                    variables: {
                        accountId: signer.address,
                    },
                    fetchPolicy: 'network-only',
                }),
            )
                .pipe(
                    map(({data}) => {
                        console.log("NFTSSS=",data);
                        return data && data.tokenHolders
                            ? data.tokenHolders as VerifiedNft[]
                            : undefined
                    }),
                    // indexer fallback, loading directly from sqwid contract
                    // switchMap((res: VerifiedNft[] | undefined) => getSqwidContractNfts(res, signer as ReefSigner, provider)),
                    map((res: VerifiedNft[] | undefined) => parseTokenHolderArray(res || [])),
                    switchMap((nfts: NFT[]) => (resolveNftImageLinks(nfts, signer.signer, _NFT_IPFS_RESOLVER_FN) as Observable<NFT[]>)),
                ))),
    );
