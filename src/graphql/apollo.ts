import {
  ApolloClient, ApolloLink, HttpLink, InMemoryCache, split,
} from '@apollo/client';
import { map, ReplaySubject, shareReplay } from 'rxjs';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';

const apolloUrlsSubj = new ReplaySubject<{ws:string, http:string}>(1);

export const setApolloUrls = (urls:{ws:string, http:string}):void => {
  apolloUrlsSubj.next(urls);
};

const splitLink$ = apolloUrlsSubj.pipe(
  map((urls:{ws:string, http:string}) => {
    const httpLink = new HttpLink({
      uri: urls.http,
    });
    const wsLink = new WebSocketLink({
      options: {
        reconnect: true,
      },
      uri: urls.ws,
    });

    return split(
      ({ query }) => {
        const definition = getMainDefinition(query);

        return (
          definition.kind === 'OperationDefinition'
          && definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink,
    );
  }),
);

export const apolloClientInstance$ = splitLink$.pipe(
  map((splitLink) => new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([splitLink]),
  })),
  shareReplay(1),
);
