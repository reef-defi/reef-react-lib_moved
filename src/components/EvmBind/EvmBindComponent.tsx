import { Provider } from '@reef-defi/evm-provider';
import { BigNumber, ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ReefSigner } from '../../state';
import {
  bindEvmAddress, showEvmCopyAddressAlert, REEF_ADDRESS_SPECIFIC_STRING,
  sendToNativeAddress,
  toAddressShortDisplay,
  toReefBalanceDisplay,
  TxStatusHandler,
  TxStatusUpdate,
} from '../../utils';
import { useObservableState } from '../../hooks';
import { currentProvider$ } from '../../appState/providerState';
import { ComponentCenter } from '../common/Display';
import {
  Card, CardHeader, CardHeaderBlank, CardTitle, SubCard,
} from '../common/Card';
import { MiniText } from '../common/Text';
import { OpenModalButton } from '../common/Modal';
import { AccountListModal } from '../AccountSelector/AccountListModal';
import { CopyIcon } from '../common/Icons';

export enum EvmBindComponentTxType {
  TRANSFER = 'TRANSFER',
  BIND = 'BIND',
}

interface EvmBindComponent {
  bindSigner: ReefSigner;
  signers: ReefSigner[];
  onTxUpdate?: TxStatusHandler;
  onComplete?: ()=>void;
}

// need to call onTxUpdate even if component is destroyed
const getUpdateTxCallback = (fns: TxStatusHandler[]): TxStatusHandler => (val) => {
  fns.forEach((fn) => (fn ? fn(val) : null));
};

const MIN_BALANCE = ethers.utils.parseEther('4');

function getSignersWithEnoughBalance(signers: ReefSigner[], bindFor: ReefSigner): ReefSigner[] {
  return signers?.length ? signers.filter((sig) => sig.address !== bindFor.address && sig.balance.gt(MIN_BALANCE.mul(BigNumber.from('2')))) : [];
}

export const EvmBindComponent = ({ bindSigner, onTxUpdate, signers, onComplete }: EvmBindComponent): JSX.Element => {
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
    });

    if (txIdent) {
      onTxUpdate({ txIdent, componentTxType: EvmBindComponentTxType.BIND, addresses: [bindFor.address] });
    }
  };

  const transfer = async (from: ReefSigner, to: ReefSigner, amount: BigNumber, onTxUpd: TxStatusHandler): Promise<void> => {
    if (!provider) {
      return;
    }

    const txIdent = sendToNativeAddress(provider, from, amount, to.address, (val: TxStatusUpdate) => {
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
            <CardTitle title="Create Reef Ethereum VM Address" />
            <CardHeaderBlank />
          </CardHeader>
          <SubCard>
            {!bindFor.isEvmClaimed
            && (<p>
                Start using Reef EVM smart contracts.<br/>
                First connect EVM address for <b>{bindFor.name}</b>
                  <MiniText>
                    &nbsp;
                    (
                    {toAddressShortDisplay(bindFor.address)}
                    )
                  </MiniText>
                &nbsp; account.
              </p>
            )}
            {bindFor.isEvmClaimed
            && (
            <div>
              <p>
                Account&nbsp;
                <b>{bindFor.name}</b>
                <MiniText>
                  &nbsp;
                  (
                  {toAddressShortDisplay(bindFor.address)}
                  )
                </MiniText>
                {' '}
                was successfully connected to Ethereum VM address&nbsp;
                <MiniText>
                  (
                  {toAddressShortDisplay(bindFor.evmAddress)}
                  )
                </MiniText>
                .
                <br />
              </p>
              <CopyToClipboard
                text={`${bindFor.evmAddress}${REEF_ADDRESS_SPECIFIC_STRING}`}
                onCopy={showEvmCopyAddressAlert}
              >
                <span
                  className="text-muted "
                  style={{ cursor: 'pointer' }}
                >
                  <CopyIcon small />
                  <span style={{ marginLeft: '4px' }}>
                    <MiniText>Copy Reef EVM Address</MiniText>
                  </span>
                </span>
              </CopyToClipboard>
              { !!onComplete &&
              <div>
                <button
                  type="button"
                  className="btn btn-reef btn-lg border-rad"
                  onClick={onComplete}
                >
                  <span>Continue</span>
                </button>
              </div>
              }
            </div>
            )}
            {!bindFor.isEvmClaimed
            && (
            <div>
              {txStatus && (
              <div>
                {!txStatus.error && !txStatus.isInBlock && !txStatus.isComplete
                && (
                <p>
                  {txStatus.componentTxType === EvmBindComponentTxType.BIND ? 'Connecting EVM address' : 'Transfer'}
                  {' '}
                  in progress
                </p>
                )}
                {!txStatus.error && txStatus.isInBlock && txStatus.componentTxType === EvmBindComponentTxType.TRANSFER && (
                <div>
                  <p>Transfer complete. Now run connect EVM account transaction.</p>
                  <button type="button" onClick={() => bindAccount(getUpdateTxCallback([onTxUpdate as TxStatusHandler, setTxStatus]))}>
                    Continue
                    and connect
                  </button>
                </div>
                )}
                {!txStatus.error && txStatus.isInBlock && txStatus.componentTxType === EvmBindComponentTxType.BIND && (
                <div>
                  <p>
                    Connected Ethereum VM address is
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
                && <p>Not enough REEF in account for connect EVM address transaction fee.</p>}
                {!txStatus && !!transferBalanceFrom && (
                <div>
                  <p>
                    <b>~{toReefBalanceDisplay(MIN_BALANCE)}</b>
                    &nbsp; is needed for transaction fee.
                    <br />
                    <br />

                    They will be transfered from account:&nbsp;
                    <b>{transferBalanceFrom.name}</b>
                    <OpenModalButton
                      className="btn-empty link-text text-xs text-primary pl-1"
                      id="selectMyAddress"
                    >
                      (change)
                    </OpenModalButton>
                  </p>

                  <AccountListModal
                    accounts={availableTxAccounts}
                    id="selectMyAddress"
                    selectAccount={onAccountSelect}
                    title="Select account"
                  />
                  <button
                    type="button"
                    className="btn btn-reef btn-lg border-rad"
                    onClick={() => transfer(transferBalanceFrom!, bindSigner, MIN_BALANCE, getUpdateTxCallback([onTxUpdate as TxStatusHandler, setTxStatus]))}
                  >
                    <span>Continue</span>
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
                  <span>Continue</span>
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
