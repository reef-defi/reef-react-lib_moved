import React, { useState } from 'react';
import { BasePoolTransactionTypes, TransactionTypes } from '../../graphql/pools';
import { usePoolTransactionCountSubscription, usePoolTransactionSubscription } from '../../hooks';
import { formatAgoDate, formatAmount, shortAddress } from '../../utils';
import { Card } from '../common';
import { EmptyButton } from '../common/Button';
import { MT } from '../common/Display';
import { Loading } from '../common/Loading';
import { BoldText } from '../common/Text';

interface PoolTransactions {
  address?: string;
  reefscanFrontendUrl: string;
}

export const PoolTransactions = ({ address, reefscanFrontendUrl } : PoolTransactions): JSX.Element => {
  const [pageIndex, setPageIndex] = useState(0);
  const [type, setType] = useState<TransactionTypes>('All');

  const { loading: loadingTransactions, data: transactionData } = usePoolTransactionSubscription(address, type, pageIndex, 10);
  const { data } = usePoolTransactionCountSubscription(address, type);

  const maxPage = data
    ? Math.ceil(data.verified_pool_event_aggregate.aggregate.count / 10)
    : 1;

  const nextPage = (): void => setPageIndex(Math.min(maxPage - 1, pageIndex + 1));
  const prevPage = (): void => setPageIndex(Math.max(0, pageIndex - 1));

  const description = (poolType: BasePoolTransactionTypes, amount_1: number, tokenSymbol1: string, tokenSymbol2: string): string => {
    switch (poolType) {
      case 'Swap': return `${type} ${amount_1 > 0 ? tokenSymbol1 : tokenSymbol2} for ${amount_1 > 0 ? tokenSymbol2 : tokenSymbol1}`;
      case 'Burn': return `Remove ${tokenSymbol1} and ${tokenSymbol2}`;
      case 'Mint': return `Add ${tokenSymbol1} and ${tokenSymbol2}`;
      default: return '';
    }
  };

  const transactionView = !loadingTransactions && transactionData
    ? transactionData.verified_pool_event
      .map(({
        amount_1, amount_2, timestamp, to_address, type: transactionType, amount_in_1, amount_in_2, evm_event: { event: { id, extrinsic: { hash, signer } } }, pool: { token_contract_1, token_contract_2 },
      }) => {
        const symbol1 = token_contract_1.verified_contract?.contract_data.symbol || '?';
        const decimal1 = token_contract_1.verified_contract?.contract_data.decimals || 18;
        const symbol2 = token_contract_2.verified_contract?.contract_data.symbol || '?';
        const decimal2 = token_contract_2.verified_contract?.contract_data.decimals || 18;

        return (
          <tr key={id}>
            <td className="fs-5"><a href={`${reefscanFrontendUrl}/extrinsic/${hash}`}>{description(transactionType, amount_1, symbol1, symbol2)}</a></td>
            <td className="text-end fs-5 d-none d-md-table-cell d-lg-table-cell d-xl-table-cell">
              {formatAmount(amount_1 > 0 ? amount_1 : amount_in_1, decimal1)}
              {' '}
              {symbol1}
            </td>
            <td className="text-end fs-5 d-none d-lg-table-cell d-xl-table-cell">
              {formatAmount(amount_2 > 0 ? amount_2 : amount_in_2, decimal2)}
              {' '}
              {symbol2}
            </td>
            <td className="text-end fs-5 d-none d-xl-table-cell"><a href={`${reefscanFrontendUrl}/account/${to_address || signer}`}>{shortAddress(to_address || signer)}</a></td>
            <td className="text-end pe-4 fs-5">{formatAgoDate(timestamp)}</td>
          </tr>
        );
      })
    : [];

  return (
    <div>
      <MT size="4" />
      <BoldText size={1.6}>Transactions</BoldText>
      <MT size="2" />
      <Card.Card>
        {
          loadingTransactions
            ? <Loading />
            : (
              <div>
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th scope="col">
                        <a className={`fs-5 mx-1 text-decoration-none ${type === 'All' ? 'selected-topic' : 'unselected-topic'}`} role="button" type="button" onClick={() => setType('All')}>All</a>
                        <a className={`fs-5 mx-1 text-decoration-none ${type === 'Swap' ? 'selected-topic' : 'unselected-topic'}`} role="button" type="button" onClick={() => setType('Swap')}>Swaps</a>
                        <a className={`fs-5 mx-1 text-decoration-none ${type === 'Mint' ? 'selected-topic' : 'unselected-topic'}`} role="button" type="button" onClick={() => setType('Mint')}>Adds</a>
                        <a className={`fs-5 mx-1 text-decoration-none ${type === 'Burn' ? 'selected-topic' : 'unselected-topic'}`} role="button" type="button" onClick={() => setType('Burn')}>Removes</a>
                      </th>
                      <th scope="col" className="text-end fs-5 d-none d-md-table-cell d-lg-table-cell d-xl-table-cell">Token Amount</th>
                      <th scope="col" className="text-end fs-5 d-none d-lg-table-cell d-xl-table-cell">Token Amount</th>
                      <th scope="col" className="text-end fs-5 d-none d-xl-table-cell">Account</th>
                      <th scope="col" className="text-end pe-4 fs-5">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    { transactionView }
                  </tbody>
                </table>
                <div className="d-flex justify-content-center">
                  <div>
                    <EmptyButton onClick={() => setPageIndex(0)}>{'<<'}</EmptyButton>
                    <EmptyButton onClick={prevPage}>{'<'}</EmptyButton>
                    Page
                    {' '}
                    {pageIndex + 1}
                    {' '}
                    of
                    {' '}
                    {maxPage}
                    <EmptyButton onClick={nextPage}>{'>'}</EmptyButton>
                    <EmptyButton onClick={() => setPageIndex(maxPage - 1)}>{'>>'}</EmptyButton>
                  </div>
                </div>
              </div>
            )
        }
      </Card.Card>
    </div>
  );
};
