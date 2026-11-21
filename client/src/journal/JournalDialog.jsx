import { useBackdropDismiss } from './useBackdropDismiss.js';
import { useEffect, useId, useRef } from 'react';

export default function JournalDialog({ title, hideTitle=false, onClose, children }) {
  const dialog = useRef(null);
  const id = useId();
  const backdrop = useBackdropDismiss(onClose);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return <dialog {...backdrop} ref={dialog} aria-labelledby={hideTitle?undefined:id} aria-label={hideTitle?title:undefined} onCancel={event => {
    event.preventDefault();
    onClose();
  }}>
    <div className={hideTitle?"modal-head close-only":"modal-head"}>{!hideTitle&&<h2 id={id}>{title}</h2>}<button type="button" aria-label="Đóng" onClick={onClose}>×</button></div>
    {children}
  </dialog>;
}
