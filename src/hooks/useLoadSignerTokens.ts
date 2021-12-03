import { useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { BigNumber } from 'ethers';
import {
  DataProgress, DataWithProgress, getData, isDataSet,
} from '../utils/dataWithProgress';
import {
  Network, ReefSigner, reefTokenWithAmount, Token,
} from '../state';

interface AccountTokensRes {
    data: {
        // eslint-disable-next-line camelcase
        account_id: string;
        // eslint-disable-next-line camelcase
        evm_address: string;
        status: boolean;
        balances: AccountTokensResBalance[]
    }
}

interface AccountTokensResBalance {
    // eslint-disable-next-line camelcase
    contract_id: string,
    balance: string,
    decimals: number,
    symbol: string
}

function getReefTokenBalance(reefSigner: ReefSigner): Promise<Token[]> {
  const reefTkn = reefTokenWithAmount();
  reefTkn.balance = reefSigner.balance;
  return Promise.resolve([reefTkn as Token]);
}

const loadAccountTokens = async (reefSigner: ReefSigner, network: Network): Promise<Token[]> => {
  try {
    return axios.post<void, AxiosResponse<AccountTokensRes>>(`${network.reefscanUrl}api/account/tokens`, { account: reefSigner.address })
      .then((res) => {
        if (!res || !res.data || !res.data.data || !res.data.data.balances || !res.data.data.balances.length) {
          return getReefTokenBalance(reefSigner);
        }
        return res.data.data.balances.map((resBal:AccountTokensResBalance) => ({
          address: resBal.contract_id,
          name: resBal.symbol,
          amount: resBal.balance,
          decimals: resBal.decimals,
          balance: BigNumber.from(resBal.balance),
          // TODO add icons in response
          iconUrl: resBal.symbol === 'REEF' ? 'https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png' : '',
          isEmpty: false,
        } as Token));
      },
      (err) => {
        console.log('Error loading tokens =', err);
        return getReefTokenBalance(reefSigner);
      });
  } catch (err) {
    console.log('loadAccountTokens error = ', err);
    return getReefTokenBalance(reefSigner);
  }
};

export const useLoadSignerTokens = (refreshToggle: boolean, network: Network, signer?: ReefSigner): DataWithProgress<Token[]> => {
  const [tokens, setTokens] = useState<DataWithProgress<Token[]>>(DataProgress.LOADING);
  useEffect(() => {
    if (!signer) {
      return;
    }
    const fetchTokens = async (): Promise<void> => {
      if (!signer) {
        setTokens(DataProgress.LOADING);
        return;
      }
      const selectedAccountTokens: Token[] | null = await loadAccountTokens(signer, network);
      if (!selectedAccountTokens) {
        setTokens(DataProgress.NO_DATA);
        return;
      }
      setTokens(selectedAccountTokens);
    };
    fetchTokens();
  }, [signer, refreshToggle]);

  useEffect(() => {
    if (isDataSet(tokens) && getData(tokens)?.length) {
      const tkns = tokens as Token[];
      const { address: reefAddr } = reefTokenWithAmount();
      const reefToken = tkns.find((t) => t.address === reefAddr);
      if (reefToken) {
        reefToken.balance = signer?.balance || BigNumber.from(0);
        setTokens([...tkns]);
      }
    }
  }, [signer?.balance]);

  return tokens;
};
