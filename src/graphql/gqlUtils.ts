import { AxiosInstance } from 'axios';

export const graphqlRequest = (
  httpClient: AxiosInstance,
  queryObj: { query: string; variables: any },
) => {
  const graphql = JSON.stringify(queryObj);

  return httpClient.post('https://squid.subsquid.io/reef-swap-testnet/graphql', graphql, {
    headers: { 'Content-Type': 'application/json' },
  });
};