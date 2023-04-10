import React from 'react';
import { BigNumber } from 'ethers';
import { useCurrentPoolReserve, usePoolQuery } from '../../hooks';
import { ContentBetween, FullRow, ME } from '../common/Display';
import { BoldText, LeadText } from '../common/Text';
import { TokenIcon } from '../common/Icons';
import { Button } from '../common/Button';
import { formatAmount } from '../../utils/math';
import { BasicPoolInfo } from '../../state/pool';
import { PoolInfo } from './PoolInfo';
import { ChartSelector } from '../charts/ChartSelector';
import { PoolTransactions } from './PoolTransactions';
import { ApolloClient } from '@apollo/client';

type Open = (address1: string, address2: string) => void;

interface PoolPage {
  address: string;
  reefscanUrl: string;
  openTrade: Open;
  openAddLiquidity: Open;
  openRemoveLiquidity: Open;
  // This is a hack!
  // Put images inside of the lib and make appropriate loader for them which includes icons when the app loads
  getIconUrl: (address: string) => string;
  dexClient: ApolloClient<any>;
}
export const PoolPage = ({
  address, reefscanUrl, openTrade, openAddLiquidity, openRemoveLiquidity, getIconUrl, dexClient,
}: PoolPage): JSX.Element => {
  const { data: poolData } = usePoolQuery(address);
  const { data: reservesData } = useCurrentPoolReserve(address);
  // Token info
  const poolExists = poolData && poolData.pool.length > 0;
  const tokenAddress1 = poolExists
    ? poolData.pool[0].token1
    : '0x';
  const tokenAddress2 = poolExists
    ? poolData.pool[0].token2
    : '0x';
  const tokenSymbol1 = poolExists
    ? poolData.pool[0].symbol1
    : '?';
  const tokenSymbol2 = poolExists
    ? poolData.pool[0].symbol2
    : '?';
  const tokenIcon1 = poolExists
    ? getIconUrl(tokenAddress1)
    : '';
  const tokenIcon2 = poolExists
    ? getIconUrl(tokenAddress2)
    : '';

  const decimal1 = poolExists
    ? poolData.pool[0].decimal1
    : 18;
  const decimal2 = poolExists
    ? poolData.pool[0].decimal2
    : 18;

  const poolInfo: BasicPoolInfo = {
    address: address,
    decimal1,
    decimal2,
    symbol1: tokenSymbol1,
    symbol2: tokenSymbol2,
    token1: tokenAddress1,
    token2: tokenAddress2,
  };

  // Reserves
  const reserved1 = reservesData && reservesData.poolEvents.length > 0
    ? formatAmount(reservesData.poolEvents[0].reserved1, decimal1)
    : '-';
  const reserved2 = reservesData && reservesData.poolEvents.length > 0
    ? formatAmount(reservesData.poolEvents[0].reserved2, decimal2)
    : '-';

  const ratio1 = reservesData && reservesData.poolEvents.length > 0
    ? BigNumber
      .from(reservesData.poolEvents[0].reserved2.toLocaleString('fullwide', { useGrouping: false }))
      .mul(1000)
      .div(BigNumber.from(BigNumber.from(reservesData.poolEvents[0].reserved1.toLocaleString('fullwide', { useGrouping: false }))))
      .toNumber() / 1000
    : -1;

  const ratio2 = reservesData && reservesData.poolEvents.length > 0
    ? BigNumber
      .from(reservesData.poolEvents[0].reserved1.toLocaleString('fullwide', { useGrouping: false }))
      .mul(1000)
      .div(BigNumber.from(BigNumber.from(reservesData.poolEvents[0].reserved2.toLocaleString('fullwide', { useGrouping: false }))))
      .toNumber() / 1000
    : -1;

  return (

    <div className="w-100 row justify-content-center">
      <div className="col-xl-10 col-lg-10 col-md-12">
        <div className="d-flex ms-1 mb-1">
          <TokenIcon src={tokenIcon1} address={tokenAddress1} />
          <TokenIcon src={tokenIcon2} address={tokenAddress2} />
          <BoldText size={1.6}>
            {' '}
            {tokenSymbol1}
            {' '}
            /
            {' '}
            {tokenSymbol2}
          </BoldText>
        </div>

        <FullRow>
          <ContentBetween>
            <div className="d-flex my-2">
              <div className="card border-rad">
                <div className="card-body py-1">
                  <div className="d-flex">
                    <TokenIcon src={tokenIcon1} address={tokenAddress1} />
                    <ME size="1" />
                    <LeadText>
                      1
                      {tokenSymbol1}
                      {' '}
                      =
                      {ratio1 !== -1 ? ratio1.toFixed(3) : '-'}
                      {' '}
                      {tokenSymbol2}
                      {' '}
                    </LeadText>
                  </div>
                </div>
              </div>
              <ME size="1" />

              <div className="card border-rad">
                <div className="card-body py-1">
                  <div className="d-flex">
                    <TokenIcon src={tokenIcon2} address={tokenAddress2} />
                    <ME size="1" />
                    <LeadText>
                      1
                      {tokenSymbol2}
                      {' '}
                      =
                      {ratio2 !== -1 ? ratio2.toFixed(3) : '-'}
                      {' '}
                      {tokenSymbol1}
                    </LeadText>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex">
              <Button onClick={() => openTrade(tokenAddress1, tokenAddress2)}>Trade</Button>
              <ME size="1" />
              <Button onClick={() => openAddLiquidity(tokenAddress1, tokenAddress2)}>Add Liquidity</Button>
              <ME size="1" />
              <Button onClick={() => openRemoveLiquidity(tokenAddress1, tokenAddress2)}>Remove Liquidity</Button>
            </div>
          </ContentBetween>
        </FullRow>

        <div className="row mt-2">
          <div className="col-sm-12 col-md-6 col-lg-4">
            <div className="border-rad bg-grey p-3 pt-2">
              <PoolInfo
                address={address}
                decimal1={decimal1}
                decimal2={decimal2}
                symbol1={tokenSymbol1}
                symbol2={tokenSymbol2}
                icon1={tokenIcon1}
                icon2={tokenIcon2}
                reserved1={reserved1}
                reserved2={reserved2}
              />
            </div>
          </div>

          <div className="col-sm-12 col-md-6 col-lg-8">
            <div className="border-rad bg-grey p-1 h-100 m-auto mt-xs-3">
              <ChartSelector
                address={poolInfo.address}
                token1={poolInfo.token1}
                token2={poolInfo.token2}
                decimal1={poolInfo.decimal1}
                decimal2={poolInfo.decimal2}
                symbol1={poolInfo.symbol1}
                symbol2={poolInfo.symbol2}
              />
            </div>
          </div>
        </div>

        <PoolTransactions address={address} reefscanUrl={reefscanUrl} dexClient={dexClient}/>
      </div>
    </div>
  );
};

// These needs to be removed
// export default PoolPage;
