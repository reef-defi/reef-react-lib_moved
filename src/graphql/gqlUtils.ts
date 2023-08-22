import { AxiosInstance } from 'axios';

export const graphqlRequest = (
  httpClient: AxiosInstance,
  queryObj: { query: string; variables: any },
  isExplorer?:boolean
) => {
  const graphql = JSON.stringify(queryObj);
  if(isExplorer)return httpClient.post('https://squid.subsquid.io/reef-explorer-testnet/graphql', graphql, {
    headers: { 'Content-Type': 'application/json' },
  });
  return httpClient.post('https://squid.subsquid.io/reef-swap-testnet/graphql', graphql, {
    headers: { 'Content-Type': 'application/json' },
  });
};
