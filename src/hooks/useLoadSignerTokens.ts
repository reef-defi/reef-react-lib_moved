import { useEffect, useState } from 'react';
import { Signer } from '@reef-defi/evm-provider';
import { availableReefNetworks } from '../utils';
import { Token } from '../state';
import { loadAccountTokens } from '../rpc';

export const useLoadSignerTokens = (signer?: Signer): Token[] => {
  const [tokens, setTokens] = useState<Token[]>([]);
  useEffect(() => {
    const fetchTokens = async (): Promise<void> => {
      if (!signer) {
        return;
      }
      const address = await signer.getAddress();
      const selectedAccountTokens: Token[] = await loadAccountTokens(address, availableReefNetworks.mainnet);
      setTokens(selectedAccountTokens);
    };
    fetchTokens();
  }, [signer]);
  return tokens;
};
