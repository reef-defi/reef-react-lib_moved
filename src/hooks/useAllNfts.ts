import { NFT } from '../state';
import { useObservableState } from './useObservableState';
import { selectedSignerNFTs$ } from '../appState/nftTokenState';

type UseAllNfts = [NFT[], boolean];
export const useAllNfts = (): UseAllNfts => {
  const nfts = useObservableState(selectedSignerNFTs$);
  const loading = nfts === undefined;

  return [nfts || [], loading];
};
