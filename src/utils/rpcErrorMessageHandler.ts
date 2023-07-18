import { FrameSystemEventRecord } from '@polkadot/types/lookup';
// export interface ProcessModule {
//   process(accountsManager: AccountManager): Promise<void>;
//   save(): Promise<void>;
// }
export type Event = FrameSystemEventRecord;

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
    'Insufficient buying amount. Increase slippage tolerance or lower buying amount.',
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
  if (
    message.includes('Module { index: 6, error: 2, message: None }')
    || message.includes('{"module":{"index":6,"error":2}}')
  ) {
    return 'Insufficient Reef amount, get more tokens.';
  }
  const errorKey = Object.keys(chainErrors).find((key) => message.includes(key));

  if (!errorKey) {
    return message;
  }

  return chainErrors[errorKey];
};

const hexToAscii = (str1: string): string => {
  const hex = str1.toString();
  let str = '';
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
};

export const captureError = (events: Event[]): string|undefined => {
  for (const event of events) {
    const eventCompression = `${event.event.section.toString()}.${event.event.method.toString()}`;
    if (eventCompression === 'evm.ExecutedFailed') {
      const eventData = (event.event.data.toJSON() as any[]);
      let message = eventData[eventData.length - 2];
      if (typeof message === 'string' || message instanceof String) {
        message = hexToAscii(message.substring(138));
      } else {
        message = JSON.stringify(message);
      }
      return message;
    }
  }
  return undefined;
};
