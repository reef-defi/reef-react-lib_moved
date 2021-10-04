import React from 'react';
import { Button } from '../Button';
import { Title } from '../Text';

interface Modal {
  id?: string;
}

export const Modal: React.FC<Modal> = ({ children, id = 'modal' }): JSX.Element => (
  <div
    className="modal fade"
    id={id}
    tabIndex={-1}
    aria-labelledby={id}
    aria-hidden="true"
  >
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content border-rad">
        {children}
      </div>
    </div>
  </div>
);

export const ModalHeader: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="modal-header border-0">
    {children}
  </div>
);

export const ModalBody: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="modal-body py-0">
    {children}
  </div>
);

export const ModalFooter: React.FC<unknown> = ({ children }): JSX.Element => (
  <div className="modal-footer bg-white border-0 border-rad">
    {children}
  </div>
);

export const ModalClose = (): JSX.Element => (
  <button
    type="button"
    className="btn-close"
    data-bs-dismiss="modal"
    aria-label="Close"
  />
);

interface OpenModalButton {
  id?: string;
  disabled?: boolean;
}

export const OpenModalButton: React.FC<OpenModalButton> = ({ children, id = 'open-modal-button', disabled }): JSX.Element => (
  <button
    type="button"
    disabled={disabled}
    data-bs-toggle="modal"
    data-bs-target={`#${id}`}
    className="btn btn-reef btn-lg border-rad w-100"
  >
    {children}
  </button>
);
interface ConfirmationModal {
  id?: string;
  title: string;
  confirmFun: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModal> = ({
  id = 'exampleModal',
  title,
  confirmFun,
  children,
}): JSX.Element => (
  <Modal id={id}>
    <ModalHeader>
      <Title>{title}</Title>
      <ModalClose />
    </ModalHeader>
    <ModalBody>{children}</ModalBody>
    <ModalFooter>
      <Button onClick={confirmFun}>
        {title}
      </Button>
    </ModalFooter>
  </Modal>
);

export default ConfirmationModal;
