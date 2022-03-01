import { Provider, Signer } from '@reef-defi/evm-provider';
import type {
  InjectedAccount,
  InjectedAccountWithMeta,
  InjectedExtension,
} from '@polkadot/extension-inject/types';
import type {
  InjectedAccount as InjectedAccountReef,
  InjectedAccountWithMeta as InjectedAccountWithMetaReef,
  InjectedExtension as InjectedExtensionReef,
} from '@reef-defi/extension-inject/types';
import type { Signer as InjectedSigner } from '@polkadot/api/types';
import { DeriveBalancesAccountData } from '@polkadot/api-derive/balances/types';
import { BigNumber } from 'ethers';
import { firstValueFrom } from 'rxjs';
import { ensure } from '../utils/utils';
import { ReefSigner } from '../state/types';
import { selectedSigner$ } from '../appState/accountState';

export const getReefCoinBalance = async (
  address: string,
  provider?: Provider,
): Promise<BigNumber> => {
  const selectedSigner = await firstValueFrom(selectedSigner$);
  if (selectedSigner && selectedSigner.address === address) {
    return selectedSigner.balance;
  }
  if (!provider) {
    return BigNumber.from('0');
  }
  const balance = await provider.api.derive.balances
    .all(address)
    .then((res: DeriveBalancesAccountData) => BigNumber.from(res.freeBalance.toString(10)));
  return balance;
};

export const accountToSigner = async (
  account: InjectedAccountWithMeta | InjectedAccountWithMetaReef,
  provider: Provider,
  sign: InjectedSigner,
): Promise<ReefSigner> => {
  const signer = new Signer(provider, account.address, sign);
  const evmAddress = await signer.getAddress();
  const isEvmClaimed = await signer.isClaimed();

  const balance = await getReefCoinBalance(account.address, provider);

  return {
    signer,
    balance,
    evmAddress,
    isEvmClaimed,
    name: account.meta.name || '',
    address: account.address,
    source: account.meta.source,
  };
};

export const accountsToSigners = async (
  accounts: InjectedAccountWithMeta[] | InjectedAccountWithMetaReef[],
  provider: Provider,
  sign: InjectedSigner,
): Promise<ReefSigner[]> => Promise.all(
  accounts.map((account) => accountToSigner(account, provider, sign)),
);

function toAccountWithMeta(
  sourceExtension: InjectedExtension | InjectedExtensionReef,
  accounts: InjectedAccount[] | InjectedAccountReef[],
): InjectedAccountWithMeta[] | InjectedAccountWithMetaReef[] {
  return accounts.map((acc) => ({
    address: acc.address,
    type: acc.type,
    meta: {
      source: sourceExtension.name,
      name: acc.name,
      genesisHash: acc.genesisHash,
    },
  }));
}

export const getExtensionSigners = async (
  extensions: InjectedExtension[] | InjectedExtensionReef[],
  provider: Provider,
): Promise<ReefSigner[]> => {
  const extensionAccountPromises = extensions.map((ext) => ext.accounts
    .get()
    .then((extAccounts) => accountsToSigners(
      toAccountWithMeta(ext, extAccounts),
      provider,
          ext.signer as any,
    )));
  return Promise.all(extensionAccountPromises).then((signersByExt) => signersByExt.reduce((all, curr) => all.concat(curr), []));
};

export const bindSigner = async (signer: Signer): Promise<void> => {
  const hasEvmAddress = await signer.isClaimed();
  ensure(!hasEvmAddress, 'Account already has EVM address!');
  await signer.claimDefaultAccount();
};

export const getSignerIdent = (signer: ReefSigner): string => `${signer.source}_${signer.address}`;
