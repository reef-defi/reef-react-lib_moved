import React from 'react';
import { TokenWithAmount } from '../../state';
import { calculateUsdAmount } from '../../utils';
import { Margin } from '../common/Display';
import { ConfirmLabel } from '../common/Label';
import ConfirmationModal from '../common/Modal';
import { TokenAmountView } from '../TokenFields/TokenAmountView';

interface SendConfirmationModal {
  id: string;
  to: string;
  token: TokenWithAmount;
  confirmFun: () => void;
}

const SendConfirmationModal = ({
  id,
  to,
  token: {
    amount,
    decimals,
    price,
    name,
  },
  confirmFun,
}: SendConfirmationModal): JSX.Element => (
  <ConfirmationModal
    id={id}
    title="Send tokens"
    confirmFun={confirmFun}
    confirmBtnLabel="Send tokens"
  >
    <TokenAmountView
      name={name}
      amount={amount}
      usdAmount={calculateUsdAmount({ amount, price, decimals })}
      placeholder="Send Token"
    />

    <Margin size="3">
      <ConfirmLabel
        title="Send To"
        value={`${to.substr(0, 10)} ... ${to.substr(to.length - 10)}`}
      />
    </Margin>
  </ConfirmationModal>
);

export default SendConfirmationModal;
