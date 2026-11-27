import CommentAvatar from './CommentAvatar.jsx';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { profileUrl } from './common.jsx';

const featuredPlaces = ['Hà Giang', 'Hà Nội', 'Sa Pa', 'Ninh Bình', 'Huế', 'Đà Nẵng', 'Hội An', 'Đà Lạt', 'TP. Hồ Chí Minh', 'Phú Quốc', 'Hoàng Sa', 'Trường Sa'];
const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replaceAll('đ','d');

export default function WanderlySearch({ query, account }) {
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const [advanced, setAdvanced] = useState(false);
  const [tags, setTags] = useState(() => (urlParams.get("tags") || "").split(",").filter(Boolean));
  const [tagDraft, setTagDraft] = useState("");
  const [tagMode, setTagMode] = useState(urlParams.get("tagMode") || "all");
  const [minCost, setMinCost] = useState(urlParams.get("minCost") || "");
  const [maxCost, setMaxCost] = useState(urlParams.get("maxCost") || "");
  const [sort, setSort] = useState(urlParams.get("sort") || "newest");
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
  function addTag(value) {
    const tag = value.trim().replace(/^#/, '').toLowerCase();
    if (/^[\p{L}\p{N}_]{1,60}$/u.test(tag)) setTags(current => current.includes(tag) ? current : [...current, tag].slice(0, 12));
    setTagDraft('');
  }
  function submit(value) {
    const text = value.trim();
    if (text) updateHistory([text, ...history.filter(item => item !== text)].slice(0, 7));
    close();
    const next = new URLSearchParams();
    if (text) next.set('q', text);
    if (tags.length) next.set('tags', tags.join(','));
    if (tags.length && tagMode === 'any') next.set('tagMode', 'any');
    if (minCost !== '') next.set('minCost', minCost);
    if (maxCost !== '') next.set('maxCost', maxCost);
    if (sort !== 'newest') next.set('sort', sort);
    navigate('/' + (next.size ? '?' + next.toString() : ''));

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
      <button type="button" className="wanderly-advanced-toggle" onClick={() => setAdvanced(v => !v)} aria-expanded={advanced}><SlidersHorizontal/> Bộ lọc nâng cao <span>{advanced ? 'Thu gọn −' : 'Mở rộng +'}</span></button>
      {advanced && <div className="wanderly-advanced-fields">
        <label>Hashtag (có thể chọn nhiều)</label>
        <div className="wanderly-tag-entry"><input value={tagDraft} placeholder="Nhập hashtag rồi nhấn Enter" onChange={e => setTagDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagDraft); } }}/><button type="button" onClick={() => addTag(tagDraft)}>Thêm</button></div>
        <div className="wanderly-selected-tags">{tags.map(tag => <button type="button" key={tag} onClick={() => setTags(v => v.filter(t => t !== tag))}>#{tag} ×</button>)}</div>
        <label>Điều kiện hashtag</label><select value={tagMode} onChange={e => setTagMode(e.target.value)}><option value="all">Chứa tất cả hashtag</option><option value="any">Chứa ít nhất một hashtag</option></select>
        <label>Khoảng chi phí chuyến đi (VNĐ)</label><div className="wanderly-price-row"><input type="number" min="0" placeholder="Từ" value={minCost} onChange={e => setMinCost(e.target.value)}/><span>—</span><input type="number" min="0" placeholder="Đến" value={maxCost} onChange={e => setMaxCost(e.target.value)}/></div>
        <div className="wanderly-price-presets">{[['Dưới 1 triệu','',1000000],['1–3 triệu',1000000,3000000],['3–5 triệu',3000000,5000000],['Trên 5 triệu',5000000,'']].map(([label,min,max]) => <button type="button" key={label} onClick={() => {setMinCost(String(min));setMaxCost(String(max));}}>{label}</button>)}</div>
        <label>Sắp xếp theo</label><select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Mới nhất</option><option value="likes">Nhiều lượt thích nhất</option><option value="price_asc">Chi phí thấp đến cao</option><option value="price_desc">Chi phí cao đến thấp</option></select>
        <div className="wanderly-advanced-actions"><button type="button" onClick={() => {setTags([]);setMinCost('');setMaxCost('');setSort('newest');setTagMode('all');}}>Xóa bộ lọc</button><button type="button" onClick={() => submit(term)}>Áp dụng bộ lọc</button></div>
      </div>}
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
        {suggestions?.tags?.map(tag => <div className="wanderly-search-tag-suggestion" key={tag}><button type="button" onClick={() => submit('#' + tag)}>#{tag}</button><button type="button" onClick={() => {addTag(tag);setAdvanced(true);}}>+ Lọc</button></div>)}
        <p className="wanderly-search-empty" role="status">{!suggestions ? 'Đang tìm gợi ý…' : suggestions.failed ? 'Chưa tải được gợi ý. Nhấn Enter để tìm kiếm.' : 'Nhấn Enter để xem kết quả tìm kiếm.'}</p>
      </>}
    </section>}
  </div>;
}
