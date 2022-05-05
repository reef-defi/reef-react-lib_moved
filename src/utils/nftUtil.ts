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

const toIpfsProviderUrl = (ipfsUriStr: string): string | null => {
  const ipfsHash = extractIpfsHash(ipfsUriStr);
  if (ipfsHash) {
    return `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`;
  }
  return null;
};

const resolveUriToUrl = (uri: string, nft: TokenNFT): string => {
  const ipfsUrl = toIpfsProviderUrl(uri);
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

const resolveImageData = (metadata: NFTMetadata, nft: TokenNFT): NFTMetadata => {
  const imageUriVal: string = metadata?.image ? metadata?.image : metadata.toString();
  return { iconUrl: resolveUriToUrl(imageUriVal, nft), name: metadata.name, mimetype: metadata.mimetype };
};

export const getResolveNftPromise = (nft: TokenNFT|null, signer: Signer): Promise<TokenNFT|null> => {
  if (!nft) {
    return Promise.resolve(null);
  }
  const contractTypeAbi = getContractTypeAbi(nft.contractType);
  const contract = new Contract(nft.address, contractTypeAbi, signer);
  const uriPromise = (contractTypeAbi as any).some((fn) => fn.name === 'uri') ? contract.uri(nft.nftId)
    : contract.tokenURI(nft.nftId);
  return uriPromise
    .then((metadataUri) => resolveUriToUrl(metadataUri, nft))
    .then(axios.get)
    .then((jsonStr) => resolveImageData(jsonStr.data, nft))
    .then((nftUri) => ({ ...nft, ...nftUri }));
};

export const resolveNftImageLinks = (nfts: (TokenNFT|null)[], signer: Signer) :Observable<(TokenNFT|null)[]> => (nfts?.length ? forkJoin(nfts.map((nft) => getResolveNftPromise(nft, signer))) : of([]));
