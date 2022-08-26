import axios, { AxiosResponse } from 'axios';

const REEF_TOKEN_ID = 'reef';

interface PriceRes {
  [currenty: string]: {
    usd: number;
  };
}

interface TokenPrices {
  [currenty: string]: number;
}

const coingeckoApi = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3/',
});

const explorerApi = axios.create({
  baseURL: 'https://api.reef.io/v1/',
});

export const getTokenPrice = async (tokenId: string): Promise<number> => {
  if (tokenId === REEF_TOKEN_ID) {
    return explorerApi.get<void, AxiosResponse<any>>(
      '/price',
    ).then((res) => res.data.usd);
  }
  return coingeckoApi
    .get<void, AxiosResponse<PriceRes>>(
      `/simple/price?ids=${tokenId}&vs_currencies=usd`,
    )
    .then((res) => res.data[tokenId].usd);
};

export const getTokenListPrices = async (
  tokenIds: string[],
): Promise<TokenPrices> => coingeckoApi
  .get<void, AxiosResponse<PriceRes>>(
    `/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`,
  )
  .then((res) => tokenIds.reduce((tknPrices: TokenPrices, currTknId) => {
    if (res.data[currTknId]) {
      // eslint-disable-next-line no-param-reassign
      tknPrices[currTknId] = res.data[currTknId].usd;
    }
    return tknPrices;
  }, {}));

export const getTokenEthAddressListPrices = async (
  tokenAddressList: string[],
): Promise<TokenPrices> => coingeckoApi
  .get<void, AxiosResponse<PriceRes>>(
    `/simple/price?contract_addresses=${tokenAddressList.join(
      ',',
    )}&vs_currencies=usd`,
  )
  .then((res) => tokenAddressList.reduce((tknPrices: TokenPrices, currTknId) => {
    if (res.data[currTknId]) {
      // eslint-disable-next-line no-param-reassign
      tknPrices[currTknId] = res.data[currTknId].usd;
    }
    return tknPrices;
  }, {}));

export const retrieveReefCoingeckoPrice = async (): Promise<number> => getTokenPrice(REEF_TOKEN_ID);
