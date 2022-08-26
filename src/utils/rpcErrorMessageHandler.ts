const chainErrors: { [key: string]: string } = {
  INVALID_TO: 'Invalid address.',
  EXPIRED: 'Transaction time expired.',
  PAIR_EXISTS: 'Pool pair already exist.',
  ZERO_ADDRESS: 'Zero address was passed.',
  IDENTICAL_ADDRESSES: 'Equal addresses picked.',
  INSUFFICIENT_A_AMOUNT: 'Excessive first amount.',
  INSUFFICIENT_B_AMOUNT: 'Excessive second amount.',
  INSUFFICIENT_LIQUIDITY: 'Insufficient liquidity.',
  INSUFFICIENT_INPUT_AMOUNT: 'Insufficient sell amount.',
  INSUFFICIENT_OUTPUT_AMOUNT:
    'Insufficient buying amount. Incresse slippage tolerance or lower buying amount.',
  INSUFFICIENT_LIQUIDITY_MINTED: 'Insufficient liquidity minted.',
  INSUFFICIENT_LIQUIDITY_BURNED: 'Insufficient liquidity burned.',
  InsufficientBalance: 'Account Reef token balance is too low.',
  LiquidityRestrictions: 'Insufficient pool liquidity.',
  TRANSFER_FAILED: 'Token transfer failed.',
};

export const errorHandler = (message: string): string => {
  if (message.includes('ReefswapV2: K')) {
    return 'Pool K value can not be aligned with desired amounts. Try decreasing swap amount or increase slippage tolerance.';
  }
  if (message.includes('Module { index: 6, error: 2, message: None }')) {
    return 'Insufficient Reef amount, get more tokens.';
  }
  const errorKey = Object.keys(chainErrors).find((key) => message.includes(key));

  if (!errorKey) {
    return message;
  }

  return chainErrors[errorKey];
};
