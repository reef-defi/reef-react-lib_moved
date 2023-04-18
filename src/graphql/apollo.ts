import {ApolloClient, ApolloLink, HttpLink, InMemoryCache, split,} from '@apollo/client';
import {distinctUntilChanged, map, merge, Observable, ReplaySubject, shareReplay,} from 'rxjs';
import {getMainDefinition} from '@apollo/client/utilities';
import {Observable as ZenObservable} from 'zen-observable-ts';
import {createClient} from "graphql-ws";
import {GraphQLWsLink} from "@apollo/client/link/subscriptions";

export interface GQLUrl {
  http: string;
  ws: string;
}

// Explorer
const apolloExplorerUrlsSubj = new ReplaySubject<GQLUrl>(1);
export const apolloExplorerClientSubj = new ReplaySubject<ApolloClient<any>>(1);

export const setApolloExplorerUrls = (urls: GQLUrl): void => {
  apolloExplorerUrlsSubj.next(urls);
};

const splitExplorerLink$ = apolloExplorerUrlsSubj.pipe(
    map((urls: GQLUrl) => {
        const httpLink = new HttpLink({
            uri: urls.http,
        });
        const wsLink = new GraphQLWsLink(createClient({
                url: urls.ws,
            })
        );
        return split(
            ({query}) => {
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
    shareReplay(1),
);
const apolloExplorerLinksClientInstance$: Observable<ApolloClient<any>> = splitExplorerLink$.pipe(
    map(
        (splitLink) => new ApolloClient({
            cache: new InMemoryCache(),
            link: ApolloLink.from([splitLink]),
        }),
    ),
    shareReplay(1),
);

export const apolloExplorerClientInstance$: Observable<ApolloClient<any>> = merge(apolloExplorerLinksClientInstance$, apolloExplorerClientSubj).pipe(
  distinctUntilChanged(),
  shareReplay(1),
);

// DEX
const apolloDexUrlsSubj = new ReplaySubject<GQLUrl>(1);
export const apolloDexClientSubj = new ReplaySubject<ApolloClient<any>>(1);

export const setApolloDexUrls = (urls: GQLUrl): void => {
    apolloDexUrlsSubj.next(urls);
};

const splitDexLink$ = apolloDexUrlsSubj.pipe(
    map((urls: GQLUrl) => {
        const httpLink = new HttpLink({
            uri: urls.http,
        });
        const wsLink = new GraphQLWsLink(createClient({
                url: urls.ws,
            })
        );
        return split(
            ({query}) => {
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
    shareReplay(1),
);
const apolloDexLinksClientInstance$: Observable<ApolloClient<any>> = splitDexLink$.pipe(
    map(
        (splitLink) => new ApolloClient({
            cache: new InMemoryCache(),
            link: ApolloLink.from([splitLink]),
        }),
    ),
    shareReplay(1),
);

export const apolloDexClientInstance$: Observable<ApolloClient<any>> = merge(apolloDexLinksClientInstance$, apolloDexClientSubj).pipe(
    distinctUntilChanged(),
    shareReplay(1),
);

export const zenToRx = <T>(zenObservable: ZenObservable<T>): Observable<T> => new Observable((observer) => zenObservable.subscribe(observer));
