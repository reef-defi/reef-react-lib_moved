import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ReefSigner } from '../../state';
import { toReefBalanceDisplay, trim } from '../../utils';
import {
  Border,
  ContentBetween,
  FlexRow,
  Margin,
  MT,
  MX,
} from '../common/Display';
import {
  WalletIcon,
  CopyIcon,
  ExploreIcon,
  ReefAddressIcon,
} from '../common/Icons';
import {
  Modal, ModalBody, ModalClose, ModalHeader,
} from '../common/Modal';
import {
  LeadText, MiniText, MutedText, Title,
} from '../common/Text';
import { AccountListModal } from './AccountListModal';

interface AccountSelector {
  reefscanUrl: string;
  accounts: ReefSigner[];
  selectedSigner?: ReefSigner;
  selectAccount: (index: number, signer: ReefSigner) => void;
}

export const AccountSelector = ({
  selectedSigner,
  accounts,
  reefscanUrl,
  selectAccount,
}: AccountSelector): JSX.Element => {
  const name = selectedSigner ? selectedSigner.name : '';
  const address = selectedSigner ? selectedSigner.address : '';
  const balance = toReefBalanceDisplay(selectedSigner?.balance);
  const evmAddress = selectedSigner ? selectedSigner.evmAddress : '';

  const confirmEvmCopy = (): void => {
    window.alert('ONLY use this address on Reef chain! DO NOT use this Reef EVM address on any other chain!');
  };

  return (
    <div className="nav-account border-rad">
      <div className="my-auto mx-2 fs-6">{balance}</div>
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
          <Title>Account</Title>
          <ModalClose />
        </ModalHeader>
        <ModalBody>
          <Border size="2">
            <ContentBetween>
              <MutedText>
                <MiniText>
                  {`Connected with ${selectedSigner?.source} extension`}
                </MiniText>
              </MutedText>
              <button
                type="button"
                className="btn btn-sm btn-reef border-rad"
                data-bs-target="#select-account-modal"
                data-bs-toggle="modal"
              >
                <span>Switch account</span>
              </button>
            </ContentBetween>
            <Margin size="2">
              <FlexRow>
                <ReefAddressIcon address={address} />
                <LeadText>{trim(evmAddress, 11)}</LeadText>
              </FlexRow>
            </Margin>
            <MT size="2" />
            <MX size="2">
              <CopyToClipboard text={`${evmAddress}(ONLY for Reef chain!)`} onCopy={confirmEvmCopy}>
                <span
                  className="form-text text-muted ms-2"
                  style={{ cursor: 'pointer' }}
                >
                  <CopyIcon small />
                  <MiniText>Copy Reef EVM Address</MiniText>
                </span>
              </CopyToClipboard>
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
        </ModalBody>
      </Modal>
      <AccountListModal
        id="select-account-modal"
        accounts={accounts}
        selectAccount={selectAccount}
        backButtonModalId="#account-modal"
      />
    </div>
  );
};
