import { AxiosInstance } from "axios";
const ACTIVE_NETWORK_LS_KEY = "reef-app-active-network";

const graphqlUrls = {
    explorerTestnet:'https://squid.subsquid.io/reef-explorer-testnet/graphql',
    dexTestnet:'https://squid.subsquid.io/reef-swap-testnet/graphql',
    explorerMainnet:'https://squid.subsquid.io/reef-explorer/graphql',
    dexMainnet:'https://squid.subsquid.io/reef-swap/graphql'
  }

  const getGraphqlEndpoint = (network:string,isExplorer:boolean):string=>{
    if(isExplorer){
      if(network=='testnet'){
        return graphqlUrls.explorerTestnet
      }else{
        return graphqlUrls.explorerMainnet
      }
    }else{
      if(network=='testnet'){
        return graphqlUrls.dexTestnet;
      }
    }
    return graphqlUrls.dexMainnet;
  }
  
  export const graphqlRequest = (
    httpClient: AxiosInstance,
    queryObj: { query: string; variables: any },
    isExplorer?:boolean
  ) => {
    let selectedNetwork:string="mainnet";
    try {
      let storedNetwork = localStorage.getItem(ACTIVE_NETWORK_LS_KEY);
      if(storedNetwork){
        let parsedStoredNetwork = JSON.parse(storedNetwork);
        selectedNetwork = parsedStoredNetwork.name;
      }
    } catch (error) {
      console.log(error);
    }
    const graphql = JSON.stringify(queryObj);
    if(isExplorer){
      let url = getGraphqlEndpoint(selectedNetwork!,true);
      return httpClient.post(url, graphql, {
      headers: { 'Content-Type': 'application/json' },
    });
  } 
  let url = getGraphqlEndpoint(selectedNetwork!,false);
  return httpClient.post(url, graphql, {
    headers: { 'Content-Type': 'application/json' },
  });
};