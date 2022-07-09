import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  merge,
  mergeScan,
  Observable,
  of,
  ReplaySubject,
  scan,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';
import {Provider} from '@reef-defi/evm-provider';
import {BigNumber} from 'ethers';
import {filter} from 'rxjs/operators';
import {gql} from '@apollo/client';
import {UpdateDataCtx} from './updateStateModel';
import {replaceUpdatedSigners, updateSignersEvmBindings,} from './accountStateUtil';
import {currentProvider$} from './providerState';
import {ReefSigner} from '../state';
import {apolloClientInstance$, zenToRx} from '../graphql/apollo';
import {AccountJson} from '@reef-defi/extension-base/background/types';
import type {InjectedAccountWithMeta} from "@reef-defi/extension-inject/types";
import {accountJsonToMeta, metaAccountToSigner} from "../rpc/accounts";
import type {Signer as InjectedSigningKey} from '@polkadot/api/types';

export const accountsSubj = new ReplaySubject<ReefSigner[] | null>(1);
export const accountsJsonSubj = new ReplaySubject<AccountJson[]| InjectedAccountWithMeta[] | null>(1);
export const accountsJsonSigningKeySubj = new ReplaySubject<InjectedSigningKey>(1);
export const reloadSignersSubj = new Subject<UpdateDataCtx<ReefSigner[]>>();

const signersFromJson$: Observable<ReefSigner[]> = combineLatest([accountsJsonSubj, currentProvider$, accountsJsonSigningKeySubj]).pipe(
  switchMap(([jsonAccounts, provider, signingKey]: [(AccountJson[] | InjectedAccountWithMeta[] | null), Provider, InjectedSigningKey]) => {
    let accounts = jsonAccounts || [];
    if (accounts?.length && !accounts[0].meta) {
      accounts = accounts.map((acc) => accountJsonToMeta(acc));
    }
    return Promise.all(
      accounts.map((account) => metaAccountToSigner(account, provider as Provider, signingKey as InjectedSigningKey)),
    ).then((signers:ReefSigner[])=>signers.filter(s=>!!s)) as Promise<ReefSigner[]>;
  }),
  shareReplay(1)
);

export const signersInjected$ = merge(accountsSubj, signersFromJson$).pipe(
  map((signrs) => (signrs && signrs.length ? signrs : [])),
  shareReplay(1),
);

const signersLocallyUpdatedData$: Observable<ReefSigner[]> = reloadSignersSubj.pipe(
  filter((reloadCtx: any) => !!reloadCtx.updateActions.length),
  withLatestFrom(signersInjected$),
  mergeScan(
    (
      state: {
        all: ReefSigner[];
        allUpdated: ReefSigner[];
        lastUpdated: ReefSigner[];
      },
      [updateCtx, signersInjected]: [any, ReefSigner[]],
    ): any => {
      const allSignersLatestUpdates = replaceUpdatedSigners(
        signersInjected,
        state.allUpdated,
      );
      return of(updateCtx.updateActions || [])
        .pipe(
          switchMap((updateActions) => updateSignersEvmBindings(
            updateActions,
            allSignersLatestUpdates,
          )
            .then((lastUpdated) => ({
              all: replaceUpdatedSigners(
                allSignersLatestUpdates,
                lastUpdated,
                true,
              ),
              allUpdated: replaceUpdatedSigners(
                state.allUpdated,
                lastUpdated,
                true,
              ),
              lastUpdated,
            }))),
        );
    },
    {
      all: [],
      allUpdated: [],
      lastUpdated: [],
    },
  ),
  filter((val: any) => !!val.lastUpdated.length),
  map((val: any): any => val.all),
  startWith([]),
  catchError(err => {
    console.log('signersLocallyUpdatedData$ ERROR=', err.message);
    return of([]);
  }),
  shareReplay(1),
);

const signersWithUpdatedBalances$ = combineLatest([
  currentProvider$,
  signersInjected$,
])
  .pipe(
    mergeScan(
      (
        state: { unsub: any; balancesByAddressSubj: ReplaySubject<any> },
        [provider, signers]: [Provider, ReefSigner[]],
      ) => {
        if (state.unsub) {
          state.unsub();
        }
        const distinctSignerAddresses = signers
          .map((s) => s.address)
          .reduce((distinctAddrList: string[], curr: string) => {
            if (distinctAddrList.indexOf(curr) < 0) {
              distinctAddrList.push(curr);
            }
            return distinctAddrList;
          }, []);
        // eslint-disable-next-line no-param-reassign
        return provider.api.query.system.account
          .multi(distinctSignerAddresses, (balances: any[]) => {
            const balancesByAddr = balances.map(({ data }, index) => ({
              address: distinctSignerAddresses[index],
              balance: data.free.toString(),
            }));
            state.balancesByAddressSubj.next({
              balances: balancesByAddr,
              signers,
            });
          })
          .then((unsub) => {
            // eslint-disable-next-line no-param-reassign
            state.unsub = unsub;
            return state;
          });
      },
      {
        unsub: null,
        balancesByAddressSubj: new ReplaySubject<any>(1)
      },
    ),
    distinctUntilChanged(
      (prev: any, curr: any): any => prev.balancesByAddressSubj !== curr.balancesByAddressSubj,
    ),
    switchMap(
      (v: {
        balancesByAddressSubj: Subject<{ balances: any; signers: ReefSigner[] }>;
      }) => v.balancesByAddressSubj,
    ),
    map((balancesAndSigners: { balances: any; signers: ReefSigner[] }) => (!balancesAndSigners.signers
      ? []
      : balancesAndSigners.signers.map((sig) => {
        const bal = balancesAndSigners.balances.find(
          (b: { address: string; balance: string }) => b.address === sig.address,
        );
        if (bal && !BigNumber.from(bal.balance)
          .eq(sig.balance)) {
          return {
            ...sig,
            balance: BigNumber.from(bal.balance)
          };
        }
        return sig;
      }))),
    shareReplay(1),
    catchError(err => {
      console.log('signersWithUpdatedBalances$ ERROR=', err.message);
      return of([]);
    })
  );

const EVM_ADDRESS_UPDATE_GQL = gql`
  subscription query($accountIds: [String!]!) {
    account(
      where: { address: { _in: $accountIds } }
      order_by: { timestamp: asc, address: asc }
    ) {
      address
      evm_address
    }
  }
`;

// eslint-disable-next-line camelcase
interface AccountEvmAddrData {
  address: string;
  // eslint-disable-next-line camelcase
  evm_address?: string;
  isEvmClaimed?: boolean;
}

const indexedAccountValues$ = combineLatest([
  apolloClientInstance$,
  signersInjected$,
])
  .pipe(
    switchMap(([apollo, signers]) => (!signers
      ? []
      : zenToRx(
        apollo.subscribe({
          query: EVM_ADDRESS_UPDATE_GQL,
          variables: { accountIds: signers.map((s: any) => s.address) },
          fetchPolicy: 'network-only',
        }),
      ))),
    map((result: any): AccountEvmAddrData[] => result.data.account),
    filter((v) => !!v),
    startWith([]),
  );

const signersWithUpdatedData$ = combineLatest([
  signersWithUpdatedBalances$,
  signersLocallyUpdatedData$,
  indexedAccountValues$,
])
  .pipe(
    scan(
      (
        state: {
          lastlocallyUpdated: ReefSigner[];
          lastIndexed: AccountEvmAddrData[];
          lastSigners: ReefSigner[];
          signers: ReefSigner[];
        },
        [signers, locallyUpdated, indexed],
      ) => {
        let updateBindValues: AccountEvmAddrData[] = [];
        if (state.lastlocallyUpdated !== locallyUpdated) {
          updateBindValues = locallyUpdated.map((updSigner) => ({
            address: updSigner.address,
            isEvmClaimed: updSigner.isEvmClaimed,
          }));
        } else if (state.lastIndexed !== indexed) {
          updateBindValues = indexed.map((updSigner: AccountEvmAddrData) => ({
            address: updSigner.address,
            isEvmClaimed: !!updSigner.evm_address,
          }));
        } else {
          updateBindValues = state.lastSigners.map((updSigner) => ({
            address: updSigner.address,
            isEvmClaimed: updSigner.isEvmClaimed,
          }));
        }
        updateBindValues.forEach((updVal: AccountEvmAddrData) => {
          const signer = signers.find((sig) => sig.address === updVal.address);
          if (signer) {
            signer.isEvmClaimed = !!updVal.isEvmClaimed;
          }
        });
        return {
          signers,
          lastlocallyUpdated: locallyUpdated,
          lastIndexed: indexed,
          lastSigners: signers,
        };
      },
      {
        signers: [],
        lastlocallyUpdated: [],
        lastIndexed: [],
        lastSigners: [],
      },
    ),
    map(({ signers }) => signers),
    shareReplay(1),
    catchError(err => {
      console.log('signersWithUpdatedData$ ERROR=', err.message);
      return of(null);
    })
  );

export const signers$: Observable<ReefSigner[] | null> = signersWithUpdatedData$;

const currentAddressSubj: Subject<string | undefined> = new Subject<string | undefined>();
export const setCurrentAddress = (address: string|undefined)=> currentAddressSubj.next(address);
export const currentAddress$: Observable<string | undefined> = currentAddressSubj.asObservable()
  .pipe(
    startWith(''),
    distinctUntilChanged(),
    shareReplay(1),
  );

// setting default signer (when signers exist) if no selected address exists
combineLatest([signers$, currentAddress$])
  .pipe(take(1))
  .subscribe(([signers, address]: [ReefSigner[] | null, string]): any => {
    let saved: string | undefined = address;
    try {
      if (!saved) {
        saved = localStorage?.getItem('selected_address_reef') || undefined;
      }
    } catch (e) {
      // getting error in Flutter: 'The operation is insecure'
      // console.log('Flutter error=', e.message);
    }

    if (!saved) {
      let firstSigner = signers && signers[0] ? signers[0].address : undefined;
      setCurrentAddress(
        saved || firstSigner
      );
    }
  });

export const selectedSigner$: Observable<ReefSigner | undefined | null> = combineLatest([
  currentAddress$,
  signers$,
])
  .pipe(
    map(([selectedAddress, signers]: [string | undefined, ReefSigner[]|null]) => {
      if (!selectedAddress || !signers || !signers.length) {
        return undefined;
      }

      let foundSigner = signers.find(
        (signer: ReefSigner) => signer?.address === selectedAddress,
      );
      if (!foundSigner) {
        foundSigner = signers ? signers[0] as ReefSigner : undefined;
      }
      try {
        if (foundSigner) {
          localStorage.setItem(
            'selected_address_reef',
            foundSigner.address || '',
          );
        }
      } catch (e) {
        // getting error in Flutter: 'The operation is insecure'
        // console.log('Flutter error=',e.message);
      }
      return foundSigner ? { ...foundSigner } as ReefSigner : undefined;
    }),
    catchError((err) => {
      console.log('selectedSigner$ ERROR=', err.message);
      return of(null);
    }),
    shareReplay(1),
  );

