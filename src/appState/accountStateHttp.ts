import {
  combineLatest,
  distinctUntilChanged,
  map,
  mergeScan,
  Observable,
  of,
  ReplaySubject,
  scan,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  withLatestFrom,
  skipWhile,
} from 'rxjs';
import { ReefSigner } from '@reef-defi/react-lib';
import {
  getAddressUpdateActionTypes,
  getUnwrappedData$,
  UpdateAction,
  UpdateDataCtx,
  UpdateDataType,
} from './updateCtxUtil';
import { replaceUpdatedSigners, updateSignersBalances, updateSignersEvmBindings } from './accountStateUtil';
import { providerSubj } from './providerState';
import { selectAddressSubj, signersInjected$ } from './accountState';

export const reloadSignersOverHttpSubj = new Subject<UpdateDataCtx<ReefSigner[]>>();

const signersWithUpdatedData$ = reloadSignersOverHttpSubj.pipe(
  withLatestFrom(combineLatest([signersInjected$, providerSubj])),
  mergeScan((state: { allUpdated: ReefSigner[], lastUpdatedSigners: ReefSigner[], lastUpdateActions: UpdateAction[] }, [updateCtx, [signersInjected, provider]]): any => {
    const allUpdatedSigners = replaceUpdatedSigners(signersInjected, state.allUpdated);
    return of(updateCtx.updateActions).pipe(
      switchMap((updateActions) => updateSignersBalances(updateActions, allUpdatedSigners, provider)
        .then((updatedSigners) => ({
          allUpdated: replaceUpdatedSigners(state.allUpdated, updatedSigners, true),
          lastUpdatedSigners: updatedSigners,
          lastUpdateActions: updateActions,
        }))
        .then((newState) => updateSignersEvmBindings(newState.lastUpdateActions, newState.allUpdated)
          .then((updatedSigners) => ({
            allUpdated: replaceUpdatedSigners(newState.allUpdated, updatedSigners, true),
            lastUpdatedSigners: replaceUpdatedSigners(newState.lastUpdatedSigners, updatedSigners, true),
            lastUpdateActions: newState.lastUpdateActions,
          })))),
    );
  }, { allUpdated: [], lastUpdatedSigners: [], lastUpdateActions: [] }),
  map((val: any): any => ({
    data: val.lastUpdatedSigners,
    updateActions: val.lastUpdateActions,
  } as UpdateDataCtx<ReefSigner[]>)),
  shareReplay(1),
);

const signersUpdateCtxHttp$: Observable<UpdateDataCtx<ReefSigner[]>> = combineLatest({
  injectedSigners: signersInjected$,
  updatedSigners: signersWithUpdatedData$.pipe(startWith(null)),
}).pipe(
  scan((stateVal: any, currentVal) => {
    let updatedSignersCtx: UpdateDataCtx<ReefSigner[]>|undefined;
    if (stateVal.lastInjectedSigners !== currentVal.injectedSigners) {
      // TODO add updateActions to injectedSigners and uncomment-> updatedSignersCtx = currentVal.injectedSigners;
    } else {
      const updatedSig = replaceUpdatedSigners(stateVal.currentValue.data, currentVal.updatedSigners.data);
      updatedSignersCtx = { data: updatedSig, updateActions: currentVal.updatedSigners.updateActions };
    }
    return {
      currentValue: updatedSignersCtx,
      lastInjectedSigners: currentVal.injectedSigners,
    };
  }, {
    currentValue: ({ updateActions: [], data: [] } as UpdateDataCtx<ReefSigner[]>),
    lastInjectedSigners: null,
  }),
  map((v) => v.currentValue),
  shareReplay(1),
);

export const signersHttp$: Observable<ReefSigner[]> = getUnwrappedData$(signersUpdateCtxHttp$);

export const selectedSignerUpdateCtxHttp$ = combineLatest([selectAddressSubj.pipe(distinctUntilChanged()), signersUpdateCtxHttp$]).pipe(
  scan((state: { result: UpdateDataCtx<ReefSigner>, lastSelectedAddress: string | undefined }, [selectedAddress, signersCtx]) => {
    let foundSigner = signersCtx.data?.find((rs: ReefSigner) => rs.address === selectedAddress);
    let selectedAddressUpdateActions: UpdateAction[] = [];
    if (foundSigner) {
      const selectedSignerChanged = state.lastSelectedAddress !== selectedAddress;
      if (selectedSignerChanged) {
        selectedAddressUpdateActions = [{
          address: foundSigner?.address,
          type: UpdateDataType.ACCOUNT_EVM_BINDING,
        }, {
          address: foundSigner?.address,
          type: UpdateDataType.ACCOUNT_TOKENS,
        }, {
          address: foundSigner?.address,
          type: UpdateDataType.ACCOUNT_NATIVE_BALANCE,
        }] as UpdateAction[];
      } else {
        const updateTypes = getAddressUpdateActionTypes(selectedAddress, signersCtx.updateActions);
        selectedAddressUpdateActions = updateTypes.map((ut) => ({
          address: foundSigner?.address,
          type: ut,
        })) as UpdateAction[];
      }
    } else {
      foundSigner = signersCtx.data ? signersCtx.data[0] : undefined;
      selectedAddressUpdateActions = [{
        address: foundSigner?.address,
        type: UpdateDataType.ACCOUNT_EVM_BINDING,
      }, {
        address: foundSigner?.address,
        type: UpdateDataType.ACCOUNT_TOKENS,
      }, {
        address: foundSigner?.address,
        type: UpdateDataType.ACCOUNT_NATIVE_BALANCE,
      }] as UpdateAction[];
    }
    if (foundSigner) {
      localStorage.setItem('selected_address_reef', foundSigner?.address || '');
    }
    return {
      result: ({
        data: foundSigner ? { ...foundSigner } : undefined,
        updateActions: selectedAddressUpdateActions,
      } as UpdateDataCtx<ReefSigner>),
      lastSelectedAddress: selectedAddress,
    };
  }, { result: { data: undefined, updateActions: [] }, lastSelectedAddress: '' }),
  map((state) => state.result as UpdateDataCtx<ReefSigner>),
  shareReplay(1),
);

export const selectedSignerHttp$ = getUnwrappedData$(selectedSignerUpdateCtxHttp$);
