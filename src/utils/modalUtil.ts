import { Modal } from 'bootstrap';

const getModalRef = (id: string): Modal | null => {
  const modalElement = document.getElementById(id);
  return modalElement && Modal.getOrCreateInstance(modalElement);
};

export const openModal = (id: string): void => {
  getModalRef(id)?.show();
};

export const closeModal = (id: string): void => {
  getModalRef(id)?.hide();
  /* In cases when the Modal was not opened through openModal,
   * overlay stays in the DOM, so we remove it by hand here if
   * it exists */
  const overlayEl = document.querySelectorAll('.modal-backdrop.show');
  if (overlayEl?.length > 0) {
    overlayEl.forEach((el) => el.remove());
  }
};
