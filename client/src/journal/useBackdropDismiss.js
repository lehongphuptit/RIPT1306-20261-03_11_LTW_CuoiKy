import { useRef } from 'react';

// A drag that starts in a field or ends inside the panel is not a backdrop tap.
export function useBackdropDismiss(onClose) {
  const startedOutside = useRef(false);
  function onBackdrop(event) {
    if (event.target !== event.currentTarget) return false;
    if (event.currentTarget.tagName !== 'DIALOG') return true;
    const box = event.currentTarget.getBoundingClientRect();
    return event.clientX < box.left || event.clientX >= box.right ||
      event.clientY < box.top || event.clientY >= box.bottom;
  }
  return {
    onPointerDown: event => { startedOutside.current = event.isPrimary && event.button === 0 && onBackdrop(event); },
    onPointerCancel: () => { startedOutside.current = false; },
    onClick: event => {
      const dismiss = startedOutside.current && onBackdrop(event);
      startedOutside.current = false;
      if (dismiss) onClose();
    }
  };
}
