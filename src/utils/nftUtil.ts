import { forkJoin, Observable, of } from 'rxjs';
import { Contract } from 'ethers';
import axios from 'axios';
import { Signer } from '@reef-defi/evm-provider';
import { getContractTypeAbi } from '../appState/util';
import { NFTMetadata, TokenNFT } from '../state';

const extractIpfsHash = (ipfsUri: string): string|null => {
  const ipfsProtocol = 'ipfs://';
  if (ipfsUri?.startsWith(ipfsProtocol)) {
    return ipfsUri.substring(ipfsProtocol.length);
  }
  return null;
};

const toIpfsProviderUrl = (ipfsUriStr: string, ipfsUrlResolver?: ipfsUrlResolverFn): string | null => {
  const ipfsHash = extractIpfsHash(ipfsUriStr);
  if (ipfsHash) {
    return !ipfsUrlResolver ? `https://cloudflare-ipfs.com/ipfs/${ipfsHash}` : ipfsUrlResolver(ipfsHash);
  }
  return null;
};

const resolveUriToUrl = (uri: string, nft: TokenNFT, ipfsUrlResolver?: ipfsUrlResolverFn): string => {
  const ipfsUrl = toIpfsProviderUrl(uri, ipfsUrlResolver);
  if (ipfsUrl) {
    return ipfsUrl;
  }

  const idPlaceholder = '{id}';
  if (nft.nftId != null && uri.indexOf(idPlaceholder) > -1) {
    let replaceValue = nft.nftId;
    try {
      replaceValue = parseInt(nft.nftId, 10)
        .toString(16)
        .padStart(64, '0');
    } catch (e) { }
    return uri.replace(idPlaceholder, replaceValue);
  }
  return uri;
};

const resolveImageData = (metadata: NFTMetadata, nft: TokenNFT, ipfsUrlResolver?: ipfsUrlResolverFn): NFTMetadata => {
  const imageUriVal: string = metadata?.image ? metadata?.image : metadata.toString();
  return { iconUrl: resolveUriToUrl(imageUriVal, nft, ipfsUrlResolver), name: metadata.name, mimetype: metadata.mimetype };
};

export const getResolveNftPromise = (nft: TokenNFT|null, signer: Signer, ipfsUrlResolver?: ipfsUrlResolverFn): Promise<TokenNFT|null> => {
  if (!nft) {
    return Promise.resolve(null);
  }
  const contractTypeAbi = getContractTypeAbi(nft.contractType);
  const contract = new Contract(nft.address, contractTypeAbi, signer);
  const uriPromise = (contractTypeAbi as any).some((fn) => fn.name === 'uri') ? contract.uri(nft.nftId)
    : contract.tokenURI(nft.nftId);
  return uriPromise
    .then((metadataUri) => resolveUriToUrl(metadataUri, nft, ipfsUrlResolver))
    .then(axios.get)
    .then((jsonStr) => resolveImageData(jsonStr.data, nft, ipfsUrlResolver))
    .then((nftUri) => ({ ...nft, ...nftUri }));
};

export const resolveNftImageLinks = (nfts: (TokenNFT|null)[], signer: Signer, ipfsUrlResolver?: ipfsUrlResolverFn) :Observable<(TokenNFT|null)[]> => (nfts?.length ? forkJoin(nfts.map((nft) => getResolveNftPromise(nft, signer, ipfsUrlResolver))) : of([]));

export type ipfsUrlResolverFn = (ipfsHash)=> string;
