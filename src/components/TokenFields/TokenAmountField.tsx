import React from 'react';
import { TokenWithAmount, Token, Color } from '../../state';
import { showBalance, toBalance } from '../../utils/math';
import { SubCard } from '../common/Card';
import { CenterColumn, FlexRow } from '../common/Display';
import { InputAmount } from '../common/Input';
import { ColorText, MiniText } from '../common/Text';
import SelectToken from '../SelectToken';

interface TokenAmountFieldProps {
  id?: string;
  tokens: Token[];
  placeholder?: string;
  token: TokenWithAmount;
  onTokenSelect: (newToken: Token) => void;
  onAmountChange: (amount: string) => void;
  onAddressChange?: (address: string) => Promise<void>;
}

const TokenAmountFieldBase: React.FC<TokenAmountFieldProps> = ({
  id = 'exampleModal', token, tokens, onTokenSelect, onAmountChange, placeholder = '0.0', children, onAddressChange = async () => {},
}): JSX.Element => {
  const {
    name, isEmpty, amount, iconUrl,
  } = token;

  return (
    <SubCard>
      <FlexRow>
        <SelectToken
          id={id}
          tokens={tokens}
          iconUrl={iconUrl}
          selectedTokenName={name}
          onTokenSelect={onTokenSelect}
          onAddressChange={onAddressChange}
        />
        <InputAmount
          amount={amount}
          disabled={isEmpty}
          placeholder={placeholder}
          onAmountChange={onAmountChange}
        />
      </FlexRow>
      <CenterColumn>
        {children}
      </CenterColumn>
    </SubCard>
  );
};

export const TokenAmountField = ({
  id, token, tokens, placeholder, onTokenSelect, onAmountChange, onAddressChange,
} : TokenAmountFieldProps): JSX.Element => {
  const { amount, price, isEmpty } = token;
  const amo = parseFloat(amount);
  return (
    <TokenAmountFieldBase
      id={id}
      token={token}
      tokens={tokens}
      placeholder={placeholder}
      onTokenSelect={onTokenSelect}
      onAmountChange={onAmountChange}
      onAddressChange={onAddressChange}
    >
      <MiniText>
        {!isEmpty && `Balance: ${showBalance(token)}`}
      </MiniText>
      <MiniText>
        {!isEmpty && price !== 0 && amount !== '' && `~$ ${(amo * price).toFixed(2)}`}
      </MiniText>
    </TokenAmountFieldBase>
  );
};

export const TokenAmountFieldMax = ({
  id, token, tokens, placeholder, onTokenSelect, onAmountChange, onAddressChange,
}: TokenAmountFieldProps): JSX.Element => {
  const { amount, price, isEmpty } = token;
  const amo = parseFloat(amount);

  return (
    <TokenAmountFieldBase
      id={id}
      token={token}
      tokens={tokens}
      placeholder={placeholder}
      onTokenSelect={onTokenSelect}
      onAmountChange={onAmountChange}
      onAddressChange={onAddressChange}
    >
      <MiniText>
        {!isEmpty && `Balance: ${showBalance(token)}`}

        {!isEmpty && <span className="text-primary text-decoration-none" role="button" onClick={() => onAmountChange(`${toBalance(token)}`)}>(Max)</span>}
      </MiniText>
      <MiniText>
        {!isEmpty && price !== 0 && amount !== '' && `~$ ${(amo * price).toFixed(4)}`}
      </MiniText>
    </TokenAmountFieldBase>
  );
};

interface TokenAmountFieldImpactPriceProps extends TokenAmountFieldProps {
  percentage: number;
}

const PercentageView = ({ percentage }: {percentage: number}): JSX.Element => {
  let color: Color = 'success';
  if (percentage > 0) { color = 'success'; } else if (percentage < -0.05) { color = 'danger'; } else { color = 'warning'; }
  return (
    <ColorText color={color}>
      (
      {`${(percentage * 100).toFixed(2)} %`}
      )
    </ColorText>
  );
};

export const TokenAmountFieldImpactPrice = ({
  id, token, tokens, placeholder, percentage, onTokenSelect, onAmountChange, onAddressChange,
}: TokenAmountFieldImpactPriceProps): JSX.Element => {
  const { amount, price, isEmpty } = token;
  const amo = parseFloat(amount);

  const showUsd = !isEmpty && price !== 0 && amount !== '';

  return (
    <TokenAmountFieldBase
      id={id}
      token={token}
      tokens={tokens}
      placeholder={placeholder}
      onTokenSelect={onTokenSelect}
      onAmountChange={onAmountChange}
      onAddressChange={onAddressChange}
    >
      <MiniText>
        {!isEmpty && `Balance: ${showBalance(token)}`}
      </MiniText>
      <MiniText>
        {showUsd && `~$ ${(amo * price).toFixed(4)} `}
        {showUsd && <PercentageView percentage={percentage} />}
      </MiniText>
    </TokenAmountFieldBase>
  );
};
