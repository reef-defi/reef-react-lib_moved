import React, { useEffect, useState } from 'react';
import { utils } from 'ethers';
import { decodeAddress } from '@polkadot/util-crypto';
import { Provider } from '@reef-defi/evm-provider';
import {
  calculateUsdAmount,
  handleErr,
  sendToNativeAddress,
  toDecimalPlaces,
  toUnits,
  TX_STATUS_ERROR_CODE,
} from '../../utils';
import {
  ensureTokenAmount,
  ReefSigner,
  reefTokenWithAmount,
  Token,
  TokenWithAmount,
} from '../../state';
import { getREEF20Contract } from '../../rpc';
import {
  CenterColumn,
  ComponentCenter,
  FlexRow,
  Margin,
  MT,
} from '../common/Display';
import {
  Card,
  CardHeader,
  CardHeaderBlank,
  CardTitle,
  SubCard,
} from '../common/Card';
import { TokenAmountFieldMax, TokenAmountView } from '../TokenFields';
import { Input } from '../common/Input';
import { MiniText } from '../common/Text';
import ConfirmationModal, {
  ModalFooter,
  OpenModalButton,
} from '../common/Modal';
import { Loading, LoadingButtonIconWithText } from '../common/Loading';
import { AccountListModal } from '../AccountSelector/AccountListModal';
import { ConfirmLabel } from '../common/Label';
import { Button } from '../common/Button';
import { TxStatusHandler, TxStatusUpdate } from '../../utils/transactionUtil';

interface TransferComponent {
  tokens: Token[];
  from: ReefSigner;
  token?: TokenWithAmount;
  provider: Provider;
  onTxUpdate?: TxStatusHandler;
  accounts: ReefSigner[];
  currentAccount: ReefSigner;
}

const TX_IDENT_ANY = 'TX_HASH_ANY';
const REEF_TOKEN = reefTokenWithAmount();

const isSubstrateAddress = (to: string): boolean => {
  if (!to || !to.startsWith('5')) {
    return false;
  }
  try {
    return !!decodeAddress(to, true, 42);
  } catch (err) {}
  return false;
};

async function sendToEvmAddress(
  txToken: TokenWithAmount,
  signer: ReefSigner,
  to: string,
  txHandler: TxStatusHandler,
): Promise<string> {
  const txIdent = Math.random().toString(10);
  const tokenContract = await getREEF20Contract(txToken.address, signer.signer);
  if (!tokenContract) {
    handleErr(
      { message: 'Contract does not exist.' },
      txIdent,
      '',
      txHandler,
      signer,
    );
    return Promise.resolve(txIdent);
  }

  const toAmt = utils.parseUnits(txToken.amount, tokenContract.values.decimals);
  try {
    tokenContract.contract
      .transfer(to, toAmt.toString())
      .then((contractCall: any) => {
        txHandler({
          txIdent,
          txHash: contractCall.hash,
          isInBlock: true,
          txTypeEvm: true,
          url: `https://reefscan.com/extrinsic/${contractCall.hash}`,
          addresses: [signer.address],
        });
      })
      .catch(async (e: any) => {
        console.log('sendToEvmAddress error=', e);
        handleErr(e, txIdent, '', txHandler, signer);
      });
  } catch (e) {
    console.log('sendToEvmAddress err =', e);
    handleErr(e, txIdent, '', txHandler, signer);
  }
  return Promise.resolve(txIdent);
}

const filterCurrentAccount = (
  accounts: ReefSigner[],
  selected: ReefSigner,
): ReefSigner[] => accounts.filter((a) => a.address !== selected.address);

const transferFeeNative = utils.parseEther('1.53').toString();
const existentialDeposit = utils.parseEther('1.001').toString();

const getSubtractedFeeAndExistential = (txToken: TokenWithAmount): string => toUnits({
  balance: txToken.balance.sub(transferFeeNative).sub(existentialDeposit),
  decimals: 18,
});

const getSubtractedFee = (txToken: TokenWithAmount): string => toUnits({ balance: txToken.balance.sub(transferFeeNative), decimals: 18 });

function toAmountInputValue(amt: string): string {
  return toDecimalPlaces(amt, 8);
}

// need to call onTxUpdate even if component is destroyed
const getUpdateTxCallback = (fns: (TxStatusHandler | undefined)[]): TxStatusHandler => (val) => {
  const handlers = fns.filter((v) => !!v) as TxStatusHandler[];
  handlers.forEach((fn) => fn(val));
};

export const TransferComponent = ({
  tokens,
  from,
  token,
  provider,
  onTxUpdate,
  currentAccount,
  accounts,
}: TransferComponent): JSX.Element => {
  const [availableTxAccounts, setAvailableTxAccounts] = useState<ReefSigner[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [txToken, setTxToken] = useState(token || ({ ...tokens[0], amount: '0' } as TokenWithAmount));
  const [to, setTo] = useState('');
  const [foundToAccountAddress, setFoundToAccountAddress] = useState<ReefSigner | null>();
  const [validationError, setValidationError] = useState('');
  const [resultMessage, setResultMessage] = useState<{
    complete: boolean;
    title: string;
    message: string;
    url?: string;
    loading?: boolean;
  } | null>(null);
  const [lastTxIdentInProgress, setLastTxIdentInProgress] = useState<string>();
  const [txUpdateData, setTxUpdateData] = useState<TxStatusUpdate>();

  useEffect(() => {
    if (!lastTxIdentInProgress) {
      setResultMessage(null);
      return;
    }
    if (
      lastTxIdentInProgress === txUpdateData?.txIdent
      || txUpdateData?.txIdent === TX_IDENT_ANY
    ) {
      if (txUpdateData?.error) {
        setResultMessage({
          complete: true,
          title: 'Transaction failed',
          message: txUpdateData.error.message || '',
        });
        return;
      }
      if (!txUpdateData?.isInBlock && !txUpdateData?.isComplete) {
        setResultMessage({
          complete: false,
          title: 'Transaction initiated',
          message: 'Sending transaction to blockchain.',
          loading: true,
        });
        return;
      }
      if (txUpdateData?.isInBlock) {
        let message = 'Transaction was accepted in latest block.';
        if (!txUpdateData.txTypeEvm) {
          message
            += ' For maximum reliability you can wait block finality ~30sec.';
        }
        setResultMessage({
          complete: true,
          title: 'Transaction successfull',
          message,
          url:
            txUpdateData.url
            || `https://reefscan.com/transfer/${txUpdateData.txHash}`,
          loading: !txUpdateData.txTypeEvm,
        });
        return;
      }
      if (txUpdateData?.isComplete) {
        setResultMessage({
          complete: true,
          title: 'Transaction complete',
          message: 'Token transfer has been finalized.',
          url:
            txUpdateData.url
            || `https://reefscan.com/transfer/${txUpdateData.txHash}`,
        });
      }
    }
  }, [txUpdateData, lastTxIdentInProgress]);

  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    if (token) {
      setTxToken({ ...token, amount: txToken?.amount || '0' });
    }
  }, [token]);

  useEffect(() => {
    const reefAddress = reefTokenWithAmount().address;
    const selectTokenAddr = txToken ? txToken.address : reefAddress;
    let newTxToken = tokens.find((t) => t.address === selectTokenAddr);
    if (!newTxToken) {
      newTxToken = tokens.find((t) => t.address === reefAddress);
    }
    if (!newTxToken) {
      [newTxToken] = tokens;
    }
    setTxToken({ ...newTxToken, amount: txToken?.amount || '0' } as TokenWithAmount);
  }, [tokens]);

  useEffect(() => {
    const exceptCurrent = filterCurrentAccount(accounts, currentAccount);
    if (txToken?.address === REEF_TOKEN.address) {
      setAvailableTxAccounts(exceptCurrent);
      return;
    }
    setAvailableTxAccounts(exceptCurrent.filter((a) => !!a.isEvmClaimed));
  }, [accounts, currentAccount, txToken]);

  const amountChanged = (amount: string): void => {
    if (!txToken) {
      return;
    }
    let amt = amount;
    if (parseFloat(amt) <= 0) {
      amt = '';
    }
    setTxToken({ ...txToken, amount: toAmountInputValue(amt) });
  };

  const addressChanged = (_: any): Promise<void> => Promise.resolve();

  const tokenSelected = (tkn: Token): void => {
    if (tkn.address !== txToken?.address) {
      setTxToken({ ...tkn, amount: '', isEmpty: false } as TokenWithAmount);
    }
  };

  const onSendTxConfirmed = async (): Promise<void> => {
    if (isLoading || !provider || !txToken) {
      return;
    }
    try {
      setIsLoading(true);
      ensureTokenAmount(txToken);
      if (utils.isAddress(to)) {
        const txIdent = await sendToEvmAddress(
          txToken,
          from,
          to,
          getUpdateTxCallback([onTxUpdate, setTxUpdateData]),
        );
        setLastTxIdentInProgress(txIdent);
        getUpdateTxCallback([onTxUpdate, setTxUpdateData])({ txIdent });
      } else if (isSubstrateAddress(to)) {
        const txIdent = sendToNativeAddress(
          provider,
          from,
          utils.parseEther(txToken.amount),
          to,
          getUpdateTxCallback([onTxUpdate, setTxUpdateData]),
        );
        setLastTxIdentInProgress(txIdent);
        getUpdateTxCallback([onTxUpdate, setTxUpdateData])({ txIdent });
      }
    } catch (err) {
      console.log('onSendTxConfirmed error =', err);
      setLastTxIdentInProgress(TX_IDENT_ANY);
      getUpdateTxCallback([onTxUpdate, setTxUpdateData])({
        txIdent: TX_IDENT_ANY,
        error: {
          message: err.message || err,
          code: TX_STATUS_ERROR_CODE.ERROR_UNDEFINED,
        },
        addresses: [from.address],
      });
    }
    setIsLoading(false);
  };

  const initTransferUi = (): void => {
    setLastTxIdentInProgress('');
    setResultMessage(null);
    amountChanged('');
    setTo('');
  };

  useEffect(() => {
    if (!txToken) {
      return;
    }
    if (!txToken.amount || utils.parseEther(txToken.amount).isZero()) {
      setValidationError('Set amount');
      return;
    }

    const amountOverBalance = utils
      .parseEther(txToken.amount)
      .gt(txToken.balance);
    if (!amountOverBalance && txToken.address === REEF_TOKEN.address) {
      const isOverTxFee = parseFloat(txToken.amount)
        > parseFloat(toAmountInputValue(getSubtractedFee(txToken)));
      if (isOverTxFee) {
        setValidationError(
          `Amount too high for transfer fee ( ~${utils.formatUnits(
            transferFeeNative,
            18,
          )}REEF)`,
        );
        return;
      }
    }

    if (amountOverBalance) {
      setValidationError('Amount exceeds balance');
      return;
    }

    if (!to.trim()) {
      setValidationError('Set address');
      return;
    }

    if (!isSubstrateAddress(to) && !utils.isAddress(to)) {
      setValidationError('Send to not valid address');
      return;
    }
    setValidationError('');
  }, [to, txToken]);

  useEffect(() => {
    if (!to || !accounts || !accounts.length) {
      setFoundToAccountAddress(null);
      return;
    }
    const foundToAddrAccount = accounts.find(
      (a: any) => a.address.toLowerCase() === to.toLowerCase()
        || a.evmAddress.toLowerCase() === to.toLowerCase(),
    );
    if (foundToAddrAccount) {
      setFoundToAccountAddress(foundToAddrAccount);
      return;
    }
    setFoundToAccountAddress(null);
  }, [to, accounts]);

  const onAccountSelect = (_: any, selected: ReefSigner): void => {
    const selectAcc = async (): Promise<void> => {
      let addr = '';
      if (txToken?.address === REEF_TOKEN.address) {
        addr = await selected.signer.getSubstrateAddress();
      }
      if (!addr && selected.isEvmClaimed) {
        addr = selected.evmAddress;
      }
      setTo(addr);
    };
    selectAcc();
  };

  return (
    <div className="mx-auto">
      {!resultMessage && (
        <div className="mx-auto">
          <ComponentCenter>
            <Card>
              <CardHeader>
                <CardHeaderBlank />
                <CardTitle title="Send Tokens" />
                <CardHeaderBlank />
              </CardHeader>
              <SubCard>
                <Input
                  value={to}
                  maxLength={70}
                  onChange={(toVal: string) => setTo(toVal.trim())}
                  placeholder="Send to address"
                  disabled={isLoading}
                />
                <MT size="2" />
                <FlexRow className="d-flex-vert-base">
                  {foundToAccountAddress && (
                    <span className="pl-1rem">
                      <MiniText>
                        Selected account:&nbsp;
                        {foundToAccountAddress?.name}
                      </MiniText>
                    </span>
                  )}
                  <OpenModalButton
                    id="selectMyAddress"
                    disabled={isLoading}
                    className="btn-empty link-text text-xs text-primary pl-1rem"
                  >
                    Select account
                  </OpenModalButton>
                </FlexRow>
              </SubCard>

              <MT size="2" />
              <TokenAmountFieldMax
                token={txToken}
                tokens={tokens}
                signer={currentAccount}
                id="transfer-token"
                onAmountChange={amountChanged}
                onTokenSelect={tokenSelected}
                onAddressChange={addressChanged}
                hideSelectTokenCommonBaseView
                afterBalanceEl={
                  txToken?.address === REEF_TOKEN.address
                  && isSubstrateAddress(to) ? (
                    <span>
                      {txToken.amount
                        !== toAmountInputValue(getSubtractedFee(txToken)) && (
                        <span
                          className="text-primary text-decoration-none"
                          role="button"
                          onClick={() => amountChanged(getSubtractedFee(txToken))}
                        >
                          (Max)
                        </span>
                      )}
                      {txToken.amount
                        === toAmountInputValue(getSubtractedFee(txToken)) && (
                        <span
                          className="text-primary text-decoration-none"
                          role="button"
                          onClick={() => amountChanged(
                            getSubtractedFeeAndExistential(txToken),
                          )}
                        >
                          (Keep existential deposit)
                        </span>
                      )}
                    </span>
                    ) : (
                      <span />
                    )
                }
              />

              <MT size="2">
                <CenterColumn>
                  <OpenModalButton
                    id="txModalToggle"
                    disabled={!!validationError || isLoading}
                  >
                    {isLoading ? (
                      <LoadingButtonIconWithText text="Sending" />
                    ) : (
                      validationError || 'Send'
                    )}
                  </OpenModalButton>
                </CenterColumn>
              </MT>
            </Card>
          </ComponentCenter>

          <AccountListModal
            id="selectMyAddress"
            accounts={availableTxAccounts}
            selectAccount={onAccountSelect}
            title={(
              <div>
                Select account&nbsp;
                {txToken?.address !== REEF_TOKEN.address && (
                  <span className="text-xs">(Ethereum VM enabled)</span>
                )}
              </div>
            )}
          />

          <ConfirmationModal
            id="txModalToggle"
            title="Send tokens"
            confirmFun={onSendTxConfirmed}
            confirmBtnLabel="Confirm and continue"
          >
            {txToken && (
            <TokenAmountView
              name={txToken.name}
              amount={txToken.amount}
              usdAmount={calculateUsdAmount(txToken)}
              placeholder="Send Token"
            />
            )}
            <Margin size="3">
              <ConfirmLabel
                title="Send To"
                value={`${to.substr(0, 10)} ... ${to.substr(to.length - 10)}`}
              />
            </Margin>
          </ConfirmationModal>
        </div>
      )}
      {resultMessage && (
        <ComponentCenter>
          <Card>
            <CardHeader>
              <CardHeaderBlank />
              <CardTitle title={resultMessage.title} />
              <CardHeaderBlank />
            </CardHeader>
            <MT size="3">
              <div className="text-center">
                {resultMessage.loading && <Loading />}
                <div>
                  {resultMessage.message}
                  {!!resultMessage.url && (
                    <div>
                      <br />
                      <a
                        target="_blank"
                        href={`${resultMessage.url}`}
                        rel="noreferrer"
                      >
                        View transaction on reefscan.com
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </MT>
            <MT size="2">
              <ModalFooter>
                {!!resultMessage.complete && (
                  <Button onClick={initTransferUi}>Close</Button>
                )}
              </ModalFooter>
            </MT>
          </Card>
        </ComponentCenter>
      )}
    </div>
  );
};
