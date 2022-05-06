import React, { useMemo } from 'react';
import { useCurrentPoolSupply, useDayFee, useDayVolume } from '../../hooks';
import { formatAmount } from '../../utils';
import { Icons, Card } from '../common';
import {
  FullRow, ContentBetween, ME, MT,
} from '../common/Display';
import { BoldText, ColorText, Text } from '../common/Text';

interface PoolInfo {
  icon1: string;
  icon2: string;
  address: string;
  symbol1: string;
  symbol2: string;
  decimal1: number;
  decimal2: number;
  reserved1: string;
  reserved2: string;
}

interface InfoLine {
  icon: string;
  symbol: string;
  amount: string;
}

interface InfoPercentageLine extends InfoLine {
  percentage: number;
}

const InfoLine: React.FC<InfoLine> = ({
  icon, symbol, amount, children,
}): JSX.Element => (
  <FullRow>
    <ContentBetween>
      <div className="d-flex align-middle">
        <Icons.TokenIcon src={icon} />
        <ME size="1" />
        <Text className="m-auto">{symbol}</Text>
      </div>
      <div className="d-flex flex-column">
        <BoldText size={1.3}>{amount}</BoldText>
        { children }
      </div>
    </ContentBetween>
  </FullRow>
);

const InfoPercentageLine = ({
  amount, icon, symbol, percentage,
}: InfoPercentageLine): JSX.Element => (
  <InfoLine
    icon={icon}
    amount={amount}
    symbol={symbol}
  >
    <ColorText color={percentage < 0 ? 'danger' : 'success'} size={0.8} className="text-end">
      {percentage.toFixed(3)}
      {' '}
      %
    </ColorText>
  </InfoLine>
);

export const PoolInfo = ({
  address, decimal1, decimal2, symbol1, symbol2, reserved1, reserved2, icon1, icon2,
} : PoolInfo): JSX.Element => {
  const currentTime = useMemo(() => new Date(Date.now()).toISOString(), []);
  const oneDayAgo = useMemo(() => new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), []);
  const twoDaysAgo = useMemo(() => new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), []);

  const { data: feesData } = useDayFee(address, oneDayAgo);
  const { data: supplyData } = useCurrentPoolSupply(address);
  const { data: todayVolume } = useDayVolume(address, oneDayAgo, currentTime);
  const { data: yesterdayVolume } = useDayVolume(address, twoDaysAgo, oneDayAgo);

  // Supply
  const totalSupply = supplyData && supplyData.pool_minute_supply.length > 0
    ? formatAmount(supplyData.pool_minute_supply[0].total_supply, 18)
    : '-';

  const totalSupplyPercentage = supplyData && supplyData.pool_minute_supply.length > 0
    ? supplyData.pool_minute_supply[0].supply / supplyData.pool_minute_supply[0].total_supply * 100
    : 0;

  // Volume
  const todayVolume1 = todayVolume ? todayVolume.pool_hour_volume_aggregate.aggregate.sum.amount_1 : 0;
  const todayVolume2 = todayVolume ? todayVolume.pool_hour_volume_aggregate.aggregate.sum.amount_2 : 0;
  const yesterdayVolume1 = yesterdayVolume ? yesterdayVolume.pool_hour_volume_aggregate.aggregate.sum.amount_1 : 0;
  const yesterdayVolume2 = yesterdayVolume ? yesterdayVolume.pool_hour_volume_aggregate.aggregate.sum.amount_2 : 0;

  const volumeDifference1 = todayVolume1 > 0 && yesterdayVolume1 > 0 ? (todayVolume1 - yesterdayVolume1) / yesterdayVolume1 * 100 : 0;
  const volumeDifference2 = todayVolume2 > 0 && yesterdayVolume2 > 0 ? (todayVolume2 - yesterdayVolume2) / yesterdayVolume2 * 100 : 0;

  // Fee
  const fee1 = feesData && decimal1 !== 1
    ? formatAmount(feesData.pool_hour_fee_aggregate.aggregate.sum.fee_1 || 0, decimal1)
    : '-';
  const fee2 = feesData && decimal1 !== 1
    ? formatAmount(feesData.pool_hour_fee_aggregate.aggregate.sum.fee_2 || 0, decimal2)
    : '-';

  return (
    <>
      <MT size="2" />
      <Card.Card>
        <div className="d-flex flex-column">
          <BoldText size={1.2}>TVL</BoldText>
          <BoldText size={1.6}>{totalSupply}</BoldText>
          <ColorText color={totalSupplyPercentage < 0 ? 'danger' : 'success'} size={1}>
            {totalSupplyPercentage.toFixed(3)}
            {' '}
            %
          </ColorText>
        </div>
      </Card.Card>

      <MT size="2" />
      <Card.Card>
        <BoldText size={1.2}>Total Tokens Locked</BoldText>
        <MT size="2" />
        <InfoLine
          icon={icon1}
          symbol={symbol1}
          amount={reserved1}
        />

        <MT size="1" />
        <InfoLine
          icon={icon2}
          symbol={symbol2}
          amount={reserved2}
        />
      </Card.Card>
      <MT size="2" />
      <Card.Card>
        <BoldText size={1.2}>Volume 24h</BoldText>

        <InfoPercentageLine
          icon={icon1}
          symbol={symbol1}
          amount={formatAmount(todayVolume1 || 0, decimal1)}
          percentage={volumeDifference1}
        />

        <MT size="1" />
        <InfoPercentageLine
          icon={icon2}
          symbol={symbol2}
          amount={formatAmount(todayVolume2 || 0, decimal2)}
          percentage={volumeDifference2}
        />
      </Card.Card>

      <MT size="2" />
      <Card.Card>
        <BoldText size={1.2}>Fees 24h</BoldText>
        <InfoLine
          icon={icon1}
          symbol={symbol1}
          amount={fee1}
        />
        <MT size="1" />
        <InfoLine
          icon={icon2}
          symbol={symbol2}
          amount={fee2}
        />
      </Card.Card>
    </>
  );
};
