import {useLayoutEffect,useRef,useState} from 'react';
import {api,errorMessage} from '../services/api.js';
export default function Composer({ onPosted, user, post, initiallyOpen=false }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [busy, setBusy] = useState(false);
  const [keep,setKeep]=useState(()=>post?.images?.map(i=>i.publicId)||[]);
  const [message, setMessage] = useState('');
  const field = 'mt-1 block w-full rounded-xl border bg-white px-3 py-2 text-base';
  const key='wanderly:journal:'+user._id+':'+(post?._id||'new');
  const formRef=useRef(null);
  useLayoutEffect(()=>{
    if(!open)return;
    const form=formRef.current;
    const names=['title','content','location','tripDate','cost','visibility'];
    let timer,dirty=false;
    try{
      const draft=JSON.parse(localStorage.getItem(key));
      if(draft)for(const name of names)if(typeof draft[name]==='string')form.elements[name].value=draft[name];
    }catch{}
    function flush(){
      clearTimeout(timer);
      if(!dirty||form.dataset.published)return;
      try{localStorage.setItem(key,JSON.stringify(Object.fromEntries(names.map(name=>[name,form.elements[name].value]))));dirty=false;}
      catch{setMessage('Chưa lưu được bản nháp trên thiết bị.');}
    }
    function change(e){if(names.includes(e.target.name)){dirty=true;clearTimeout(timer);timer=setTimeout(flush,600);}}
    function hidden(){if(document.hidden)flush();}
    form.addEventListener('input',change);window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',hidden);
    return ()=>{flush();form.removeEventListener('input',change);window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',hidden);};
  },[open,key]);
  async function publish(event) {
    event.preventDefault();
    if (busy) return;
    const form=event.currentTarget; const body = new FormData(form);
    const files = body.getAll('images').filter(file => file.size);
    if (files.length + keep.length > 6) { setMessage('Chọn tối đa 6 ảnh.'); return; }
    if (files.some(file => file.size > 5 * 1024 * 1024)) { setMessage('Mỗi ảnh tối đa 5 MB.'); return; }
    if(post)body.set('keepImageIds',JSON.stringify(keep));
    body.delete('images');
    files.forEach(file => body.append('images', file));
    body.set('location', JSON.stringify({ name: body.get('location').trim() }));
    setBusy(true);
    setMessage('');
    try {
      if(post)await api.patch('/posts/'+post._id,body);else await api.post('/posts',body);
      form.dataset.published='yes';try{localStorage.removeItem(key);}catch{}
      setOpen(false);
      onPosted();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  if (!open) return <button className="rounded-full bg-[#206f60] px-5 py-3 text-white" onClick={() => { setMessage(''); setOpen(true); }}>{post?'Sửa bài':'Tạo bài viết'}</button>;
  return <form ref={formRef} onSubmit={publish} className="rounded-2xl border bg-white p-5">
    <fieldset disabled={busy} className="space-y-3">
      <legend className="mb-3 font-bold">Viết nhật ký</legend>
      <label className="block">Tiêu đề<input name="title" defaultValue={post?.title} required minLength={5} maxLength={120} className={field} /></label>
      <label className="block">Nội dung<textarea name="content" defaultValue={post?.content} required maxLength={5000} rows={4} placeholder="Bạn đã trải nghiệm gì? Thêm #hashtag nếu muốn." className={field} /></label>
      <label className="block">Địa điểm<input name="location" defaultValue={post?.location?.name} required maxLength={120} className={field} /></label>
      <label className="block">Ngày đi<input name="tripDate" defaultValue={post?.tripDate?.slice(0,10)} type="date" required className={field} /></label>
      <label className="block">Chi phí (đồng)<input name="cost" type="number" min="0" max="999999999999" defaultValue={post?.cost||0} required className={field} /></label>
      <label className="block">Người xem<select name="visibility" defaultValue={post?.visibility||"public"} className={field}><option value="public">Công khai</option><option value="followers">Người theo dõi</option></select></label>
      {post?.images?.map(i=><label key={i.publicId}><input type="checkbox" checked={keep.includes(i.publicId)} onChange={e=>setKeep(ids=>e.target.checked?[...ids,i.publicId]:ids.filter(id=>id!==i.publicId))}/> Giữ ảnh <img loading="lazy" width="90" src={i.url} alt={post.title}/></label>)}
      <small>Tự lưu nháp phần chữ trên thiết bị. Chọn lại ảnh khi mở bản nháp.</small>
      <label className="block">Ảnh (tùy chọn)<input className={field} type="file" name="images" multiple accept="image/jpeg,image/png,image/webp" /></label>
      {message && <p role="alert">{message}</p>}
      <button className="rounded-full bg-[#206f60] px-5 py-3 text-white">{busy ? 'Đang đăng…' : post?'Lưu thay đổi':'Đăng nhật ký'}</button>
      <button type="button" className="px-4 py-3" onClick={() => setOpen(false)}>Hủy</button>
    </fieldset>
  </form>;
}

