import { NFT } from '../state';
import { useObservableState } from './useObservableState';
import {reefState} from "@reef-chain/util-lib";

type UseAllNfts = [NFT[], boolean];
export const useAllNfts = (): UseAllNfts => {
  const nfts = useObservableState(reefState.selectedNFTs$);
  const loading = nfts === undefined;
  
  return [nfts || [], loading];
};
