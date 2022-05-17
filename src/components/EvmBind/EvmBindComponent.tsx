import { Provider } from '@reef-defi/evm-provider';
import { BigNumber, ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { ReefSigner } from '../../state';
import {
  bindEvmAddress, sendToNativeAddress, toAddressShortDisplay, toReefBalanceDisplay, TxStatusHandler, TxStatusUpdate,
} from '../../utils';
import { useObservableState } from '../../hooks';
import { currentProvider$ } from '../../appState/providerState';
import { ComponentCenter, FlexRow } from '../common/Display';
import {
  Card, CardHeader, CardHeaderBlank, CardTitle, SubCard,
} from '../common/Card';
import { MiniText } from '../common/Text';
import { OpenModalButton } from '../common/Modal';
import { AccountListModal } from '../AccountSelector/AccountListModal';

export enum EvmBindComponentTxType {
  TRANSFER = 'TRANSFER',
  BIND = 'BIND',
}

interface EvmBindComponent {
  bindSigner: ReefSigner;
  signers: ReefSigner[];
  onTxUpdate?: TxStatusHandler;
}

// need to call onTxUpdate even if component is destroyed
const getUpdateTxCallback = (fns: TxStatusHandler[]): TxStatusHandler => (val) => {
  fns.forEach((fn) => (fn ? fn(val) : null));
};

const MIN_BALANCE = ethers.utils.parseEther('5');

function getSignersWithEnoughBalance(signers: ReefSigner[], bindFor: ReefSigner): ReefSigner[] {
  return signers?.length ? signers.filter((sig) => sig.address !== bindFor.address && sig.balance.gt(MIN_BALANCE.mul(BigNumber.from('2')))) : [];
}

export const EvmBindComponent = ({ bindSigner, onTxUpdate, signers }: EvmBindComponent): JSX.Element => {
  const provider: Provider|undefined = useObservableState(currentProvider$);
  const [bindFor, setBindFor] = useState(bindSigner);
  const [availableTxAccounts, setAvailableTxAccounts] = useState<ReefSigner[]>([]);
  const [transferBalanceFrom, setTransferBalanceFrom] = useState<ReefSigner>();
  const [txStatus, setTxStatus] = useState<TxStatusUpdate | undefined>();

  useEffect(() => {
    setBindFor(bindSigner);
  }, [bindSigner]);

  useEffect(() => {
    setTransferBalanceFrom(availableTxAccounts[0]);
  }, [availableTxAccounts]);

  useEffect(() => {
    const fromSigners = getSignersWithEnoughBalance(signers, bindFor);

    setAvailableTxAccounts(fromSigners);
  }, [signers, bindFor]);

  const hasBalanceForBinding = (balance: BigNumber): boolean => balance.gte(MIN_BALANCE);

  const bindAccount = (onTxUpdate: TxStatusHandler):void => {
    const txIdent = bindEvmAddress(bindFor, provider as Provider, (val: TxStatusUpdate) => {
      if (val.error || val.isInBlock) {
        onTxUpdate({ ...val, componentTxType: EvmBindComponentTxType.BIND, addresses: [bindFor.address] });
      }
    }, true);

    if (txIdent) {
      onTxUpdate({ txIdent, componentTxType: EvmBindComponentTxType.BIND, addresses: [bindFor.address] });
    }
  };

  const transfer = async (from: ReefSigner, to: ReefSigner, amount: BigNumber, onTxUpd: TxStatusHandler): Promise<void> => {
    if (!provider) {
      return;
    }

    const txIdent = await sendToNativeAddress(provider, from, amount, to.address, (val: TxStatusUpdate) => {
      if (val.error || val.isInBlock) {
        onTxUpd({ ...val, componentTxType: EvmBindComponentTxType.TRANSFER, addresses: [from.address, to.address] });
      }

      if (val.isInBlock) {
        bindAccount(getUpdateTxCallback([onTxUpdate as TxStatusHandler, setTxStatus]));
      }
    });

    onTxUpd({ txIdent, componentTxType: EvmBindComponentTxType.TRANSFER, addresses: [from.address, to.address] });
  };

  const onAccountSelect = (_: any, selected: ReefSigner): void => setTransferBalanceFrom(selected);

  return (
    <div className="mx-auto bind-evm">
      <ComponentCenter>
        <Card>
          <CardHeader>
            <CardHeaderBlank />
            <CardTitle title="Register Ethereum VM Address" />
            <CardHeaderBlank />
          </CardHeader>
          <SubCard>
            <p>
              Creating Ethereum VM address for&nbsp;
              {bindFor.name}
              <MiniText>
                (
                {toAddressShortDisplay(bindFor.address)}
                )
              </MiniText>
            </p>
            {bindFor.isEvmClaimed
            && (
            <FlexRow>
              <p>
                Account
                {bindFor.name}
                <MiniText>
                  (
                  {toAddressShortDisplay(bindFor.address)}
                  )
                </MiniText>
                {' '}
                already
                has Ethereum VM address
                <br />
                {bindFor.evmAddress}
                <br />
                Use this address ONLY on Reef chain.
              </p>
            </FlexRow>
            )}
            {!bindFor.isEvmClaimed
            && (
            <div>
              {txStatus && (
              <div>
                {!txStatus.error && !txStatus.isInBlock && !txStatus.isComplete
                && (
                <p>
                  {txStatus.componentTxType === EvmBindComponentTxType.BIND ? 'Binding' : 'Transfer'}
                  {' '}
                  in progress
                </p>
                )}
                {!txStatus.error && txStatus.isInBlock && txStatus.componentTxType === EvmBindComponentTxType.TRANSFER && (
                <div>
                  <p>Transfer complete. Now execute bind transaction.</p>
                  <button type="button" onClick={() => bindAccount(getUpdateTxCallback([onTxUpdate as TxStatusHandler, setTxStatus]))}>
                    Continue
                    and bind
                  </button>
                </div>
                )}
                {!txStatus.error && txStatus.isInBlock && txStatus.componentTxType === EvmBindComponentTxType.BIND && (
                <div>
                  <p>
                    Binding complete Ethereum VM address is
                    {bindFor.evmAddress}
                  </p>
                </div>
                )}
                {txStatus.error && <p>{txStatus.error.message}</p>}
              </div>
              )}

              {!txStatus && !hasBalanceForBinding(bindFor.balance)
              && (
              <div>
                {!txStatus && !transferBalanceFrom
                && <p>Please add some Reef to this address for Ethereum VM binding transaction fee.</p>}
                {!txStatus && !!transferBalanceFrom && (
                <div>
                  <p>
                    First send
                    {toReefBalanceDisplay(MIN_BALANCE)}
                    {' '}
                    for
                    transaction
                    <br />
                    {' '}
                    from
                    {transferBalanceFrom.name}
                    <OpenModalButton
                      className="btn-empty link-text text-xs text-primary pl-1rem"
                      id="selectMyAddress"
                    >
                      (change)
                    </OpenModalButton>
                    <AccountListModal
                      accounts={availableTxAccounts}
                      id="selectMyAddress"
                      selectAccount={onAccountSelect}
                      title={(
                        <div>
                          Select account
                        </div>
                    )}
                    />
                  </p>
                  <button
                    type="button"
                    className="btn btn-reef btn-lg border-rad"
                    onClick={() => transfer(transferBalanceFrom, bindSigner, MIN_BALANCE, getUpdateTxCallback([onTxUpdate as TxStatusHandler, setTxStatus]))}
                  >
                    Continue
                  </button>
                </div>
                )}
              </div>
              )}

              {(!txStatus) && hasBalanceForBinding(bindFor.balance)
              && (
              <div>
                <button
                  type="button"
                  className="btn btn-reef btn-lg border-rad"
                  onClick={() => bindAccount(getUpdateTxCallback([onTxUpdate as TxStatusHandler, setTxStatus]))}
                >
                  Continue
                </button>
              </div>
              )}

            </div>
            )}

          </SubCard>
        </Card>
      </ComponentCenter>
    </div>
  );
};
