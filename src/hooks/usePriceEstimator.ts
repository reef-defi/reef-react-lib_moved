import BigNumber from "bignumber.js";
import { LastPoolReserves, Token } from "../state";
import { REEF_ADDRESS } from "../utils";

const emptyMatrix = (width: number, height: number, defaultValue=0): number[][] =>
  Array(height).fill(undefined).map(() => Array(width).fill(defaultValue));

const dot = (matrix: number[][], vector: number[]): number[] =>
  matrix.map((row) =>
    row.reduce((acc, current, index) => acc + current * vector[index], 0)
  );

interface AddressToNumber {
  [address: string]: number;
}

const createTokenPositions = (tokens: Token[]): AddressToNumber =>
  tokens.reduce(
    (prev, curr, index) => ({ ...prev, [`${curr.address.toLowerCase()}`]: index }),
    {}
  );

export const estimatePrice = (
  tokens: Token[],
  pools: LastPoolReserves[],
  reefPrice: number
) => {
  if (tokens.length === 0 || pools.length === 0) {
    return {};
  }
  const verifiedPools = pools
  .filter(({token_1, token_2}) =>
    tokens.find((token) => token.address.toLowerCase() === token_1.toLowerCase()) !== undefined &&
    tokens.find((token) => token.address.toLowerCase() === token_2.toLowerCase()) !== undefined
  )
  const poolTokens = tokens
    .filter((token) => verifiedPools.find(({token_1, token_2}) =>
      token.address.toLowerCase() === token_1.toLowerCase() ||
      token.address.toLowerCase() === token_2.toLowerCase())
    );

  let priceVector = emptyMatrix(poolTokens.length, 1, 0)[0];
  let ratioMatrix = emptyMatrix(poolTokens.length, poolTokens.length, 0);

  // Defining token positions from current array
  const tokenPosition = createTokenPositions(poolTokens);
  console.log(tokenPosition)
  const reefTokenPointer = tokenPosition[REEF_ADDRESS];
  console.log(reefTokenPointer)
  console.log(poolTokens)
  console.log(verifiedPools)
  // Setting reserved matrix
  verifiedPools.forEach(
    ({
      reserved_1,
      reserved_2,
      token_1,
      token_2,
    }) => {
      const position1 = tokenPosition[token_1.toLowerCase()];
      const position2 = tokenPosition[token_2.toLowerCase()];
      // If position of some token does not exist
      // that means token is not verified and therefore we skip it
      if (position1 === undefined) {
        throw new Error("Position does not exist for token: " + token_1)
      }
      if (position2 === undefined) {
        throw new Error("Position does not exist for token: " + token_2)
      }
      ratioMatrix[position1][position2] = new BigNumber(reserved_2).div(reserved_1).toNumber();
      ratioMatrix[position2][position1] = new BigNumber(reserved_1).div(reserved_2).toNumber();
    }
  );
  console.log(ratioMatrix)
  priceVector[reefTokenPointer] = reefPrice;
  for (let iter = 0; iter < 1000; iter ++) {
    // Setting locked price of reef token
    priceVector = dot(ratioMatrix, priceVector);
    priceVector[reefTokenPointer] = reefPrice;
  }
  console.log(priceVector)
  return {} // tokens.reduce((prev, curr) => ({...prev, [curr.address]: priceVector[tokenPosition[curr.address]]}), {})
};
