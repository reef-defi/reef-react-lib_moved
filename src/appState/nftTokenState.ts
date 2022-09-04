import {ERC1155ContractData, ERC721ContractData, NFT} from "../state";
import {combineLatest, map, Observable, switchMap} from "rxjs";
import {apolloClientInstance$, zenToRx} from "../graphql";
import {currentProvider$} from "./providerState";
import {resolveNftImageLinks} from "../utils/nftUtil";
import {_NFT_IPFS_RESOLVER_FN} from "./util";
import {selectedSignerAddressUpdate$} from "./tokenState";
import {gql} from "@apollo/client";
import {BigNumber} from "ethers";

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


export interface VerifiedNft {
    token_address: string;
    balance: string;
    nft_id: string;
    info: {symbol: string};
    contract: {
        verified_contract: {
            type: 'ERC1155' | 'ERC721';
            contract_data: ERC1155ContractData | ERC721ContractData;
        }
    }
}

const parseTokenHolderArray = (resArr: VerifiedNft[]): NFT[] => resArr.map(({
         balance, nft_id:nftId, info:{symbol}, token_address, contract: { verified_contract: { contract_data, type } },
     })=> {
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
                    map(({data}) => (data && data.token_holder
                        ? data.token_holder as VerifiedNft[]
                        : undefined)),
                    map((res: VerifiedNft[]|undefined)=>parseTokenHolderArray(res||[])),
                    switchMap((nfts: NFT[]) => (resolveNftImageLinks(nfts, signer.signer, _NFT_IPFS_RESOLVER_FN) as Observable<NFT[]>)),
                ))),
    );
