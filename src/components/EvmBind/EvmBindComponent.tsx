import Identicon from '@polkadot/react-identicon';
import { Provider } from '@reef-defi/evm-provider';
import { BigNumber, ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import Uik from '@reef-chain/ui-kit';
import { ReefSigner } from '../../state';
import {
  toReefEVMAddressWithNotification,
  bindEvmAddress,
  sendToNativeAddress,
  toAddressShortDisplay,
  toReefBalanceDisplay,
  TxStatusHandler,
  TxStatusUpdate,
  signBindEvmAddress,
  bindCustomEvmAddress,
} from '../../utils';
import { useObservableState } from '../../hooks';
import { currentProvider$ } from '../../appState/providerState';
import { OpenModalButton } from '../common/Modal';
import { AccountListModal } from '../AccountSelector/AccountListModal';
import './bind.css';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import ReactTooltip from 'react-tooltip';

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

interface CustomBindState {
  useCustomEvmAddress: boolean;
  signingInProcess?: boolean;
  evmAddress?: string;
  signature?: string;
  error?: string;
}

// need to call onTxUpdate even if component is destroyed
const getUpdateTxCallback = (fns: TxStatusHandler[]): TxStatusHandler => (val) => {
  fns.forEach((fn) => (fn ? fn(val) : null));
};

const MIN_BALANCE = ethers.utils.parseEther('5');

function getSignersWithEnoughBalance(signers: ReefSigner[], bindFor: ReefSigner): ReefSigner[] {
  return signers?.length ? signers.filter((sig) => sig.address !== bindFor.address && sig.balance.gt(MIN_BALANCE.mul(BigNumber.from('2')))) : [];
}

const Account = ({ account }: { account: ReefSigner }): JSX.Element => (
  <div className="bind-evm-account">
    <div className="bind-evm-account__identicon">
      <Identicon value={account.address} size={44} theme="substrate" />
    </div>

    <div className="bind-evm-account__info">
      <div className="bind-evm-account__name">{ account.name }</div>
      <div className="bind-evm-account__address">{ toAddressShortDisplay(account.address) }</div>
    </div>
  </div>
);

export const EvmBindComponent = ({
  bindSigner, onTxUpdate, signers, onComplete,
}: EvmBindComponent): JSX.Element => {
  const provider: Provider|undefined = useObservableState(currentProvider$);
  const [bindFor, setBindFor] = useState(bindSigner);
  const [availableTxAccounts, setAvailableTxAccounts] = useState<ReefSigner[]>([]);
  const [transferBalanceFrom, setTransferBalanceFrom] = useState<ReefSigner>();
  const [txStatus, setTxStatus] = useState<TxStatusUpdate | undefined>();
  const [customBindState, setCustomBindState] = useState<CustomBindState>({useCustomEvmAddress: false});

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

  const signEvmMessage = (): void => {
    setCustomBindState({ useCustomEvmAddress: true, signingInProcess: true });
    signBindEvmAddress(bindFor).then((res) => {
      res.error ? setCustomBindState({ useCustomEvmAddress: true, signingInProcess: false, error: res.error }) 
        : setCustomBindState({ useCustomEvmAddress: true, signingInProcess: false, evmAddress: res.evmAddress, signature: res.signature });
    }).catch((e) => {
      console.error(e);
      setCustomBindState({ useCustomEvmAddress: true, signingInProcess: false, error: 'Failed to sign message.' }) 
    });
  };

  const bindAccount = (onTxUpdate: TxStatusHandler):void => {
    setCustomBindState({ ...customBindState, error: undefined });
    if (customBindState.useCustomEvmAddress) {
      const txIdent = bindCustomEvmAddress(bindFor, provider as Provider, customBindState.evmAddress!, customBindState.signature!, (val: TxStatusUpdate) => {
        if (val.error || val.isInBlock) {
          onTxUpdate({ ...val, componentTxType: EvmBindComponentTxType.BIND, addresses: [bindFor.address] });
        }
      });

      if (txIdent) {
        onTxUpdate({ txIdent, componentTxType: EvmBindComponentTxType.BIND, addresses: [bindFor.address] });
      }
    } else {
      const txIdent = bindEvmAddress(bindFor, provider as Provider, (val: TxStatusUpdate) => {
        if (val.error || val.isInBlock) {
          onTxUpdate({ ...val, componentTxType: EvmBindComponentTxType.BIND, addresses: [bindFor.address] });
        }
      });

      if (txIdent) {
        onTxUpdate({ txIdent, componentTxType: EvmBindComponentTxType.BIND, addresses: [bindFor.address] });
      }
    }
  };

  const transfer = async (from: ReefSigner, to: ReefSigner, amount: BigNumber, onTxUpd: TxStatusHandler): Promise<void> => {
    if (!provider) {
      return;
    }
    setCustomBindState({ ...customBindState, error: undefined });
    const txIdent = sendToNativeAddress(provider, from, amount, to.address, (val: TxStatusUpdate) => {
      if (val.error || val.isInBlock) {
        onTxUpd({ ...val, componentTxType: EvmBindComponentTxType.TRANSFER, addresses: [from.address, to.address] });
      }
    });

    onTxUpd({ txIdent, componentTxType: EvmBindComponentTxType.TRANSFER, addresses: [from.address, to.address] });
  };

  const onAccountSelect = (_: any, selected: ReefSigner): void => setTransferBalanceFrom(selected);

  const copyAddress = (address: string): void => {
    address = toReefEVMAddressWithNotification(address);
    navigator.clipboard.writeText(address).then(() => {
      Uik.notify.info('Copied address to clipboard');
    }, () => {
      Uik.notify.danger('Cannot copy to clipboard');
    });
  };

  return (
    <div className="mx-auto bind-evm">
      {!bindFor.isEvmClaimed
        && (
        <div>
          <p>
            Start using Reef EVM smart contracts.
            <br />
            First connect EVM address for
            {' '}
          </p>
          <Account account={bindFor} />
        </div>
        )}
      {bindFor.isEvmClaimed
        && (
        <div>
          <Account account={bindFor} />
          <p>
            {' '}
            Successfully connected to Ethereum VM address&nbsp;
            <b>{toAddressShortDisplay(bindFor.evmAddress)}</b>
            .
            <br />
          </p>

          <Uik.Button
            text="Copy EVM address"
            fill={!onComplete}
            size="large"
            onClick={() => copyAddress(bindFor.evmAddress)}
          />

          { !!onComplete
            && (
              <Uik.Button
                text="Continue"
                fill
                size="large"
                onClick={onComplete}
              />
            )}
        </div>
        )}
      {!bindFor.isEvmClaimed
        && (
        <div>
          {txStatus && (
          <div>
            {/* In progress */}
            {!txStatus.error && !txStatus.isInBlock && !txStatus.isComplete
            && (
            <p className="bind-evm__loading">
              <Uik.Loading size="small" />
              <span>
                {txStatus.componentTxType === EvmBindComponentTxType.BIND ? 'Connecting EVM address' : 'Transfer'}
                {' '}
                in progress
              </span>
            </p>
            )}
            {customBindState.signingInProcess
            && (
            <p className="bind-evm__loading">
              <Uik.Loading size="small" />
              <span>
                Signing message with EVM wallet in progress
              </span>
            </p>
            )}
            {/* Bound */}
            {!txStatus.error && txStatus.isInBlock && txStatus.componentTxType === EvmBindComponentTxType.BIND && (
            <div>
              <p>
                Connected Ethereum VM address is {" "}
                { customBindState.useCustomEvmAddress && customBindState.evmAddress ? customBindState.evmAddress : bindFor.evmAddress }
              </p>
            </div>
            )}
            {/* Error message */}
            {txStatus.error && <p>{txStatus.error.message}</p>}
            {customBindState.error && <p>{customBindState.error}</p>}
          </div>
          )}

          {/* Not enough balance */}
          {!txStatus && !hasBalanceForBinding(bindFor.balance)
          && (
          <div>
            {!txStatus && !transferBalanceFrom
            && <p>Not enough REEF in account for connect EVM address transaction fee.</p>}
            {!txStatus && !!transferBalanceFrom && (
            <div>
              <p>
                <b>
                  ~
                  {toReefBalanceDisplay(MIN_BALANCE)}
                </b>
                &nbsp; is needed for transaction fee.
                <br />
                <br />

                Coins will be transferred from account:&nbsp;
                <OpenModalButton
                  className="btn-empty bind-evm__select-account"
                  id="selectMyAddress"
                >
                  <Account account={transferBalanceFrom} />
                </OpenModalButton>
              </p>

              <AccountListModal
                accounts={availableTxAccounts}
                id="selectMyAddress"
                selectAccount={onAccountSelect}
                title="Select account"
              />
              <Uik.Button
                text="Continue"
                fill
                size="large"
                onClick={() => transfer(transferBalanceFrom!, bindSigner, MIN_BALANCE, getUpdateTxCallback([onTxUpdate as TxStatusHandler, setTxStatus]))}
              />
            </div>
            )}
          </div>
          )}

          {/* Start binding */}
          {(!customBindState.signingInProcess && ((!txStatus && hasBalanceForBinding(bindFor.balance)) 
            || (txStatus && !txStatus.error && txStatus.isInBlock && txStatus.componentTxType === EvmBindComponentTxType.TRANSFER)))
          && (
          <div>
            { !customBindState.signature && txStatus && <p>Transfer complete. Now run connect EVM account transaction.</p> }
            { customBindState.signature && customBindState.evmAddress && <p>Message signed for {customBindState.evmAddress} address. Now run connect EVM account transaction.</p>  }
            { !customBindState.signature &&
              <div className='bind-evm__custom-select'>
                <Uik.Toggle
                  value={customBindState.useCustomEvmAddress}
                  onChange={() => setCustomBindState({useCustomEvmAddress: !customBindState.useCustomEvmAddress})}
                /> 
                <div className='prompt'>
                  <span>Use custom EVM address</span>
                  <div>
                    <span data-tip data-for="custom-evm-select">
                      <Uik.Icon icon={faQuestionCircle} className="icon" />
                    </span>
                    <ReactTooltip
                      id="custom-evm-select"
                      place="top"
                      effect="solid"
                      backgroundColor="#46288b"
                    >
                      By default, your Reef account will be bound to a predetermined EVM address. 
                      You should use this EVM address <b>only in the Reef network</b>.<br/>
                      Enabling this option you will bind your Reef account to an EVM address you own by signing a message with an EVM wallet.
                    </ReactTooltip>
                  </div>
                </div>
              </div>
            }

            <Uik.Button
              fill
              size="large"
              text="Continue"
              onClick={() => customBindState.useCustomEvmAddress && !customBindState.signature
                ? signEvmMessage()
                : bindAccount(getUpdateTxCallback([onTxUpdate as TxStatusHandler, setTxStatus]))}
            />
          </div>
          )}
        </div>
        )}
    </div>
  );
};
