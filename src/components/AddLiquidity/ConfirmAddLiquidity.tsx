import React from 'react';
import { Pool, TokenWithAmount } from '../../state';
import { calculatePoolShare, calculatePoolSupply } from '../../utils';
import { SubCard } from '../common/Card';
import { Margin } from '../common/Display';
import { ConfirmLabel } from '../common/Label';
import ConfirmationModal from '../common/Modal';
import { MiniText, MutedText } from '../common/Text';

interface ConfirmAddLiquidity {
  id: string;
  pool?: Pool;
  percentage: number;
  token1: TokenWithAmount;
  token2: TokenWithAmount;
  confirmFun: () => void;
}

const ConfirmAddLiquidity = ({
  id, pool, percentage, token1, token2, confirmFun,
} : ConfirmAddLiquidity): JSX.Element => {
  const supply = calculatePoolSupply(token1, token2, pool);
  return (
    <ConfirmationModal
      id={id}
      title="Add Supply"
      confirmFun={confirmFun}
      confirmBtnLabel="Confirm and continue"
    >
      <MutedText>You will recieve</MutedText>
      <SubCard>
        <ConfirmLabel
          titleSize="h4"
          valueSize="h6"
          title={supply.toFixed(8)}
          value={`${token1.name}/${token2.name}`}
        />
      </SubCard>
      <Margin size="3">
        <MiniText>
          <MutedText>
            Output is estimated. If the price changes by more than
            {' '}
            {percentage}
            % your transaction will revert.
          </MutedText>
        </MiniText>
      </Margin>
      <SubCard>
        <Margin size="2">
          <ConfirmLabel title="Liquidity Provider Fee" value="1.5 REEF" titleSize="mini-text" valueSize="mini-text" />
          <ConfirmLabel title={`${token1.name} Deposited`} value={`${token1.amount}`} titleSize="mini-text" valueSize="mini-text" />
          <ConfirmLabel title={`${token2.name} Deposited`} value={`${token2.amount}`} titleSize="mini-text" valueSize="mini-text" />
          <ConfirmLabel title="Rates" value={`1 ${token1.name} = ${(token1.price / token2.price).toFixed(8)} ${token2.name}`} titleSize="mini-text" valueSize="mini-text" />
          <ConfirmLabel title="" value={`1 ${token2.name} = ${(token2.price / token1.price).toFixed(8)} ${token1.name}`} titleSize="mini-text" valueSize="mini-text" />
          <ConfirmLabel title="Share of Pool" value={`${calculatePoolShare(pool).toFixed(8)} %`} titleSize="mini-text" valueSize="mini-text" />
        </Margin>
      </SubCard>
    </ConfirmationModal>
  );
};

export default ConfirmAddLiquidity;
