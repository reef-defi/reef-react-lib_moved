import { BigNumber, utils } from 'ethers';
import { DataProgress, DataWithProgress, isDataSet } from './dataWithProgress';
import {
  Pool, reefTokenWithAmount, Token, TokenWithAmount,
} from '../state';
import { toDecimalPlaces } from './math';
import { REEF_ADDRESS } from './utils';

const { parseUnits, formatEther } = utils;

const getReefTokenPoolReserves = (
  reefTokenPool: Pool,
  reefAddress: string,
): { reefReserve: number; tokenReserve: number } => {
  let reefReserve: number;
  let tokenReserve: number;
  if (
    reefTokenPool.token1.address.toLowerCase() === reefAddress.toLowerCase()
  ) {
    reefReserve = parseInt(reefTokenPool.reserve1, 10);
    tokenReserve = parseInt(reefTokenPool.reserve2, 10);
  } else {
    reefReserve = parseInt(reefTokenPool.reserve2, 10);
    tokenReserve = parseInt(reefTokenPool.reserve1, 10);
  }
  return { reefReserve, tokenReserve };
};
const findReefTokenPool = (
  pools: Pool[],
  reefAddress: string,
  token: Token,
): Pool | undefined => pools.find(
  (pool) => (pool.token1.address.toLowerCase() === reefAddress.toLowerCase()
        && pool.token2.address.toLowerCase() === token.address.toLowerCase())
      || (pool.token2.address.toLowerCase() === reefAddress.toLowerCase()
        && pool.token1.address.toLowerCase() === token.address.toLowerCase()),
);

export const calculateTokenPrice = (
  token: Token,
  pools: Pool[],
  reefPrice: DataWithProgress<number>,
): DataWithProgress<number> => {
  if (!isDataSet(reefPrice)) {
    return reefPrice;
  }
  const { address: reefAddress } = reefTokenWithAmount();
  let ratio: number;
  if (token.address.toLowerCase() !== reefAddress.toLowerCase()) {
    const reefTokenPool = findReefTokenPool(pools, reefAddress, token);
    if (reefTokenPool) {
      const { reefReserve, tokenReserve } = getReefTokenPoolReserves(
        reefTokenPool,
        reefAddress,
      );
      ratio = reefReserve / tokenReserve;
      return ratio * (reefPrice as number);
    }
    return DataProgress.NO_DATA;
  }
  return reefPrice || DataProgress.NO_DATA;
};

export const calculateBalanceValue = ({
  price,
  balance,
}:
  | { price: DataWithProgress<number>; balance: BigNumber }
  | TokenWithAmount): DataWithProgress<number> => {
  if (!isDataSet(price)) {
    return price;
  }
  const priceStr = price.toString();
  const priceBN = BigNumber.from(parseUnits(toDecimalPlaces(priceStr, 18)));
  const balanceFixed = parseInt(formatEther(balance.toString()), 10);
  return parseFloat(
    formatEther(priceBN.mul(BigNumber.from(balanceFixed)).toString()),
  );
};

export const toCurrencyFormat = (value: number, options = {}): string => Intl.NumberFormat(navigator.language, {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'symbol',
  ...options,
}).format(value);

const ICONS = [
  'https://app.reef.io/img/token-icons/token-icon-1.png',
  'https://app.reef.io/img/token-icons/token-icon-2.png',
  'https://app.reef.io/img/token-icons/token-icon-3.png',
  'https://app.reef.io/img/token-icons/token-icon-4.png',
  'https://app.reef.io/img/token-icons/token-icon-5.png',
  'https://app.reef.io/img/token-icons/token-icon-6.png',
  'https://app.reef.io/img/token-icons/token-icon-7.png',
  'https://app.reef.io/img/token-icons/token-icon-8.png',
  'https://app.reef.io/img/token-icons/token-icon-9.png',
]
// TODO implement with svg
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIconUrl = (address: string): string => address === REEF_ADDRESS
  ? 'https://s2.coinmarketcap.com/static/img/coins/64x64/6951.png'
  : ICONS[Math.floor(Math.random() * ICONS.length)];
