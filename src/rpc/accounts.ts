import { Provider, Signer } from '@reef-defi/evm-provider';
import type { InjectedAccount, InjectedExtension } from '@polkadot/extension-inject/types';
import type {
  // InjectedAccount as InjectedAccountReef,
  // InjectedAccountWithMeta as InjectedAccountWithMetaReef,
  InjectedExtension as InjectedExtensionReef,
} from '@reef-defi/extension-inject/types';
import type { Signer as InjectedSigner } from '@polkadot/api/types';
import { DeriveBalancesAccountData } from '@polkadot/api-derive/balances/types';
import { BigNumber } from 'ethers';
// import { firstValueFrom } from 'rxjs';
// import { web3FromSource } from '@reef-defi/extension-dapp';
import { ensure } from '../utils/utils';
import { ReefSigner } from '../state/types';
// import { selectedSigner$ } from '../appState/accountState';

// const accountSourceSigners = new Map<string, InjectedSigner>();
// const getAccountInjectedSigner = async (source: string): Promise<InjectedSigner|void> => {
//   if (!accountSourceSigners.has(source)) {
//     const signer = await web3FromSource(source)
//       .then((injected) => injected?.signer)
//       .catch((err) => console.error('getAccountSigner error =', err));
//     if (signer) {
//       accountSourceSigners.set(source, signer);
//     }
//   }
//   return accountSourceSigners.get(source);
// };

// export const getAccountSigner = async (address: string, source: string, provider: Provider, injSigner?: InjectedSigner): Promise<Signer|undefined> => {
//   const iSigner = injSigner || await getAccountInjectedSigner(source);
//   return iSigner ? new Signer(provider, address, iSigner) : undefined;
// };

export const getReefCoinBalance = async (
  address: string,
  provider: Provider,
): Promise<BigNumber> => {
  // const selectedSigner = await firstValueFrom(selectedSigner$);
  // if (selectedSigner && selectedSigner.address === address) {
  //   return selectedSigner.balance;
  // }
  // if (!provider) {
  //   return BigNumber.from('0');
  // }
  const balance = await provider.api.derive.balances
    .all(address)
    .then((res: DeriveBalancesAccountData) => BigNumber.from(res.freeBalance.toString(10)));
  return balance;
};

// export const accountToSigner = async (
//   account: InjectedAccountWithMeta | InjectedAccountWithMetaReef,
//   provider: Provider,
//   injSigner?: InjectedSigner,
// ): Promise<ReefSigner|undefined> => {
//   const { source } = account.meta;
//   const signer = await getAccountSigner(account.address, source, provider, injSigner);
//   if (!signer) {
//     return undefined;
//   }
//   const evmAddress = await signer.getAddress();
//   const isEvmClaimed = await signer.isClaimed();

//   const balance = await getReefCoinBalance(account.address, provider);

//   return {
//     signer,
//     balance,
//     evmAddress,
//     isEvmClaimed,
//     name: account.meta.name || '',
//     address: account.address,
//     source,
//     genesisHash: account.meta.genesisHash!,
//   };
// };

// export const accountsToSigners = async (
//   accounts: InjectedAccountWithMeta[] | InjectedAccountWithMetaReef[],
//   provider: Provider,
//   sign: InjectedSigner,
// ): Promise<ReefSigner[]> => Promise.all(
//   accounts.filter((acc) => !provider || !provider.api.genesisHash.toString() || !acc.meta.genesisHash || acc.meta.genesisHash === provider.api.genesisHash.toString())
//     .map((account) => accountToSigner(account, provider, sign)),
// ).then((signers) => signers.filter((sig) => !!sig) as ReefSigner[]);

// function toAccountWithMeta(
//   sourceExtension: InjectedExtension | InjectedExtensionReef,
//   accounts: InjectedAccount[] | InjectedAccountReef[],
// ): InjectedAccountWithMeta[] | InjectedAccountWithMetaReef[] {
//   return accounts.map((acc) => ({
//     address: acc.address,
//     type: acc.type,
//     meta: {
//       source: sourceExtension.name,
//       name: acc.name,
//       genesisHash: acc.genesisHash,
//     },
//   }));
// }

export const accountToSig = async (account: InjectedAccount, provider: Provider, sign: InjectedSigner, source: string): Promise<ReefSigner> => {
  const signer = new Signer(provider, account.address, sign);
  const evmAddress = await signer.getAddress();
  const isEvmClaimed = await signer.isClaimed();

  const balance = await getReefCoinBalance(account.address, provider);
  return {
    signer,
    source,
    balance,
    evmAddress,
    isEvmClaimed,
    address: account.address,
    name: account.name || '',
    genesisHash: account.genesisHash!,
  };
};

export const getExtensionSigners = async (
  extensions: InjectedExtension[] | InjectedExtensionReef[],
  provider: Provider,
): Promise<ReefSigner[]> => {
  // const extensionAccountPromises = extensions.map((ext) => ext.accounts
  //   .get()
  //   .then((extAccounts) => accountsToSigners(
  //     toAccountWithMeta(ext, extAccounts),
  //     provider,
  //     ext.signer as any,
  //   )));
  // console.log(await Promise.all(extensionAccountPromises))
  // return await Promise.all(extensionAccountPromises).then((signersByExt) => signersByExt.reduce((all, curr) => all.concat(curr), []));
  const extensionAccounts = await Promise.all(extensions.map(async (extension) => ({ name: extension.name, sig: extension.signer, accounts: await extension.accounts.get() })));
  const accountPromisses = extensionAccounts.flatMap(({ accounts, name, sig }) => accounts.map((account) => accountToSig(account, provider, sig, name)));
  const accounts = await Promise.all(accountPromisses);
  // const promises = extensions.flatMap((extension) => extension.accounts
  //   .get()
  //   .then((injectedAccounits) => injectedAccounits
  //     .map((account) => accountToSig(account, provider, extension.signer, extension))
  //   )
  // )
  // const r = await Promise.all(

  // );
  return accounts;
};

export const bindSigner = async (signer: Signer): Promise<void> => {
  const hasEvmAddress = await signer.isClaimed();
  ensure(!hasEvmAddress, 'Account already has EVM address!');
  await signer.claimDefaultAccount();
};

export const getSignerIdent = (signer: ReefSigner): string => `${signer.source}_${signer.address}`;
