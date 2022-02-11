import { Token, TokenWithAmount } from '../state/token';
import { reloadSignersSubj } from './accountState';
import { UpdateAction } from './updateCtxUtil';
import { Pool } from '../state';
import { calculateTokenPrice, TxStatusUpdate } from '../utils';

export const combineTokensDistinct = ([tokens1, tokens2]:[Token[], Token[]]): Token[] => {
  const combinedT = [...tokens1];
  tokens2.forEach((vT: Token) => (!combinedT.some((cT) => cT.address === vT.address) ? combinedT.push(vT) : null));
  return combinedT;
};

export const toTokensWithPrice = ([tokens, reefPrice, pools]:[Token[], number, Pool[]]): TokenWithAmount[] => tokens.map((token) => ({ ...token, price: calculateTokenPrice(token, pools, reefPrice) } as TokenWithAmount));

export const onTxUpdateResetSigners = (txUpdateData: TxStatusUpdate, updateActions: UpdateAction[]): void => {
  if (txUpdateData?.isInBlock || txUpdateData?.error) {
    const delay = txUpdateData.txTypeEvm ? 2000 : 0;
    setTimeout(() => reloadSignersSubj.next({ updateActions }), delay);
  }
};

/*
export const zenToRx = <T>(zenObservable: ZenObservable<T>): Observable<T> => new Observable(
  (observer) => zenObservable.subscribe(observer),
);
*/
