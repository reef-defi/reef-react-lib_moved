import BigNumber from 'bignumber.js';
import { AddressToNumber, LastPoolReserves, Token } from '../state';
import { REEF_ADDRESS } from '../utils';

const emptyMatrix = (
  width: number,
  height: number,
  defaultValue = 0,
): number[][] => Array(height)
  .fill(undefined)
  .map(() => Array(width).fill(defaultValue));

const dot = (matrix: number[][], vector: number[]): number[] => matrix.map((row) => row.reduce((acc, current, index) => acc + current * vector[index], 0));

const createTokenPositions = (tokens: Token[]): AddressToNumber<number> => tokens.reduce(
  (prev, curr, index) => ({ ...prev, [curr.address]: index }),
  {},
);

const findVerifiedPools = (
  pools: LastPoolReserves[],
  tokens: Token[],
): LastPoolReserves[] => pools.filter(
  ({ token_1, token_2 }) => tokens.find((token) => token.address === token_1) !== undefined
      && tokens.find((token) => token.address === token_2) !== undefined,
);

const findPoolTokens = (pools: LastPoolReserves[], tokens: Token[]): Token[] => tokens.filter((token) => pools.find(
  ({ token_1, token_2 }) => token.address === token_1 || token.address === token_2,
));

// const normalizeMatrixByNodeDegree = (matrix: number[][]): number[][] => {
//   const matrixRowSum = matrix.map((row) => row.reduce((acc, col) => acc + (col === 0 ? 0 : 1), 0));
//   return matrix.map((row, index) => row.map((col) => col / matrixRowSum[index]));
// };

const extractTokenPrices = (tokens: Token[], priceVector: number[], tokenPosition: AddressToNumber<number>): AddressToNumber<number> => tokens.reduce(
  (prev, curr) => ({
    ...prev,
    [curr.address]: priceVector[tokenPosition[curr.address]],
  }),
  {},
);

export const estimatePrice = (
  tokens: Token[],
  pools: LastPoolReserves[],
  reefPrice: number,
): AddressToNumber<number> => {
  if (tokens.length === 0 || pools.length === 0) {
    return {};
  }
  const verifiedPools = findVerifiedPools(pools, tokens);
  const poolTokens = findPoolTokens(verifiedPools, tokens);

  let priceVector = emptyMatrix(poolTokens.length, 1, 0)[0];
  let ratioMatrix = emptyMatrix(poolTokens.length, poolTokens.length, 0);

  // Defining token positions from current array
  const tokenPosition = createTokenPositions(poolTokens);
  const reefTokenPointer = tokenPosition[REEF_ADDRESS];

  // Setting reserved matrix
  verifiedPools.forEach(({    reserved_1, reserved_2, token_1, token_2,
  }) => {
    const position1 = tokenPosition[token_1];
    const position2 = tokenPosition[token_2];

    ratioMatrix[position1][position2] = new BigNumber(reserved_2)
      .div(reserved_1)
      .toNumber();
    ratioMatrix[position2][position1] = new BigNumber(reserved_1)
      .div(reserved_2)
      .toNumber();
  });

  // Normalize ratios by token degree (number of pools token is present)
  // One other option is to have weighed matrix normalization
  // where you would calculate the distribution by token ouput reserves (token_1 -> reserve_1)
  // Problem for this principle is that there is a change to completly discard some tokens
  // I.E.
  // Pool1 (t1-t2): (1e+32, 1e+32)
  // Pool2 (t1-t3): (1e+22, 1e+22)
  // Here the distribution of pool2 is almost non-existing
  // TODO When using multiple tokens to estimate price normalize ratios with belows call
  // ratioMatrix = normalizeMatrixByNodeDegree(ratioMatrix);

  // Setting initial reef token price
  // Eventually we will change this to link stabil coins, where price is 1
  priceVector[reefTokenPointer] = reefPrice;

  priceVector = dot(ratioMatrix, priceVector);
  // Setting locked price of reef token
  priceVector[reefTokenPointer] = reefPrice;

  // Iterate for other calculations
  // for (let iter = 0; iter < 50; iter += 1) {
  // }

  return extractTokenPrices(poolTokens, priceVector, tokenPosition);
};
