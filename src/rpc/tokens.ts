import { Signer } from '@reef-defi/evm-provider';
import { BigNumber } from 'ethers';
import axios, { AxiosResponse } from 'axios';
import { getContract } from './rpc';
import {
  BasicToken, Network, Token, TokenState, TokenWithAmount,
} from '../state/types';
import { getTokenListPrices } from '../api/prices';

interface AccountTokensRes {
  data: {
    // eslint-disable-next-line camelcase
    account_id: string;
    // eslint-disable-next-line camelcase
    evm_address: string;
    // eslint-disable-next-line camelcase
    balances: { contract_id: string, balance: string, decimals: number, symbol: string }[]
  }
}

export const createEmptyToken = (): Token => ({
  name: 'Select token',
  address: '',
  balance: BigNumber.from('0'),
  decimals: -1,
  iconUrl: '',
});

export const createEmptyTokenWithAmount = (): TokenWithAmount => ({
  ...createEmptyToken(),
  price: -1,
  amount: '',
  isEmpty: true,
});

export const toTokenAmount = (token: Token, state: TokenState): TokenWithAmount => ({
  ...token,
  ...state,
  isEmpty: false,
});

// TODO fetch from reefscan
export const loadVerifiedERC20Tokens = async (): Promise<BasicToken[]> => [];

export const retrieveTokenAddresses = (tokens: Token[]): string[] => tokens.map((token) => token.address);

export const loadToken = async (address: string, signer: Signer, iconUrl: string): Promise<Token> => {
  const token = await getContract(address, signer);

  const signerAddress = await signer.getAddress();
  const balance = await token.balanceOf(signerAddress);
  const symbol = await token.symbol();
  const decimals = await token.decimals();

  return {
    iconUrl,
    decimals,
    address: token.address,
    balance: balance.toString(),
    name: symbol,
  };
};

export const loadAccountTokens = async (signer: Signer, network: Network): Promise<TokenWithAmount[]> => {
  const signerAddress = await signer.getAddress(); // '0x4a944a2b85afe9851bea6c33941f8adb85469d41';
  const rpc = axios.create({
    baseURL: network.reefscanUrl,
  });
  const getAccountTokens = async (address: string): Promise<TokenWithAmount[]> => rpc
    .post<void, AxiosResponse<AccountTokensRes>>('/api/account/tokens', { account: address })
    .then(
      async ({ data }) => {
        if (!data || !data.data || !data.data.balances) {
          return [];
        }
        const tokenSymbols = data.data.balances.map((tkn) => tkn.symbol);
        const prices = await getTokenListPrices(tokenSymbols);
        return data.data.balances.map((resBal) => ({
          address: resBal.contract_id,
          name: resBal.symbol,
          amount: resBal.balance,
          decimals: resBal.decimals,
          balance: BigNumber.from(resBal.balance),
          price: prices[resBal.symbol],
          iconUrl: '',
          isEmpty: false,
        } as TokenWithAmount));
      },
      () => [],
    );
  return getAccountTokens(signerAddress);
};

export const loadTokens = async (addresses: BasicToken[], signer: Signer): Promise<Token[]> => Promise.all(
  addresses.map((token) => loadToken(token.address, signer, token.iconUrl)),
);
