import React, { useMemo, useState } from 'react';
import { usePoolCount, usePools } from '../../hooks';
import { formatAmount } from '../../utils/math';
import { Button, EmptyButton } from '../common/Button';
import { Card } from '../common/Card';
import { ContentBetween, MT } from '../common/Display';
import { Input } from '../common/Input';
import { Loading } from '../common/Loading';
import { BoldText } from '../common/Text';

interface PoolList {
  openAddLiquidity: () => void;
  openPool: (address: string) => void;
}

export const PoolList = ({ openAddLiquidity, openPool }: PoolList): JSX.Element => {
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);

  const offset = pageIndex * 10;
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const oda = useMemo(() => new Date(oneDayAgo).toISOString(), []);

  const { data, loading } = usePools(oda, offset, search);
  const { data: poolAggregationData } = usePoolCount(search);

  const maxPage = poolAggregationData
    ? Math.ceil(poolAggregationData.verified_pool_aggregate.aggregate.count / 10)
    : 1;

  const nextPage = (): void => setPageIndex(Math.min(maxPage - 1, pageIndex + 1));
  const prevPage = (): void => setPageIndex(Math.max(0, pageIndex - 1));

  const pools = data
    ? data.verified_pool.map(({
      address, supply, symbol_1, decimal_1, decimal_2, symbol_2, volume_aggregate: { aggregate: { sum: { amount_1, amount_2 } } },
    }, index) => (
      <tr key={address} onClick={() => openPool(address)} className="cursor-pointer">
        <td className="fs-5">{offset + index + 1}</td>
        <td className="fs-5">
          {symbol_1}
          /
          {symbol_2}
        </td>
        <td className="fs-5 text-end">{supply.length > 0 ? formatAmount(supply[0].total_supply, 18) : 0}</td>
        <td className="fs-5 text-end">{formatAmount(amount_1 || 0, decimal_1)}</td>
        <td className="fs-5 text-end">{formatAmount(amount_2 || 0, decimal_2)}</td>
      </tr>
    ))
    : [];

  return (
    <>
      <ContentBetween>
        <BoldText size={1.6}>Pools</BoldText>
        <Input
          value={search}
          onChange={setSearch}
          className="w-50 fs-5"
          placeholder="Search pool by address or token name"
        />
        <Button onClick={openAddLiquidity}>Add liquidity</Button>
      </ContentBetween>

      <MT size="2" />
      <Card>
        { loading
          ? <Loading />
          : (
            <div className="table-responsive-sm">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col" className="text-start fs-5 w-25">Pool</th>
                    <th scope="col" className="text-end fs-5">TVL</th>
                    <th scope="col" className="text-end fs-5">Volme1 24h</th>
                    <th scope="col" className="text-end pe-4 fs-5">Volume2 24h</th>
                  </tr>
                </thead>
                <tbody>
                  { !loading
                    ? pools
                    : <Loading />}
                </tbody>
              </table>
            </div>
          )}
        <MT size="3" />
        <div className="d-flex justify-content-center">
          <div>
            <EmptyButton onClick={prevPage}>{'<-'}</EmptyButton>
            <span className="my-auto">
              Page
              {' '}
              {pageIndex + 1}
              {' '}
              of
              {' '}
              {maxPage}
            </span>
            <EmptyButton onClick={nextPage}>{'->'}</EmptyButton>
          </div>
        </div>
      </Card>
    </>
  );
};
