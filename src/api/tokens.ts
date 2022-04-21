import { ApolloClient, gql } from '@apollo/client';
import axios, { AxiosResponse } from 'axios';
import { BigNumber } from 'ethers';
import {
  ERC20ContractData,
  Network, ReefSigner, reefTokenWithAmount, Token,
} from '../state';
import { REEF_ADDRESS } from '../utils';

interface AccountTokensRes {
  tokens: AccountTokensResBalance[];
}

interface AccountTokensResBalance {
  address: string;
  balance: string;
  // eslint-disable-next-line camelcase
  contract_data: {
    decimals: number;
    symbol: string;
    name: string;
    iconUrl: string;
  };
}
function getReefTokenBalance(reefSigner: ReefSigner): Promise<Token[]> {
  const reefTkn = reefTokenWithAmount();
  reefTkn.balance = reefSigner.balance;
  return Promise.resolve([reefTkn as Token]);
}

export const loadSignerTokens = async (
  reefSigner: ReefSigner,
  network: Network,
): Promise<Token[]> => {
  const reefAddress = reefTokenWithAmount().address;
  try {
    return axios
      .post<void, AxiosResponse<AccountTokensRes>>(
        `${network.reefscanUrl}/api/account/tokens`,
        { address: reefSigner.address },
      )
      .then(
        (res) => {
          if (
            !res
            || !res.data
            || !res.data
            || !res.data.tokens
            || !res.data.tokens.length
          ) {
            return getReefTokenBalance(reefSigner);
          }
          return Promise.resolve(
            res.data.tokens.map(
              (resBal: AccountTokensResBalance) => ({
                address: resBal.address,
                name: resBal.contract_data.name,
                symbol: resBal.contract_data.symbol,
                decimals: resBal.contract_data.decimals,
                balance: BigNumber.from(resBal.balance),
                iconUrl:
                    !resBal.contract_data.iconUrl
                    && resBal.address === reefAddress
                      ? 'https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png'
                      : resBal.contract_data.iconUrl,
                isEmpty: false,
              } as Token),
            ),
          ).then((tokens: Token[]) => {
            const reefIndex = tokens.findIndex(
              (t) => t.address === reefAddress,
            );
            let reefToken: Promise<Token>;
            if (reefIndex > 0) {
              reefToken = Promise.resolve(tokens[reefIndex]);
              tokens.splice(reefIndex, 1);
            } else {
              reefToken = getReefTokenBalance(reefSigner).then(
                (tkns) => tkns[0],
              );
            }
            return reefToken.then((rt) => [rt, ...tokens] as Token[]);
          });
        },
        (err) => {
          console.log('Error loading account tokens =', err);
          return getReefTokenBalance(reefSigner);
        },
      );
  } catch (err) {
    console.log('loadSignerTokens error = ', err);
    return getReefTokenBalance(reefSigner);
  }
};


const verifiedTokenQuery = gql`
query tokens($signer: String!) {
  verified_contract(
    where: {
      type: { _eq: "ERC20" }
    }
  ) {
    address
    contract_data
  }

  token_holder(
    where: {
      signer: { _eq: $signer }
    }
  ) {
    token_address
    balance
  }
}
`


interface VerifiedContract {
  address: string;
  contract_data: ERC20ContractData;
}
interface TokenHolder {
  token_address: string;
  balance: number;
}

interface TokenQuery {
  token_holder: TokenHolder[];
  verified_contract: VerifiedContract[];
};

interface QueryVariable {
  signer: string;
}

const sortTokens = (t1: Token, t2: Token): number => {
  if (t1.address === REEF_ADDRESS) { return -1};
  if (t2.address === REEF_ADDRESS) { return 1; }
  return t1.balance.gte(t2.balance) ? -1 : 1;
}

export const loadVerifiedTokens = async (signer?: string, apolloClient?: ApolloClient<any>): Promise<Token[]> => {
  if (!signer || !apolloClient) { return []; }

  const results = await apolloClient.query<TokenQuery, QueryVariable>({
    query: verifiedTokenQuery,
    variables: { signer }
  });

  const balances = results.data.token_holder.reduce(
    (acc, current) => ({...acc,
      [current.token_address]: current.balance.toLocaleString('fullwide', {useGrouping:false})
    }),
    {} as {[key: string]: string}
    );

  const tokens = results.data.verified_contract
    .map(({address, contract_data: {decimals, name, symbol}}): Token => ({
      address,
      decimals,
      name,
      symbol,
      iconUrl: address === REEF_ADDRESS ? 'https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png' : '',
      balance: BigNumber.from(address in balances ? balances[address] : 0),
    }))
    .sort(sortTokens)

  return tokens;
}
