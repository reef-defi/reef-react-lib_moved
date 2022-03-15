import { ApolloClient, gql, SubscriptionOptions } from '@apollo/client';
import { utils } from 'ethers';
import {
  from, map, Observable, of, scan, shareReplay, switchMap,
} from 'rxjs';
import { apolloClientInstance$, zenToRx } from './apollo';

const getGqlContractEventsQuery = (
  contractAddress: string,
  methodSignature?: string | null,
  fromBlockId?: number,
  toBlockId?: number,
): SubscriptionOptions => {
  const EVM_EVENT_GQL = gql`
    query evmEvent(
      $address: String_comparison_exp!
      $blockId: bigint_comparison_exp!
      $topic0: String_comparison_exp
    ) {
      evm_event(
        order_by: [
          { block_id: desc }
          { extrinsic_index: desc }
          { event_index: desc }
        ]
        where: {
          _and: [
            { contract_address: $address }
            { topic_0: $topic0 }
            { method: { _eq: "Log" } }
            { block_id: $blockId }
          ]
        }
      ) {
        contract_address
        data_parsed
        data_raw
        topic_0
        topic_1
        topic_2
        topic_3
        block_id
        extrinsic_index
        event_index
      }
    }
  `;
  return {
    query: EVM_EVENT_GQL,
    variables: {
      address: { _eq: contractAddress },
      topic0: methodSignature
        ? { _eq: utils.keccak256(utils.toUtf8Bytes(methodSignature)) }
        : {},
      blockId: toBlockId ? { _gte: fromBlockId, _lte: toBlockId } : { _eq: fromBlockId },
    },
    fetchPolicy: 'network-only',
  };
};

const getGqlLastFinalizedBlock = (): SubscriptionOptions => {
  const FINALISED_BLOCK_GQL = gql`
    subscription finalisedBlock {
      block(order_by: {id: desc}, limit: 1, where: {finalized: {_eq: true}}) {
        id
      }
    }
  `;
  return {
    query: FINALISED_BLOCK_GQL,
    variables: {},
    fetchPolicy: 'network-only',
  };
};

export function getEvmEvents$(contractAddress: string, methodSignature?: string, fromBlockId?: number, toBlockId?: number): Observable<{ fromBlockId:number, toBlockId:number, evmEvents:any[] }|null> {
  if (!contractAddress) {
    console.warn('getEvmEvents$ expects contractAddress');
    return of(null);
  }
  if (!fromBlockId) {
    return apolloClientInstance$.pipe(
      switchMap((apolloClient: ApolloClient<any>) => zenToRx(apolloClient.subscribe(getGqlLastFinalizedBlock())).pipe(
        scan((state, res: any) => {
          const block = res?.data?.block?.length ? res.data.block[0] : null;
          if (!block) {
            console.warn('getEvmEvents$ NO FINALISED BLOCK RESULT', res);
            return state;
          }
          const newBlockId = block.id;
          const diff = state.prevBlockId ? newBlockId - state.prevBlockId : 1;
          let fromBlockId = newBlockId;
          let toBlockId;
          if (diff > 1 && state.prevBlockId) {
            toBlockId = newBlockId;
            fromBlockId = state.prevBlockId + 1;
          }
          return { prevBlockId: newBlockId, fromBlockId, toBlockId };
        }, { prevBlockId: undefined, fromBlockId: undefined, toBlockId: undefined }),
        switchMap((res: { fromBlockId: number, toBlockId: number | undefined }) => from(apolloClient?.query(
          getGqlContractEventsQuery(contractAddress, methodSignature, res.fromBlockId, res.toBlockId),
        )).pipe(
          map((events) => ({
            fromBlockId: res.fromBlockId,
            toBlockId: res.toBlockId || res.fromBlockId,
            evmEvents: events.data.evm_event,
          })),
        )),
      ) as Observable<any>),
      shareReplay(1),
    );
  }
  return apolloClientInstance$.pipe(
    switchMap((apolloClient: ApolloClient<any>) => from(apolloClient?.query(
      getGqlContractEventsQuery(contractAddress, methodSignature, fromBlockId, toBlockId),
    ))),
    map((events) => ({
      fromBlockId,
      toBlockId: toBlockId || fromBlockId,
      evmEvents: events.data.evm_event,
    })),
    shareReplay(1),
  );
}
