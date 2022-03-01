import React, { ReactElement } from 'react';
import { ReefSigner } from '../../state';
import { BackIcon, CloseIcon } from '../common/Icons';
import { ListItem } from '../common/List';
import { Modal, ModalHeader } from '../common/Modal';
import { Title } from '../common/Text';
import AccountInlineInfo from './AccountInlineInfo';
import { getSignerIdent } from '../../rpc';

interface AccountListModal {
  id: string;
  accounts: ReefSigner[];
  selectAccount: (index: number, signer: ReefSigner) => void;
  backButtonModalId?: string;
  title?: string | ReactElement;
}

export const AccountListModal = ({
  id,
  accounts,
  selectAccount,
  backButtonModalId,
  title = 'Select account',
}: AccountListModal): JSX.Element => {
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
    <Modal id={id}>
      <ModalHeader>
        {!!backButtonModalId && (
          <button
            type="button"
            className="btn ms-0 me-auto py-0"
            data-bs-target={backButtonModalId}
            data-bs-toggle="modal"
            data-bs-dismiss="modal"
          >
            <BackIcon />
          </button>
        )}
        <Title>{title}</Title>
        <button
          type="button"
          className="btn py-0 ms-auto"
          data-bs-dismiss="modal"
        >
          <CloseIcon />
        </button>
      </ModalHeader>
      <div className="modal-body px-0">
        <ul className="list-group overflow-scroll" style={{ height: '300px' }}>
          {accountsView}
        </ul>
      </div>
    </Modal>
  );
};
