import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Network, ReefSigner } from '../../state';
import {
  showEvmCopyAddressAlert, REEF_ADDRESS_SPECIFIC_STRING, toReefBalanceDisplay, trim
} from '../../utils';
import {
  Border, FlexRow, Margin, MT, MX,
} from '../common/Display';
import {
  CopyIcon, ExploreIcon, ReefAddressIcon, WalletIcon,
} from '../common/Icons';
import {
  Modal, ModalBody, ModalClose, ModalHeader,
} from '../common/Modal';
import {
  LeadText, MiniText, MutedText, Title,
} from '../common/Text';
import { currentNetwork$ } from '../../appState/providerState';
import { useObservableState } from '../../hooks';
import './AccountSelector.css';
import { ListItem } from '../common/List';
import { getSignerIdent } from '../../rpc';
import AccountInlineInfo from './AccountInlineInfo';

interface AccountSelector {
  reefscanUrl: string;
  accounts: ReefSigner[];
  selectedSigner?: ReefSigner;
  selectAccount: (index: number, signer: ReefSigner) => void;
  availableNetworks?: Network[];
  selectNetwork?: (network: Network) => void;
  bindAccountCb?: () => void;
}

export const AccountSelector = ({
  selectedSigner,
  accounts,
  reefscanUrl,
  selectAccount,
  selectNetwork,
  availableNetworks,
  bindAccountCb,
}: AccountSelector): JSX.Element => {
  const name = selectedSigner ? selectedSigner.name : '';
  const address = selectedSigner ? selectedSigner.address : '';
  const balance = toReefBalanceDisplay(selectedSigner?.balance);
  const evmAddress = selectedSigner ? selectedSigner.evmAddress : '';
  const currentNetwork = useObservableState(currentNetwork$);

  const selectCurrNetwork = (network: Network):void => {
    if (selectNetwork) {
      selectNetwork(network);
    }
  };

  const accountsView = accounts.map((acc, index) => (
    <ListItem key={getSignerIdent(acc)}>
      <AccountInlineInfo
        name={acc.name}
        address={acc.address}
        evmAddress={acc.evmAddress}
        source={acc.source}
        onClick={() => selectAccount(index, acc)}
      />
    </ListItem>
  ));

  return (
    <div className="nav-account border-rad">
      <div
        className="my-auto mx-2 fs-6"
        data-bs-toggle="modal"
        data-bs-target="#account-modal"
      >
        {balance}
      </div>
      <button
        type="button"
        className="btn btn-reef border-rad"
        data-bs-toggle="modal"
        data-bs-target="#account-modal"
      >
        <WalletIcon />
        <span>{trim(name)}</span>
      </button>
      <Modal id="account-modal">
        <ModalHeader>
          <Title>Account info</Title>
          <ModalClose />
        </ModalHeader>
        <ModalBody>
          <Border size="2">
            <Margin size="2">
              <FlexRow className="account-selector__account-address">
                <div className="d-flex">
                  <ReefAddressIcon address={address} />
                  <LeadText>{trim(evmAddress, 11)}</LeadText>
                </div>
              </FlexRow>
            </Margin>
            <Margin size="2">
              <div className="account-selector__network-info">
                <MutedText>
                  <MiniText>
                    {'Connected with '}
                  </MiniText>
                  {selectedSigner?.source}
                  {' '}
                  extension,
                  <br />
                  <MiniText>
                    selected network
                    {' '}
                  </MiniText>
                  {currentNetwork?.name}
                  {' '}
                  {selectNetwork && availableNetworks?.length
                  && (
                  <MiniText>
                    switch to
                    {availableNetworks.filter((n) => n.rpcUrl !== currentNetwork?.rpcUrl).map((network) => (
                      <button type="button" className="btn btn-link account-selector__select-network" data-bs-dismiss="modal" key={network.rpcUrl} onClick={() => selectCurrNetwork(network)}>
                        {network.name}
                      </button>
                    ))}
                  </MiniText>
                  )}
                </MutedText>
              </div>
            </Margin>
            <MT size="2" />
            <MX size="2">
              {selectedSigner?.isEvmClaimed && (
                <CopyToClipboard text={`${evmAddress}${REEF_ADDRESS_SPECIFIC_STRING}`} onCopy={showEvmCopyAddressAlert}>
                  <span
                    className="form-text text-muted ms-2 "
                    style={{ cursor: 'pointer' }}
                  >
                    <CopyIcon small />
                    <MiniText>Copy Reef EVM Address</MiniText>
                  </span>
                </CopyToClipboard>
              )}

              {!selectedSigner?.isEvmClaimed && bindAccountCb && (
                <span
                  role="button"
                  tabIndex={0}
                  className="form-text text-muted ms-2 "
                  style={{ cursor: 'pointer' }}
                  onClick={bindAccountCb}
                >
                  <MiniText>Bind EVM Address</MiniText>
                </span>
              )}

              <CopyToClipboard text={address}>
                <span
                  className="form-text text-muted ms-2"
                  style={{ cursor: 'pointer' }}
                >
                  <CopyIcon small />
                  <MiniText>Copy Address</MiniText>
                </span>
              </CopyToClipboard>
              <a
                href={`${reefscanUrl}/account/${address}`}
                target="_blank"
                className="form-text text-muted ms-3"
                style={{ textDecoration: 'none' }}
                rel="noreferrer"
              >
                <ExploreIcon small />
                <small className="ms-1">View on Explorer</small>
              </a>
            </MX>
          </Border>
          <MT size="2" />
          <div className="account-selector__accounts-list border border-rad">
            <ul className="list-group overflow-scroll" style={{ height: '300px' }}>
              {accountsView}
            </ul>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};
