import { BigNumber, utils } from 'ethers';
import { ensure } from './utils';
import { Pool, Token, TokenWithAmount } from '../state';

const findDecimalPoint = (amount: string): number => {
  const { length } = amount;
  let index = amount.indexOf(',');
  if (index !== -1) {
    return length - index - 1;
  }
  index = amount.indexOf('.');
  if (index !== -1) {
    return length - index - 1;
  }
  return 0;
};

export const transformAmount = (decimals: number, amount: string): string => {
  if (!amount) {
    return '0'.repeat(decimals);
  }
  const addZeros = findDecimalPoint(amount);
  const cleanedAmount = amount.replaceAll(',', '').replaceAll('.', '');
  return cleanedAmount + '0'.repeat(Math.max(decimals - addZeros, 0));
};

export const assertAmount = (amount?: string): string => (!amount ? '0' : amount);

export const convert2Normal = (
  decimals: number,
  inputAmount: string,
): number => {
  const amount = '0'.repeat(decimals + 4) + assertAmount(inputAmount);
  const pointer = amount.length - decimals;
  const decimalPointer = `${amount.slice(0, pointer)}.${amount.slice(
    pointer,
    amount.length,
  )}`;
  return parseFloat(decimalPointer);
};

interface CalculateAmount {
  decimals: number;
  amount: string;
}

export const calculateAmount = ({
  decimals,
  amount,
}: CalculateAmount): string => BigNumber.from(transformAmount(decimals, assertAmount(amount))).toString();

export const calculateAmountWithPercentage = (
  { amount: oldAmount, decimals }: CalculateAmount,
  percentage: number,
): string => {
  if (!oldAmount) {
    return '0';
  }
  const amount = parseFloat(assertAmount(oldAmount)) * (1 - percentage / 100);
  return calculateAmount({ amount: amount.toString(), decimals });
};

export const minimumRecieveAmount = (
  { amount }: CalculateAmount,
  percentage: number,
): number => (parseFloat(assertAmount(amount)) * (100 - percentage)) / 100;

interface CalculateUsdAmount extends CalculateAmount {
  price: number;
}
export const calculateUsdAmount = ({
  amount,
  price,
}: CalculateUsdAmount): number => parseFloat(assertAmount(amount)) * price;

export const calculateDeadline = (minutes: number): number => Date.now() + minutes * 60 * 1000;

export const calculateBalance = ({ balance, decimals }: Token): string => transformAmount(decimals, balance.toString());

export const calculatePoolSupply = (
  token1: TokenWithAmount,
  token2: TokenWithAmount,
  pool?: Pool,
): number => {
  const amount1 = parseFloat(assertAmount(token1.amount));
  const amount2 = parseFloat(assertAmount(token2.amount));

  if (!pool) {
    return Math.sqrt(amount1 * amount2) - 0.000000000000001;
  }
  const totalSupply = convert2Normal(18, pool.totalSupply);
  const reserve1 = convert2Normal(token1.decimals, pool.reserve1);
  const reserve2 = convert2Normal(token2.decimals, pool.reserve2);

  return Math.min(
    (amount1 * totalSupply) / reserve1,
    (amount2 * totalSupply) / reserve2,
  );
};

export const removeSupply = (
  percentage: number,
  supply?: string,
  decimals?: number,
): number => (supply && decimals
  ? (convert2Normal(decimals, supply) * percentage) / 100
  : 0);

export const removePoolTokenShare = (
  percentage: number,
  token?: Token,
): number => removeSupply(percentage, token?.balance.toString(), token?.decimals);

export const removeUserPoolSupply = (percentage: number, pool?: Pool): number => removeSupply(percentage, pool?.userPoolBalance, 18);

export const convertAmount = (
  amount: string,
  fromPrice: number,
  toPrice: number,
): number => (parseFloat(assertAmount(amount)) / fromPrice) * toPrice;

export const calculatePoolRatio = (pool?: Pool, first = true): number => {
  if (!pool) {
    return 0;
  }
  const amount1 = convert2Normal(
    pool.token1.decimals,
    pool.token1.balance.toString(),
  );
  const amount2 = convert2Normal(
    pool.token2.decimals,
    pool.token2.balance.toString(),
  );
  return first ? amount1 / amount2 : amount2 / amount1;
};

export const calculatePoolShare = (pool?: Pool): number => {
  if (!pool) {
    return 0;
  }
  const totalSupply = convert2Normal(18, pool.totalSupply);
  const userSupply = convert2Normal(18, pool.userPoolBalance);
  return (userSupply / totalSupply) * 100;
};

interface ToBalance {
  balance: BigNumber;
  decimals: number;
}

interface ShowBalance extends ToBalance {
  name: string;
  symbol?: string;
}

export const showBalance = (
  {
    decimals, balance, name, symbol,
  }: ShowBalance,
  decimalPoints = 4,
): string => {
  if (!balance) {
    return '';
  }
  const balanceStr = balance.toString();
  if (balanceStr === '0') {
    return `${balanceStr} ${symbol || name}`;
  }
  const headLength = Math.max(balanceStr.length - decimals, 0);
  const tailLength = Math.max(headLength + decimalPoints, 0);
  const head = balanceStr.length < decimals ? '0' : balanceStr.slice(0, headLength);
  let tail = balanceStr.slice(headLength, tailLength);
  if (tail.search(/[^0]+/gm) === -1) {
    tail = '';
  }
  return tail.length
    ? `${head}.${tail} ${symbol || name}`
    : `${head} ${symbol || name}`;
};

export const toBalance = ({ balance, decimals }: ToBalance): number => {
  const num = balance.toString();
  const diff = num.length - decimals;
  const fullNum = diff <= 0 ? '0' : num.slice(0, diff);
  return parseFloat(`${fullNum}.${num.slice(diff, num.length)}`);
};

export const toUnits = ({ balance, decimals }: ToBalance): string => utils.formatUnits(balance.toString(), decimals);

export const toDecimalPlaces = (
  value: string,
  maxDecimalPlaces: number,
): string => {
  const decimalDelim = value.indexOf('.');
  if (
    !value
    || decimalDelim < 1
    || value.length - decimalDelim < maxDecimalPlaces
  ) {
    return value;
  }
  return value.substring(0, decimalDelim + 1 + maxDecimalPlaces);
};

export const poolRatio = ({ token1, token2 }: Pool): number => toBalance(token2) / toBalance(token1);

export const ensureAmount = (token: TokenWithAmount): void => ensure(
  BigNumber.from(calculateAmount(token)).lte(token.balance),
  `Insufficient ${token.name} balance`,
);

export const getOutputAmount = (sell: TokenWithAmount, pool: Pool): number => {
  const inputAmount = parseFloat(assertAmount(sell.amount)) * 997;

  const inputReserve = convert2Normal(pool.token2.decimals, pool.reserve2);
  const outputReserve = convert2Normal(pool.token1.decimals, pool.reserve1);

  const numerator = inputAmount * outputReserve;
  const denominator = inputReserve * 1000 + inputAmount;

  return numerator / denominator;
};

export const getInputAmount = (buy: TokenWithAmount, pool: Pool): number => {
  const outputAmount = parseFloat(assertAmount(buy.amount));

  const inputReserve = convert2Normal(pool.token2.decimals, pool.reserve2);
  const outputReserve = convert2Normal(pool.token1.decimals, pool.reserve1);

  const numerator = inputReserve * outputAmount * 1000;
  const denominator = (outputReserve - outputAmount) * 997;

  return numerator / denominator;
};

export const calculateImpactPercentage = (
  sell: TokenWithAmount,
  buy: TokenWithAmount,
): number => {
  const buyUsd = calculateUsdAmount(buy);
  const sellUsd = calculateUsdAmount(sell);

  if (sellUsd === 0) {
    return 0;
  }

  return (buyUsd - sellUsd) / sellUsd;
};

export const getHashSumLastNr = (address: string): number => {
  const summ = address
    .split('')
    .reduce((sum, ch) => {
      const nr = parseInt(ch, 10);
      if (!Number.isNaN(nr)) {
        return sum + nr;
      }
      return sum;
    }, 0)
    .toString(10);

  return parseInt(summ.substring(summ.length - 1), 10);
};
