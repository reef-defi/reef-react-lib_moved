
import {
 Observable, ReplaySubject, 
} from 'rxjs';
// import { getMainDefinition } from '@apollo/client/utilities';
import { Observable as ZenObservable } from 'zen-observable-ts';
// import { createClient } from 'graphql-ws';
// import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { AxiosInstance } from 'axios';

export interface GQLUrl {
  http: string;
  ws: string;
}

// Explorer
const axiosExplorerUrlsSubj = new ReplaySubject<GQLUrl>(1);
export const axiosExplorerClientSubj = new ReplaySubject<AxiosInstance>(1);

export const setAxiosExplorerUrls = (urls: GQLUrl): void => {
  axiosExplorerUrlsSubj.next(urls);
};

// const splitExplorerLink$ = apolloExplorerUrlsSubj.pipe(
//   map((urls: GQLUrl) => {
//     const httpLink = new HttpLink({
//       uri: urls.http,
//     });
//     const wsLink = new GraphQLWsLink(createClient({
//       url: urls.ws,
//     }));
//     return split(
//       ({ query }) => {
//         const definition = getMainDefinition(query);

//         return (
//           definition.kind === 'OperationDefinition'
//                     && definition.operation === 'subscription'
//         );
//       },
//       wsLink,
//       httpLink,
//     );
//   }),
//   shareReplay(1),
// );
// const apolloExplorerLinksClientInstance$: Observable<ApolloClient<any>> = splitExplorerLink$.pipe(
//   map(
//     (splitLink) => new ApolloClient({
//       cache: new InMemoryCache(),
//       link: ApolloLink.from([splitLink]),
//     }),
//   ),
//   shareReplay(1),
// );

// export const apolloExplorerClientInstance$: Observable<ApolloClient<any>> = merge(apolloExplorerLinksClientInstance$, apolloExplorerClientSubj).pipe(
//   distinctUntilChanged(),
//   shareReplay(1),
// );

// DEX
const axiosDexUrlsSubj = new ReplaySubject<GQLUrl>(1);
export const axiosDexClientSubj = new ReplaySubject<AxiosInstance>(1);

export const setAxiosDexUrls = (urls: GQLUrl): void => {
  axiosDexUrlsSubj.next(urls);
};

export const zenToRx = <T>(zenObservable: ZenObservable<T>): Observable<T> => new Observable((observer) => zenObservable.subscribe(observer));
