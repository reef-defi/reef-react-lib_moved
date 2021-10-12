import { useEffect, useState } from 'react';
import { Signer } from '@reef-defi/evm-provider';
import { availableReefNetworks } from '../utils';
import { TokenWithAmount } from '../state';
import { loadAccountTokens } from '../rpc';
// import newHookState from './hookState';

export const useLoadSignerTokens = (signer?: Signer): TokenWithAmount[] => {
  const [tokens, setTokens] = useState<TokenWithAmount[]>([]);
  // const state = newHookState();
  useEffect(() => {
    const fetchTokens = async (): Promise<void> => {
      if (!signer) {
        return;
      }
      // TODO
      // state.setters.setIsLoading(true);
      const selectedAccountTokens: TokenWithAmount[] = await loadAccountTokens(signer, availableReefNetworks.mainnet);
      setTokens(selectedAccountTokens);
    };
    fetchTokens();
  }, [signer]);
  // return [tokens, ...state.getters];
  return tokens;
};
