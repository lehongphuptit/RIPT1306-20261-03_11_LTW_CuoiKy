import JournalImage from './JournalImage.jsx';
import {useImagePreviews} from '../hooks/useImagePreviews.js';
import {readImages,saveImages} from './draftImages.js';
import JournalDialog from './JournalDialog.jsx';
import {useLayoutEffect,useRef,useState} from 'react';
import {api,errorMessage} from '../services/api.js';
export default function Composer({ onPosted, user, post, onCancel, initiallyOpen=false }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [busy, setBusy] = useState(false);
  const [keep,setKeep]=useState(()=>post?.images?.map(i=>i.publicId)||[]);
  const [message, setMessage] = useState('');
  const [selectedFiles,setSelectedFiles] = useState([]);
  const previews = useImagePreviews(selectedFiles);
  const field = 'mt-1 block w-full rounded-xl border px-3 py-2 text-base';
  const key='wanderly:journal:'+user._id+':'+(post?._id||'new');
  const formRef=useRef(null);
  const imageWrite = useRef(Promise.resolve(true));
  const imageVersion = useRef(0);
  const [draftStatus, setDraftStatus] = useState('');
  const [loadingImages, setLoadingImages] = useState(false);
  const [hasDraft,setHasDraft] = useState(false);
  const touched = useRef(false);
  const names = ['title','content','location','tripDate','cost','visibility'];
  function saveText(nextKeep = keep) {
    try {
      touched.current = true;
      const fields = Object.fromEntries(names.map(name => [name, formRef.current.elements[name].value]));
      localStorage.setItem(key, JSON.stringify({...fields, keep:nextKeep}));
      setDraftStatus('Đã lưu nháp trên thiết bị.');
      return true;
    } catch {
      setMessage('Chưa lưu được nội dung nháp. Hãy sao chép nội dung trước khi đóng.');
      return false;
    }
  }
  useLayoutEffect(() => {
    if (!open) return;
    let active = true;
    touched.current=false; setHasDraft(false);
    setDraftStatus('');
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved) {
        touched.current=true; setHasDraft(true);
        for (const name of names) if (typeof saved[name] === 'string') formRef.current.elements[name].value = saved[name];
        if (Array.isArray(saved.keep)) setKeep((post?.images || []).map(i=>i.publicId).filter(id=>saved.keep.includes(id)));
        setDraftStatus('Đã khôi phục bản nháp.');
      }
    } catch { setMessage('Chưa đọc được nội dung nháp trên thiết bị.'); }
    setLoadingImages(true);
    readImages(key).then(files => {
      if (active && files?.length) { setHasDraft(true); setSelectedFiles(files); setDraftStatus('Đã khôi phục bản nháp.'); }
    }).catch(() => { if (active) setMessage('Trình duyệt chưa cho phép đọc ảnh nháp.'); })
      .finally(() => { if (active) setLoadingImages(false); });
    return () => { active = false; };
  }, [open,key]);
  function chooseFiles(event) {
    const signature = file => JSON.stringify([file.name,file.size,file.lastModified,file.type]);
    const seen = new Set(selectedFiles.map(signature));
    const files = [...selectedFiles];
    for (const file of event.target.files || []) {
      const key = signature(file);
      if (!seen.has(key)) { files.push(file); seen.add(key); }
    }
    event.target.value = '';
    if (files.length + keep.length > 6 || files.some(file=>file.size>5*1024*1024 || !['image/png','image/jpeg','image/webp'].includes(file.type))) {
      event.target.value='';
      setMessage('Chọn tối đa 6 ảnh JPEG, PNG hoặc WebP, mỗi ảnh tối đa 5 MB.');
      return;
    }
    updateImages(files);
  }
  function updateImages(files) {
    setMessage('');
    setSelectedFiles(files);
    const version = ++imageVersion.current;
    setDraftStatus('Đang lưu ảnh nháp…');
    imageWrite.current = saveImages(key,files).then(()=>{
      if (imageVersion.current===version) setDraftStatus('Đã lưu ảnh nháp trên thiết bị.');
      return true;
    }).catch(()=>{
      if (imageVersion.current===version) setMessage('Không đủ bộ nhớ hoặc chưa có quyền lưu ảnh nháp. Bạn vẫn có thể đăng bài.');
      return false;
    });
  }
  async function discard() {
    if (!window.confirm('Bỏ bản nháp này cùng các ảnh đã chọn?')) return;
    setBusy(true);
    try {
      await imageWrite.current;
      await saveImages(key, []);
      localStorage.removeItem(key);
      formRef.current.reset();
      setKeep(post?.images?.map(image=>image.publicId)||[]);
      setSelectedFiles([]);
      touched.current=false;
      setHasDraft(false);
      setMessage('');
      setDraftStatus('Đã bỏ bản nháp.');
      imageWrite.current=Promise.resolve(true);
    } catch { setMessage('Chưa xóa được bản nháp. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  }
  async function publish(event) {
    event.preventDefault();
    if (busy) return;
    const form=event.currentTarget; const body = new FormData(form);
    const files = selectedFiles;
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
      await imageWrite.current;
      try { localStorage.removeItem(key); await saveImages(key,[]); } catch { /* Publication already succeeded. */ }
      setSelectedFiles([]); setOpen(false);
      onPosted();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  if (!open) return <button className="rounded-full bg-[#206f60] px-5 py-3 text-white" onClick={() => { setSelectedFiles([]); setKeep(post?.images?.map(image=>image.publicId)||[]); setMessage(''); setOpen(true); }}>{post?'Sửa bài':'Tạo bài viết'}</button>;
  async function close() {
    if (busy) return;
    const textSaved = !touched.current || saveText();
    const imagesSaved = await imageWrite.current;
    if ((!textSaved || !imagesSaved) && !window.confirm('Một phần bản nháp chưa lưu được. Bạn vẫn muốn đóng?')) return;
    setSelectedFiles([]); setOpen(false); onCancel?.();
  }
  return <JournalDialog title={post?'Chỉnh sửa bài viết':'Tạo bài viết'} onClose={close}><form ref={formRef} onSubmit={publish} onChange={event=>{if(names.includes(event.target.name))saveText();}} className="journal-composer">
    <fieldset disabled={busy || loadingImages} className="space-y-3">
      <legend className="mb-3 font-bold">Viết nhật ký</legend>
      {hasDraft && <div className="draft-choices"><button type="button" onClick={()=>{setHasDraft(false);formRef.current.elements.title.focus();}}>Viết tiếp</button><button type="button" onClick={discard}>Bỏ bản nháp</button></div>}
      <label className="block">Tiêu đề<input name="title" defaultValue={post?.title} required minLength={5} maxLength={120} className={field} /></label>
      <label className="block">Nội dung<textarea name="content" defaultValue={post?.content} required maxLength={5000} rows={4} placeholder="Bạn đã trải nghiệm gì? Thêm #hashtag nếu muốn." className={field} /></label>
      <label className="block">Địa điểm<input name="location" defaultValue={post?.location?.name} required maxLength={120} className={field} /></label>
      <label className="block">Ngày đi<input name="tripDate" defaultValue={post?.tripDate?.slice(0,10)} type="date" required className={field} /></label>
      <label className="block">Chi phí (đồng)<input name="cost" type="number" min="0" max="999999999999" defaultValue={post?.cost||0} required className={field} /></label>
      <label className="block">Người xem<select name="visibility" defaultValue={post?.visibility||"public"} className={field}><option value="public">Công khai</option><option value="followers">Người theo dõi</option><option value="private">Riêng tư (chỉ mình tôi)</option></select></label>
      {post?.images?.map(i=><label key={i.publicId}><input type="checkbox" checked={keep.includes(i.publicId)} onChange={e=>{const ids=e.target.checked?[...keep,i.publicId]:keep.filter(id=>id!==i.publicId);setKeep(ids);saveText(ids);}}/> Giữ ảnh <JournalImage loading="lazy" width="90" src={i.url} alt={post.title}/></label>)}
      <small>{draftStatus || 'Nội dung và ảnh được tự lưu nháp trên trình duyệt này.'}</small>
      <label className="block">Ảnh ({selectedFiles.length + keep.length}/6)<input className={field} type="file" name="images" onChange={chooseFiles} multiple accept="image/jpeg,image/png,image/webp" /></label>
      {previews.length > 0 && <ul className="composer-previews" aria-label="Ảnh đã chọn">
        {previews.map(({file,url})=><li key={url}><img src={url} alt={'Xem trước '+file.name}/><span title={file.name}>{file.name}</span><button type="button" aria-label={"Bỏ ảnh "+file.name} onClick={()=>{formRef.current.elements.images.value="";updateImages(selectedFiles.filter(item=>item!==file));}}>Bỏ ảnh</button></li>)}
      </ul>}
      {message && <p role="alert">{message}</p>}
      <button className="composer-submit">{busy ? 'Đang đăng…' : post?'Lưu thay đổi':'Đăng nhật ký'}</button>
      <button type="button" className="px-4 py-3" onClick={close}>Lưu nháp và đóng</button>
    </fieldset>
  </form></JournalDialog>;
}
