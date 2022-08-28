import { gql, useSubscription } from '@apollo/client';
import { useMemo } from 'react';
import { ERC1155ContractData, ERC721ContractData, NFT } from '../state';
import { getIconUrl } from '../utils';

interface VerifiedNft {
  token_address: string;
  balance: string;
  nft_id: number;
  contract: {
    verified_contract: {
      type: 'ERC1155' | 'ERC721';
      contract_data: ERC1155ContractData | ERC721ContractData;
    }
  }
}
interface NftQuery {
  // eslint-disable-next-line
  token_holder: VerifiedNft[];
}

const userBalances = gql`
subscription nfts($signer: String_comparison_exp!) {
  token_holder(
    where: {
      nft_id: { _is_null: false }
      type: { _eq: "Account" }
      signer: $signer
    }
  ) {
    token_address
    balance
    nft_id
    contract {
      verified_contract {
        type
        contract_data
      }
    }
  }
}
`;

type UseAllNfts = [NFT[], boolean];
export const useAllNfts = (signer?: string): UseAllNfts => {
  const { data, loading } = useSubscription<NftQuery>(
    userBalances,
    { variables: { signer: signer ? { _eq: signer } : {} } },
  );

  const nfts: NFT[] = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.token_holder.map(
      ({
        balance, nft_id, token_address, contract: { verified_contract: { contract_data, type } },
      }) => ({
        type,
        balance,
        nftId: nft_id,
        data: contract_data,
        address: token_address,
        iconUrl: getIconUrl(token_address),
        name: contract_data.type === 'ERC721' ? contract_data.name : '',
      }),
    );
  }, [data]);

  return [nfts, loading];
};
