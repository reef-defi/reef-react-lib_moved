import { UpdateAction, UpdateDataType } from './updateStateModel';
import { ReefSigner } from '../state';

const getUpdAddresses = (
  updateType: UpdateDataType,
  updateActions: UpdateAction[],
): string[] | null => {
  const typeUpdateActions = updateActions.filter(
    (ua) => ua.type === updateType,
  );
  if (typeUpdateActions.length === 0) {
    return null;
  }
  if (typeUpdateActions.some((tua) => !tua.address)) {
    return [];
  }

  return typeUpdateActions.map((ua) => ua.address as string);
};

export const isUpdateAll = (addresses: string[] | null): boolean => addresses?.length === 0;

export const getSignersToUpdate = (
  updateType: UpdateDataType,
  updateActions: UpdateAction[],
  signers: ReefSigner[],
): ReefSigner[] => {
  const updAddresses = getUpdAddresses(updateType, updateActions);
  return isUpdateAll(updAddresses)
    ? signers
    : signers.filter((sig) => updAddresses?.some((addr) => addr === sig.address));
};

export const replaceUpdatedSigners = (
  existingSigners: ReefSigner[] = [],
  updatedSigners?: ReefSigner[],
  appendNew?: boolean,
): ReefSigner[] => {
  if (!appendNew && !existingSigners.length) {
    return existingSigners;
  }
  if (!updatedSigners || !updatedSigners.length) {
    return existingSigners;
  }
  const signers = existingSigners.map(
    (existingSig) => updatedSigners.find((updSig) => updSig.address === existingSig.address)
      || existingSig,
  );
  if (!appendNew) {
    return signers;
  }
  updatedSigners.forEach((updS) => {
    if (!signers.some((s) => s.address === updS.address)) {
      signers.push(updS);
    }
  });
  return signers;
};

export const updateSignersEvmBindings = (
  updateActions: UpdateAction[],
  signers?: ReefSigner[],
): Promise<ReefSigner[]> => {
  if (!signers || !signers.length) {
    return Promise.resolve([]);
  }
  const updSigners = getSignersToUpdate(
    UpdateDataType.ACCOUNT_EVM_BINDING,
    updateActions,
    signers,
  );
  return Promise.all(
    updSigners.map((sig: ReefSigner) => sig.signer.isClaimed()),
  ).then((claimed: boolean[]) => claimed.map((isEvmClaimed: boolean, i: number) => {
    const sig = updSigners[i];
    return { ...sig, isEvmClaimed };
  }));
};
