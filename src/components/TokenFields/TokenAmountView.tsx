import React from 'react';
import { SubCard } from '../common/Card';
import { ContentBetween, Margin } from '../common/Display';
import { MiniText, MutedText, Title } from '../common/Text';

interface TokenAmountView {
  name: string;
  amount: string;
  usdAmount: number;
  placeholder: string;
}

export const TokenAmountView = ({
  name,
  amount,
  usdAmount,
  placeholder,
}: TokenAmountView): JSX.Element => (
  <SubCard>
    <ContentBetween>
      <MutedText>{placeholder}</MutedText>
      <MiniText>{`~$ ${usdAmount.toFixed(2)}`}</MiniText>
    </ContentBetween>
    <Margin>
      <ContentBetween>
        <Title>{name}</Title>
        <Title>{amount}</Title>
      </ContentBetween>
    </Margin>
  </SubCard>
);
