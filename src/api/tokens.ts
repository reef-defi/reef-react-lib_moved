import axios, { AxiosResponse } from 'axios';
import { BigNumber } from 'ethers';
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

export const loadSignerTokens = async (reefSigner: ReefSigner, network: Network): Promise<Token[]> => {
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
          iconUrl: resBal.symbol === 'REEF' ? 'https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png' : '',
          isEmpty: false,
        } as Token));
      },
      (err) => {
        console.log('Error loading account tokens =', err);
        return getReefTokenBalance(reefSigner);
      });
  } catch (err) {
    console.log('loadSignerTokens error = ', err);
    return getReefTokenBalance(reefSigner);
  }
};
