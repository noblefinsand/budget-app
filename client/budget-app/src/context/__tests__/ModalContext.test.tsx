import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModalProvider, useModal } from '../ModalContext';

// Test component to access modal context
function TestComponent() {
  const { 
    modalState, 
    openModal, 
    closeModal,
    isModalOpen,
    getModalData
  } = useModal();
  
  return (
    <div>
      <div data-testid="is-open">{modalState.isOpen.toString()}</div>
      <div data-testid="modal-type">{modalState.type || 'no-modal'}</div>
      <div data-testid="modal-data">{JSON.stringify(modalState.data) || 'no-data'}</div>
      <div data-testid="is-expense-open">{isModalOpen('expense').toString()}</div>
      <div data-testid="modal-data-getter">{JSON.stringify(getModalData()) || 'no-data'}</div>
      <button onClick={() => openModal('expense', { id: '1', name: 'Test Expense' })}>
        Open Expense Modal
      </button>
      <button onClick={() => openModal('delete', { id: '1', name: 'Test Item' })}>
        Open Delete Modal
      </button>
      <button onClick={() => openModal('welcome', null)}>
        Open Welcome Modal
      </button>
      <button onClick={() => closeModal()}>
        Close Modal
      </button>
    </div>
  );
}

describe('ModalContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with initial state', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    expect(screen.getByTestId('modal-type')).toHaveTextContent('no-modal');
    expect(screen.getByTestId('modal-data')).toHaveTextContent('no-data');
  });

  it('should open expense modal with data', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    fireEvent.click(screen.getByText('Open Expense Modal'));

    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('modal-type')).toHaveTextContent('expense');
    expect(screen.getByTestId('modal-data')).toHaveTextContent('{"id":"1","name":"Test Expense"}');
  });

  it('should open delete modal with data', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    fireEvent.click(screen.getByText('Open Delete Modal'));

    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('modal-type')).toHaveTextContent('delete');
    expect(screen.getByTestId('modal-data')).toHaveTextContent('{"id":"1","name":"Test Item"}');
  });

  it('should open welcome modal without data', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    fireEvent.click(screen.getByText('Open Welcome Modal'));

    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('modal-type')).toHaveTextContent('welcome');
    expect(screen.getByTestId('modal-data')).toHaveTextContent('null');
  });

  it('should close modal', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    // Open modal first
    fireEvent.click(screen.getByText('Open Expense Modal'));
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');

    // Close modal
    fireEvent.click(screen.getByText('Close Modal'));

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    expect(screen.getByTestId('modal-type')).toHaveTextContent('no-modal');
    expect(screen.getByTestId('modal-data')).toHaveTextContent('no-data');
  });

  it('should replace modal when opening a new one', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    // Open expense modal
    fireEvent.click(screen.getByText('Open Expense Modal'));
    expect(screen.getByTestId('modal-type')).toHaveTextContent('expense');

    // Open delete modal (should replace the expense modal)
    fireEvent.click(screen.getByText('Open Delete Modal'));

    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('modal-type')).toHaveTextContent('delete');
    expect(screen.getByTestId('modal-data')).toHaveTextContent('{"id":"1","name":"Test Item"}');
  });

  it('should maintain modal state across re-renders', () => {
    const { rerender } = render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    // Open modal
    fireEvent.click(screen.getByText('Open Expense Modal'));
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');

    // Re-render the component
    rerender(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    // Modal state should be preserved
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('modal-type')).toHaveTextContent('expense');
    expect(screen.getByTestId('modal-data')).toHaveTextContent('{"id":"1","name":"Test Expense"}');
  });

  it('should check if specific modal is open', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    // Initially no modal is open
    expect(screen.getByTestId('is-expense-open')).toHaveTextContent('false');

    // Open expense modal
    fireEvent.click(screen.getByText('Open Expense Modal'));
    expect(screen.getByTestId('is-expense-open')).toHaveTextContent('true');

    // Open delete modal instead
    fireEvent.click(screen.getByText('Open Delete Modal'));
    expect(screen.getByTestId('is-expense-open')).toHaveTextContent('false');
  });

  it('should get modal data using getter method', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    // Initially no data
    expect(screen.getByTestId('modal-data-getter')).toHaveTextContent('no-data');

    // Open modal with data
    fireEvent.click(screen.getByText('Open Expense Modal'));
    expect(screen.getByTestId('modal-data-getter')).toHaveTextContent('{"id":"1","name":"Test Expense"}');

    // Close modal
    fireEvent.click(screen.getByText('Close Modal'));
    expect(screen.getByTestId('modal-data-getter')).toHaveTextContent('no-data');
  });
}); 