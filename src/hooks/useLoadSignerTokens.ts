import { useEffect, useState } from 'react';
import { Signer } from '@reef-defi/evm-provider';
import { availableReefNetworks } from '../utils';
import { TokenWithAmount } from '../state';
import { loadAccountTokens } from '../rpc';

export default function useLoadSignerTokens(signer?: Signer): TokenWithAmount[] {
  const [tokens, setTokens] = useState<TokenWithAmount[]>([]);

  useEffect(() => {
    const fetchTokens = async (): Promise<void> => {
      if (!signer) {
        return;
      }
      const selectedAccountTokens: TokenWithAmount[] = await loadAccountTokens(signer, availableReefNetworks.mainnet);
      setTokens(selectedAccountTokens);
    };
    fetchTokens();
  }, [signer]);
  return tokens;
}
