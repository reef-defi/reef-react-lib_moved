import { Modal } from 'bootstrap';

const getModalRef = (id: string) => {
  const modalElement = document.getElementById(id);
  return modalElement && Modal.getOrCreateInstance(modalElement);
}

export const openModal = (id: string) => {
  getModalRef(id)?.show();
}

export const closeModal = (id: string) => {
  getModalRef(id)?.hide();
}
