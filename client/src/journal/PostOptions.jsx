import { useEffect, useId, useRef, useState } from 'react';
import { Bookmark, Flag, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Action } from './common.jsx';
import { api } from '../services/api.js';

export default function PostOptions({ id, saved, onSaved, onReport, reported, onGuestSave, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    function outside(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
    };
  }, [open]);
  function close() {
    setOpen(false);
    trigger.current?.focus({preventScroll:true});
  }
  async function toggleSave() {
    if (onGuestSave) { close(); onGuestSave(); return; }
    const url = '/posts/' + id + '/save';
    const result = saved ? await api.delete(url) : await api.put(url);
    close();
    onSaved(result.data.saved);
  }
  return <div ref={root} className="post-options" onKeyDown={event => {
    if (open && event.key === 'Escape') {event.stopPropagation(); close();}
  }}>
    <button type="button" ref={trigger} aria-label="Tùy chọn bài viết" aria-expanded={open}
      aria-controls={open ? panelId : undefined} onClick={() => setOpen(!open)}><MoreHorizontal/></button>
    {open && <div id={panelId} className="post-options-panel">
      <Action run={toggleSave}><Bookmark/>{saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}</Action>
      {onEdit && <button type="button" onClick={() => {close();onEdit();}}><Pencil/>Sửa bài</button>}
      {onDelete && <Action run={async () => {await onDelete();close();}}><Trash2/>Xóa bài</Action>}
      {onReport && <button type="button" disabled={reported} onClick={() => {close();onReport();}}>
        <Flag/>{reported ? 'Đã báo cáo' : 'Báo cáo bài viết'}
      </button>}
    </div>}
  </div>;
}
