import React from 'react';
import { Pool } from '../../state';
import {
  calculatePoolRatio,
  calculatePoolShare,
  removeUserPoolSupply,
  showRemovePoolTokenShare,
} from '../../utils';
import { SubCard } from '../common/Card';
import { Margin, MT, MX } from '../common/Display';
import { PlusIcon } from '../common/Icons';
import { ConfirmLabel } from '../common/Label';
import ConfirmationModal from '../common/Modal';
import { MiniText, MutedText } from '../common/Text';

interface RemoveConfirmationModal {
  id: string;
  pool?: Pool;
  slippage: number;
  percentageAmount: number;
  onRemove: () => void;
}

const RemoveConfirmationModal = ({
  id,
  pool,
  slippage,
  percentageAmount,
  onRemove,
}: RemoveConfirmationModal): JSX.Element => {
  const name1 = pool ? pool.token1.name : '';
  const name2 = pool ? pool.token2.name : '';
  return (
    <ConfirmationModal
      id={id}
      title="Remove supply"
      confirmFun={onRemove}
      confirmBtnLabel="Confirm and continue"
    >
      <MX size="2">
        <MutedText>You will receive</MutedText>
        <SubCard>
          <ConfirmLabel
            titleSize="h4"
            valueSize="h6"
            title={showRemovePoolTokenShare(percentageAmount, pool?.token1)}
            value={name1}
          />
          <PlusIcon />
          <ConfirmLabel
            titleSize="h4"
            valueSize="h6"
            title={showRemovePoolTokenShare(percentageAmount, pool?.token2)}
            value={name2}
          />
        </SubCard>
        <MT size="3" />
        <MutedText>Burned tokens</MutedText>
        <SubCard>
          <ConfirmLabel
            titleSize="h4"
            valueSize="h6"
            title={removeUserPoolSupply(percentageAmount, pool).toFixed(8)}
            value={`${name1}/${name2}`}
          />
        </SubCard>
        <Margin size="3">
          <MiniText>
            <MutedText>
              Output is estimated. If the price changes by more than
              {' '}
              {slippage}
              % your transaction will revert.
            </MutedText>
          </MiniText>
        </Margin>
        <SubCard>
          <ConfirmLabel
            title="Liquidity Provider Fee"
            value="1.5 REEF"
            titleSize="mini-text"
            valueSize="mini-text"
          />
          <ConfirmLabel
            title="Rates"
            value={`1 ${name1} = ${calculatePoolRatio(pool).toFixed(
              8,
            )} ${name2}`}
            titleSize="mini-text"
            valueSize="mini-text"
          />
          <ConfirmLabel
            title=""
            value={`1 ${name2} = ${calculatePoolRatio(pool, false).toFixed(
              8,
            )} ${name1}`}
            titleSize="mini-text"
            valueSize="mini-text"
          />
          <ConfirmLabel
            title="Share of Pool"
            value={`${calculatePoolShare(pool).toFixed(8)} %`}
            titleSize="mini-text"
            valueSize="mini-text"
          />
        </SubCard>
      </MX>
    </ConfirmationModal>
  );
};

export default RemoveConfirmationModal;
