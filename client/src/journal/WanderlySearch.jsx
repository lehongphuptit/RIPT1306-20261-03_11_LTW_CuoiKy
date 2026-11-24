import CommentAvatar from './CommentAvatar.jsx';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { profileUrl } from './common.jsx';

const featuredPlaces = ['Hà Giang', 'Hà Nội', 'Sa Pa', 'Ninh Bình', 'Huế', 'Đà Nẵng', 'Hội An', 'Đà Lạt', 'TP. Hồ Chí Minh', 'Phú Quốc', 'Hoàng Sa', 'Trường Sa'];
const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replaceAll('đ','d');

export default function WanderlySearch({ query, account }) {
  const navigate = useNavigate();
  const root = useRef(null);
  const trigger = useRef(null);
  const input = useRef(null);
  const key = 'wanderly-search-history:' + (account || 'guest');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(query);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return Array.isArray(data) ? data.filter(item => typeof item === 'string').slice(0, 7) : [];
    } catch { return []; }
  });
  const term = draft.trim();

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  function updateHistory(items) {
    setHistory(items);
    try { localStorage.setItem(key, JSON.stringify(items)); } catch { /* Storage can be disabled. */ }
  }
  function submit(value) {
    const text = value.trim();
    if (text) updateHistory([text, ...history.filter(item => item !== text)].slice(0, 7));
    close();
    navigate(text ? '/?q=' + encodeURIComponent(text) : '/');
  }
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const outside = event => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
    };
  }, [open]);
  useEffect(() => {
    if (!open || !term) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/search/suggestions', { params: { q: term }, signal: controller.signal });
        if (!controller.signal.aborted) setResult({ term, ...data });
      } catch {
        if (!controller.signal.aborted) setResult({ term, failed: true });
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, term]);
  const suggestions = result?.term === term ? result : null;
  const places = term && !/^[@#]/.test(term) ? [...new Set([
    ...(suggestions?.places || []), ...featuredPlaces.filter(name => fold(name).includes(fold(term)))
  ])].slice(0, 4) : [];
  function suggestion(value, Icon) {
    return <button type="button" className="wanderly-search-suggestion" key={value} onClick={() => submit(value)}>
      <Icon/><span>{value}</span>
    </button>;
  }
  return <div className="wanderly-search-wrap" ref={root} onKeyDown={event => {
    if (open && event.key === 'Escape') close();
  }}>
    <button type="button" className="wanderly-search-pill" ref={trigger} aria-label="Tìm kiếm trên Wanderly"
      aria-expanded={open} aria-controls="wanderly-search-panel" onClick={() => { setDraft(query); setOpen(!open); }}>
      <Search/><span>Tìm kiếm trên Wanderly</span>
    </button>
    {open && <section className="wanderly-search-panel" id="wanderly-search-panel" aria-label="Tìm kiếm trên Wanderly">
      <form role="search" className="wanderly-search-form" onSubmit={event => { event.preventDefault(); submit(term); }}>
        <Search/><input ref={input} type="search" autoComplete="off" maxLength={80} aria-label="Tìm người dùng, địa điểm hoặc hashtag"
          placeholder="Tìm người dùng, địa điểm, hashtag..." value={draft} onChange={event => setDraft(event.target.value)}/>
        <button className="wanderly-search-submit">Tìm kiếm</button>
      </form>
      {!term ? <>
        <div className="wanderly-search-section-head"><strong>Tìm kiếm gần đây</strong>
          {history.length > 0 && <button onClick={() => updateHistory([])}>Xóa tất cả</button>}</div>
        {history.map(item => <div className="wanderly-search-item" key={item}>
          <button onClick={() => submit(item)}><Search/>{item}</button>
          <button className="wanderly-search-remove" aria-label={'Xóa lịch sử ' + item} onClick={() => updateHistory(history.filter(v => v !== item))}>×</button>
        </div>)}
        {!history.length && <p className="wanderly-search-empty">Chưa có tìm kiếm gần đây.</p>}
        <div className="wanderly-search-section-head"><strong>Khám phá</strong></div>
        {suggestion('Hà Giang', MapPin)}{suggestion('#hoian', Search)}
      </> : <>
        <div className="wanderly-search-section-head"><strong>Gợi ý tìm kiếm</strong></div>
        {suggestions?.users?.map(user => <button className="wanderly-search-suggestion" key={user._id} onClick={() => {
          updateHistory(['@' + user.username, ...history.filter(v => v !== '@' + user.username)].slice(0, 7));
          close(); navigate(profileUrl(user._id));
        }}><CommentAvatar className="avatar" author={user}/><span><strong>{user.displayName}</strong><small>@{user.username}</small></span></button>)}
        {places.map(place => suggestion(place, MapPin))}
        {suggestions?.tags?.map(tag => suggestion('#' + tag, Search))}
        <p className="wanderly-search-empty" role="status">{!suggestions ? 'Đang tìm gợi ý…' : suggestions.failed ? 'Chưa tải được gợi ý. Nhấn Enter để tìm kiếm.' : 'Nhấn Enter để xem kết quả tìm kiếm.'}</p>
      </>}
    </section>}
  </div>;
}
