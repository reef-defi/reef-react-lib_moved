import React from "react"
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ReefSigner } from "../../state";
import { trim } from "../../utils";
import { Border, ContentBetween, FlexRow, Margin, MT, MX } from "../common/Display";
import { BackIcon, CloseIcon, CopyIcon, ExploreIcon, ReefAddressIcon } from "../common/Icons";
import { ListItem } from "../common/List";
import {Modal, ModalBody, ModalClose, ModalHeader} from "../common/Modal";
import { LeadText, MiniText, MutedText, Title } from "../common/Text";
import AccountInlineInfo from "./AccountInlineInfo";

interface AccountSelector {
  reefscanUrl: string;
  accounts: ReefSigner[];
  selectedSigner?: ReefSigner;
  selectAccount: (index: number) => void;
}

export const AccountSelector = ({selectedSigner, accounts, reefscanUrl, selectAccount} : AccountSelector): JSX.Element => {
  const name = selectedSigner ? selectedSigner.name : "";
  const address = selectedSigner ? selectedSigner.address : "";
  const balance = selectedSigner ? selectedSigner.balance : "- REEF";
  const evmAddress = selectedSigner ? selectedSigner.evmAddress : "";

  const accountsView = accounts
    .map(({ address, evmAddress, name }, index) => (
      <ListItem key={address}>
        <AccountInlineInfo
          name={name}
          address={address}
          evmAddress={evmAddress}
          onClick={() => selectAccount(index)}
        />
      </ListItem>
    ));

  return (
    <div className="nav-account border-rad">
      <div className="my-auto mx-2 fs-6">
        {balance}
      </div>
      <button
        type="button"
        className="btn btn-reef border-rad"
        data-bs-toggle="modal"
        data-bs-target='#account-modal'
      >
        {trim(name)}
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
                  Connected with polkadot-extension
                </MiniText>
              </MutedText>
              <button
                type="button"
                className="btn btn-sm btn-reef border-rad"
                data-bs-target="#select-account-modal"
                data-bs-toggle="modal"
              >
                Switch account
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
              <CopyToClipboard text={evmAddress}>
                <span className="form-text text-muted ms-2" style={{ cursor: 'pointer' }}>
                  <CopyIcon small />
                  <MiniText>Copy EVM Address</MiniText>
                </span>
              </CopyToClipboard>
              <a href={`${reefscanUrl}account/${address}`} target="_blank" className="form-text text-muted ms-3" style={{ textDecoration: 'none' }} rel="noreferrer">
                <ExploreIcon small />
                <small className="ms-1">View on Explorer</small>
              </a>
            </MX>
          </Border>
          <MT size="2" />
        </ModalBody>
      </Modal>
      <Modal id="select-account-modal">
        <ModalHeader>
         <button type="button" className="btn ms-0 me-auto py-0" data-bs-target="#account-modal" data-bs-toggle="modal" data-bs-dismiss="modal">
            <BackIcon />
          </button>
          <Title>Select account</Title>
          <button type="button" className="btn py-0 ms-auto" data-bs-dismiss="modal">
            <CloseIcon />
          </button>
        </ModalHeader>
        <div className="modal-body px-0">
          <ul className="list-group overflow-scroll" style={{ height: '300px' }}>
            {accountsView}
          </ul>
        </div>
      </Modal>
    </div>
  );
}
