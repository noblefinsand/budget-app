import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ModalState {
  isOpen: boolean;
  type: string | null;
  data?: unknown;
}

interface ModalContextType {
  modalState: ModalState;
  openModal: (type: string, data?: unknown) => void;
  closeModal: () => void;
  isModalOpen: (type: string) => boolean;
  getModalData: () => unknown;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
    data: undefined,
  });

  const openModal = (type: string, data?: unknown) => {
    setModalState({
      isOpen: true,
      type,
      data,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      data: undefined,
    });
  };

  const isModalOpen = (type: string): boolean => {
    return modalState.isOpen && modalState.type === type;
  };

  const getModalData = () => {
    return modalState.data;
  };

  const value: ModalContextType = {
    modalState,
    openModal,
    closeModal,
    isModalOpen,
    getModalData,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}; 