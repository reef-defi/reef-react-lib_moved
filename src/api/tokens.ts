import axios, { AxiosResponse } from 'axios';
import { BigNumber } from 'ethers';
import {
  Network, ReefSigner, reefTokenWithAmount, Token,
} from '../state';

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
