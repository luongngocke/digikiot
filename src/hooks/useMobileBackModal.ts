import { useEffect, useRef } from 'react';

// Use a truly global stack
if (!window.__modalStack) {
  window.__modalStack = [];
}

let isProgrammaticBack = false;

declare global {
  interface Window {
    __modalStack: { id: string; close: () => void }[];
  }
}

// Global popstate handler (runs only once per navigation)
if (!window.__popStateHandlerRegistered) {
  window.addEventListener('popstate', (e) => {
    if (isProgrammaticBack) {
      isProgrammaticBack = false;
      return;
    }
    
    const stack = window.__modalStack;
    if (stack && stack.length > 0) {
      const topModal = stack.pop(); // Remove it from stack
      if (topModal) {
        topModal.close();
      }
    }
  });
  window.__popStateHandlerRegistered = true;
}

declare global {
  interface Window {
    __popStateHandlerRegistered?: boolean;
  }
}

export const useMobileBackModal = (isOpen: boolean, onClose: () => void) => {
  const onCloseRef = useRef(onClose);
  const modalIdRef = useRef(`modal_${Math.random().toString(36).substring(2, 9)}`);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const modalId = modalIdRef.current;
    
    // Add to stack
    window.__modalStack.push({
      id: modalId,
      close: () => onCloseRef.current()
    });
    
    // Push history state
    window.history.pushState({ ...window.history.state, __modalId: modalId }, '');

    return () => {
      // Remove from stack if unmounted or closed via UI
      const index = window.__modalStack.findIndex(m => m.id === modalId);
      if (index > -1) {
        window.__modalStack.splice(index, 1);
        
        // If it was closed via UI (not via back button), we clean up history
        if (window.history.state?.__modalId === modalId) {
          isProgrammaticBack = true;
          window.history.back();
        }
      }
    };
  }, [isOpen]);
};
