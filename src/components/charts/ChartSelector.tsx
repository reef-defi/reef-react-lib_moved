import React, { useState } from 'react';
import { BasicPoolInfo } from '../../state/pool';
import FeeChart from './FeeChart';
import TokenCandlestickChart from './TokenCandlestickChart';
import TVLChart from './TVLChart';
import VolumeChart from './VolumeChart';

type ChartSwitch = 'Token 1' | 'Token 2' | 'Volume' | 'TVL' | 'Fee';

interface SelectedButton {
  name: ChartSwitch;
  selected: ChartSwitch;
  onClick: (name: ChartSwitch) => void;
}

const SelectButton: React.FC<SelectedButton> = ({ name, onClick, selected }): JSX.Element => (
  <button
    type="button"
    className={`btn btn${
      selected === name ? '' : '-outline'
    }-secondary`}
    onClick={() => onClick(name)}
  >
    {name}
  </button>
);

export const ChartSelector = (pool: BasicPoolInfo): JSX.Element => {
  const [chart, setChart] = useState<ChartSwitch>('Token 1');
  const {
    address,
    token1,
    token2,
    decimal1,
    decimal2,
    symbol1,
    symbol2,
  } = pool;
  return (
    <div>
      <div className="d-flex justify-content-end mt-1 me-1">
        <div className="btn-group">
          <SelectButton name="Token 1" onClick={setChart} selected={chart} />
          <SelectButton name="Token 2" onClick={setChart} selected={chart} />
          <SelectButton name="TVL" onClick={setChart} selected={chart} />
          <SelectButton name="Volume" onClick={setChart} selected={chart} />
          <SelectButton name="Fee" onClick={setChart} selected={chart} />
        </div>
      </div>
      <div className="d-flex h-100">
        {chart === 'Token 1' && (
          <TokenCandlestickChart address={address} whichToken={1} />
        )}
        {chart === 'Token 2' && (
          <TokenCandlestickChart address={address} whichToken={2} />
        )}
        {chart === 'TVL' && <TVLChart address={address} />}
        {chart === 'Volume' && (
          <VolumeChart
            address={address}
            token1={token1}
            token2={token2}
            decimal1={decimal1}
            decimal2={decimal2}
            symbol1={symbol1}
            symbol2={symbol2}
          />
        )}
        {chart === 'Fee' && (
          <FeeChart
            address={address}
            token1={token1}
            token2={token2}
            decimal1={decimal1}
            decimal2={decimal2}
            symbol1={symbol1}
            symbol2={symbol2}
          />
        )}
      </div>
    </div>
  );
};
