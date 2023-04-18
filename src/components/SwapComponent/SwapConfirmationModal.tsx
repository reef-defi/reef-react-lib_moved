import React from 'react';
import { TokenWithAmount } from '../../state';
import { calculateUsdAmount, minimumReceiveAmount } from '../../utils/math';
import { SwitchTokenButton } from '../common/Button';
import { SubCard } from '../common/Card';
import { Margin } from '../common/Display';
import { ConfirmLabel } from '../common/Label';
import ConfirmationModal from '../common/Modal';
import { MutedText } from '../common/Text';
import { TokenAmountView } from '../TokenFields';

interface SwapConfirmationModal {
  id?: string;
  percentage: number;
  buy: TokenWithAmount;
  sell: TokenWithAmount;
  confirmFun: () => Promise<void>;
}

const SwapConfirmationModal = ({
  id,
  buy,
  sell,
  percentage,
  confirmFun,
}: SwapConfirmationModal): JSX.Element => (
  <ConfirmationModal
    id={id}
    title="Swap Tokens"
    confirmFun={confirmFun}
    confirmBtnLabel="Confirm and continue"
  >
    <TokenAmountView
      name={sell.name}
      amount={sell.amount}
      usdAmount={calculateUsdAmount(sell)}
      placeholder="From"
    />
    <SwitchTokenButton disabled />
    <TokenAmountView
      name={buy.name}
      amount={buy.amount}
      usdAmount={calculateUsdAmount(buy)}
      placeholder="To"
    />
    <Margin size="3">
      <ConfirmLabel
        title="Price"
        value={`1 ${buy.name} = ${(buy.price / sell.price).toFixed(4)} ${
          sell.name
        }`}
      />
    </Margin>
    <SubCard>
      <ConfirmLabel
        title="Liquidity Provider Fee"
        value="1.5 REEF"
        titleSize="mini-text"
        valueSize="mini-text"
      />
      <ConfirmLabel
        title="Route"
        value={`${sell.name} > ${buy.name}`}
        titleSize="mini-text"
        valueSize="mini-text"
      />
      <ConfirmLabel
        title="Minimum received"
        value={`${minimumReceiveAmount(buy, percentage).toFixed(4)} ${
          buy.name
        }`}
        titleSize="mini-text"
        valueSize="mini-text"
      />
      <ConfirmLabel
        title="Slippage tolerance"
        value={`${percentage.toFixed(2)}%`}
        titleSize="mini-text"
        valueSize="mini-text"
      />
    </SubCard>
    <Margin size="3">
      <MutedText>
        Output is estimated. You will receive at least
        <b>
          {`${minimumReceiveAmount(buy, percentage).toFixed(4)} ${
            buy.name
          }`}
        </b>
        {' '}
        or the transaction will revert.
      </MutedText>
    </Margin>
  </ConfirmationModal>
);

export default SwapConfirmationModal;
