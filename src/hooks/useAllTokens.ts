import { gql, ApolloClient, useSubscription } from '@apollo/client';
import { useMemo } from 'react';
import { BigNumber } from 'ethers';
import { ERC20ContractData, Token } from '../state';
import { REEF_ADDRESS } from '../utils';

const verifiedTokenQuery = gql`
subscription tokens {
  verified_contract(
    where: {
      type: { _eq: "ERC20" }
    }
  ) {
    address
    contract_data
  }
}
`;

const tokenBalances = gql`
subscription balances($signer: String!) {
  token_holder(
    where: {
      signer: { _eq: $signer }
    }
  ) {
    token_address
    balance
  }
}
`;

interface VerifiedTokens {
  address: string;
  // eslint-disable-next-line
  contract_data: ERC20ContractData;
}
interface TokenHolder {
  // eslint-disable-next-line
  token_address: string;
  balance: number;
}

interface VerifiedTokenQuery {
  // eslint-disable-next-line
  verified_contract: VerifiedTokens[];
}
interface BalanceQuery {
  // eslint-disable-next-line
  token_holder: TokenHolder[];
}

interface SignerVariable {
  signer: string;
}

const sortTokens = (t1: Token, t2: Token): number => {
  if (t1.address === REEF_ADDRESS) { return -1; }
  if (t2.address === REEF_ADDRESS) { return 1; }
  return t1.balance.gte(t2.balance) ? -1 : 1;
};

interface Balances {
  [signer: string]: string;
}

export const useAllTokens = (signer?: string, client?: ApolloClient<any>): Token[] => {
  const { data: tokenData } = useSubscription<VerifiedTokenQuery>(
    verifiedTokenQuery,
    { client },
  );
  const { data: balanceData } = useSubscription<BalanceQuery, SignerVariable>(
    tokenBalances,
    { client, variables: { signer: signer || '' } },
  );

  const balances = useMemo((): Balances => (balanceData
    ? balanceData.token_holder.reduce(
      (acc, current) => ({
        ...acc,
        [current.token_address]: current.balance.toLocaleString('fullwide', { useGrouping: false }),
      }),
      {},
    )
    : {}),
  [balanceData]);

  const tokens = useMemo((): Token[] => (tokenData
    ? tokenData.verified_contract.map(
      ({ address, contract_data: { decimals, name, symbol } }) => ({
        address,
        decimals,
        name,
        symbol,
        iconUrl: address === REEF_ADDRESS ? 'https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png' : '',
        balance: BigNumber.from(address in balances ? balances[address] : 0),
      }),
    )
      .sort(sortTokens)
    : []),
  [balances, tokenData]);

  return tokens;
};
