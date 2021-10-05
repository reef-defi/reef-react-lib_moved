import { Signer } from '@reef-defi/evm-provider';
import { BigNumber } from 'ethers';
import axios from 'axios';
import { calculateAmount } from '../utils/math';
import { getContract } from './rpc';
import { getTokenListPrices } from '../api/prices';
import {
  BasicToken, Network, Token, TokenState, TokenWithAmount,
} from '../state';

export const retrieveTokenAddresses = (tokens: Token[]): string[] => tokens.map((token) => token.address);

export const approveTokenAmount = async (token: TokenWithAmount, routerAddress: string, signer: Signer): Promise<void> => {
  const contract = await getContract(token.address, signer);
  const bnAmount = calculateAmount(token);
  await contract.approve(routerAddress, bnAmount);
};

export const approveAmount = async (from: string, to: string, amount: string, signer: Signer): Promise<void> => {
  const contract = await getContract(from, signer);
  await contract.approve(to, amount);
};

interface AccountTokenBalance {
// eslint-disable-next-line camelcase
  contract_id: string,
  balance: string,
  decimals: number,
  symbol: string
}

interface AccountBalances {
  // eslint-disable-next-line camelcase
  account_id: string;
  // eslint-disable-next-line camelcase
  evm_address: string;
  balances: AccountTokenBalance[]
}

interface AccountBalancesRes {
  data: AccountBalances
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
  const signerAddress = await signer.getAddress();
  const rpc = axios.create({
    baseURL: network.reefscanUrl,
  });
  const getAccountTokens = async (address: string): Promise<TokenWithAmount[]> => rpc
    .post<void, AccountBalancesRes>('/api/account/tokens', { account: address })
    .then((res) => res.data)
    .then(
      async (accountBalances: AccountBalances) => {
        if (!accountBalances || !accountBalances.balances) {
          return [];
        }
        const tokenSymbols = accountBalances.balances.map((tkn: AccountTokenBalance) => tkn.symbol);
        const prices = await getTokenListPrices(tokenSymbols);
        return accountBalances.balances.map((resBal: AccountTokenBalance) => ({
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
