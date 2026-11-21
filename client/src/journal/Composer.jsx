import {confirmAction, notify} from './Feedback.jsx';
import JournalImage from './JournalImage.jsx';
import {useImagePreviews} from '../hooks/useImagePreviews.js';
import {readImages,saveImages} from './draftImages.js';
import JournalDialog from './JournalDialog.jsx';
import {useLayoutEffect,useRef,useState} from 'react';
import {api,errorMessage,postFieldErrors} from '../services/api.js';
export default function Composer({ onPosted, user, post, onCancel, initiallyOpen=false }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [busy, setBusy] = useState(false);
  const [keep,setKeep]=useState(()=>post?.images?.map(i=>i.publicId)||[]);
  const [fieldErrors,setFieldErrors]=useState({});
  const hint=name=>fieldErrors[name] && <small role="alert" className="field-error">{fieldErrors[name]}</small>;
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
  const revision = useRef(null);
  const endpoint = '/me/drafts/' + (post?._id || 'new');
  const [cloudImages, setCloudImages] = useState([]);
  const [conflict, setConflict] = useState(false);
  const names = ['title','content','location','tripDate','cost','visibility'];
  function snapshot(nextKeep = keep) {
    return {...Object.fromEntries(names.map(name => [name, formRef.current.elements[name].value])), keep:nextKeep};
  }
  function restore(fields) {
    formRef.current.reset();
    for (const name of names) if (typeof fields?.[name] === 'string') formRef.current.elements[name].value = fields[name];
    const existing = (post?.images || []).map(image => image.publicId);
    setKeep(fields?.keep ? existing.filter(id => fields.keep.includes(id)) : existing);
  }
  function saveText(nextKeep = keep, images = cloudImages) {
    try {
      touched.current = true;
      localStorage.setItem(key, JSON.stringify({...snapshot(nextKeep), revision:revision.current, cloudImages:images}));
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
    touched.current=false; revision.current=null; setHasDraft(false); setConflict(false);
    setCloudImages([]); setSelectedFiles([]);setFieldErrors({});
    setDraftStatus('');
    setLoadingImages(true);
    async function load() {
      const saved = JSON.parse(localStorage.getItem(key));
      const [local, remote] = await Promise.allSettled([readImages(key), api.get(endpoint)]);
      if (!active) return;
      const files = local.status === 'fulfilled' ? local.value || [] : [];
      const data = remote.status === 'fulfilled' ? remote.value.data : null;
      const hasLocal = Boolean(saved || files.length);
      touched.current = hasLocal;
      restore(hasLocal ? saved : data?.fields);
      setHasDraft(Boolean(hasLocal || data?.fields));
      setSelectedFiles(files);
      setCloudImages(hasLocal ? saved?.cloudImages || [] : data?.images || []);
      revision.current = hasLocal && saved?.revision ? saved.revision : data?.revision || null;
      setConflict(Boolean(hasLocal && data && (saved?.revision ? saved.revision !== data.revision : data.fields)));
      setDraftStatus(hasLocal ? 'Đã khôi phục bản trên thiết bị.' : data?.fields ? 'Đã mở bản nháp của tài khoản.' : '');
      if (!data) setMessage('Chưa tải được bản nháp tài khoản. Hãy kiểm tra kết nối rồi mở lại.');
      if (local.status === 'rejected') setMessage('Chưa đọc được ảnh nháp trên thiết bị.');
    }
    load().catch(() => { if (active) setMessage('Chưa mở được bản nháp.'); })
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
    if (files.length + keep.length + cloudImages.length > 6 || files.some(file=>file.size>5*1024*1024 || !['image/png','image/jpeg','image/webp'].includes(file.type))) {
      event.target.value='';
      setFieldErrors(old => ({ ...old, images: 'Chọn tối đa 6 ảnh JPEG, PNG hoặc WebP, mỗi ảnh tối đa 5 MB.' }));
      return;
    }
    updateImages(files);
  }
  function updateImages(files) {
    setFieldErrors(old => ({ ...old, images: undefined }));
    setMessage('');
    saveText();
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
    if (!await confirmAction('Bỏ bản nháp này cùng các ảnh đã chọn?', 'Bỏ bản nháp')) return;
    setBusy(true);
    try {
      const {data} = await api.delete(endpoint,{data:{draftRevision:revision.current}});
      revision.current = data.revision;
      await imageWrite.current;
      await saveImages(key, []);
      localStorage.removeItem(key);
      formRef.current.reset();
      setKeep(post?.images?.map(image=>image.publicId)||[]);
      setSelectedFiles([]);
      setCloudImages([]);
      touched.current=false;
      setHasDraft(false);
      setMessage('');
      setDraftStatus('Đã bỏ bản nháp.');notify("Đã bỏ bản nháp.");
      imageWrite.current=Promise.resolve(true);
    } catch (error) { report(error); }
    finally { setBusy(false); }
  }
  async function publish(event) {
    event.preventDefault();
    if (busy || conflict || !revision.current) return;
    setFieldErrors({});
    const form=event.currentTarget; const body = new FormData(form);
    const files = selectedFiles;
    if (files.length + keep.length + cloudImages.length > 6) { setFieldErrors({images: 'Chọn tối đa 6 ảnh.'}); return; }
    if (files.some(file => file.size > 5 * 1024 * 1024)) { setFieldErrors({images: 'Mỗi ảnh tối đa 5 MB.'}); return; }
    if(post)body.set('keepImageIds',JSON.stringify(keep));
    body.delete('images');
    body.set('draftRevision',revision.current);
    body.set('draftImageIds',JSON.stringify(cloudImages.map(i=>i.publicId)));
    files.forEach(file => body.append('images', file));
    body.set('location', JSON.stringify({ name: body.get('location').trim() }));
    setBusy(true);
    setMessage('');
    try {
      if(post)await api.patch('/posts/'+post._id,body);else await api.post('/posts',body);
      notify(post?"Đã lưu thay đổi.":"Đã đăng nhật ký.");
      await imageWrite.current;
      try { localStorage.removeItem(key); await saveImages(key,[]); } catch { /* Publication already succeeded. */ }
      setSelectedFiles([]); setOpen(false);
      onPosted();
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }
  if (!open) return <button className="rounded-full bg-[#206f60] px-5 py-3 text-white" onClick={() => { setSelectedFiles([]); setKeep(post?.images?.map(image=>image.publicId)||[]); setMessage(''); setOpen(true); }}>{post?'Sửa bài':'Tạo bài viết'}</button>;
  async function close() {
    if (busy || loadingImages) return;
    if (conflict) {
      if (await confirmAction('Đóng và giữ bản trên thiết bị này để xử lý sau?')) { setOpen(false); onCancel?.(); }
      return;
    }
    setBusy(true);
    try {
    const textSaved = !touched.current || saveText();
    const imagesSaved = await imageWrite.current;
    if (touched.current) {
      if (!revision.current) {
        if (!textSaved || !imagesSaved || !await confirmAction('Chưa đồng bộ. Đóng với bản lưu trên thiết bị này?')) return;
      } else {
        const body = new FormData();
        body.set('fields',JSON.stringify(snapshot()));
        body.set('draftRevision',revision.current);
        body.set('draftImageIds',JSON.stringify(cloudImages.map(i=>i.publicId)));
        selectedFiles.forEach(file => body.append('images',file));
        const {data} = await api.put(endpoint,body,{timeout:120000});
        revision.current=data.revision;
        localStorage.removeItem(key);
        await saveImages(key,[]);
      }
    }
    setSelectedFiles([]); setOpen(false); onCancel?.();
    } catch (error) { report(error); }
    finally { setBusy(false); }
  }
  function report(error) {
    if (error.response?.status === 409) setConflict(true);
    const errors=postFieldErrors(error);
    setFieldErrors(errors);
    setMessage(Object.keys(errors).length ? '' : errorMessage(error));
  }
  async function resolveConflict(useLocal) {
    if (!await confirmAction(useLocal ? 'Dùng nội dung trên máy này cho lần lưu tiếp theo?' : 'Thay nội dung trên máy này bằng bản của tài khoản?')) return;
    setBusy(true);
    try {
      const {data} = await api.get(endpoint);
      if (useLocal) {
        const retained = cloudImages.filter(i=>data.images.some(current=>current.publicId===i.publicId));
        if (retained.length !== cloudImages.length && !await confirmAction('Một số ảnh đã bị xóa trên thiết bị khác. Tiếp tục với các ảnh còn lại?')) return;
        revision.current=data.revision;
        setCloudImages(retained); saveText(keep,retained);
      } else {
        await imageWrite.current;
        await saveImages(key,[]);
        localStorage.removeItem(key);
        revision.current=data.revision; touched.current=false;
        restore(data.fields); setCloudImages(data.images); setSelectedFiles([]); setHasDraft(Boolean(data.fields));
        setDraftStatus('Đã tải bản mới nhất.');
      }
      setConflict(false); setMessage('');
    } catch (error) { report(error); }
    finally { setBusy(false); }
  }
  return <JournalDialog title={post?'Chỉnh sửa bài viết':'Tạo bài viết'} onClose={close}><form ref={formRef} onSubmit={publish} onChange={event=>{const name=event.target.name;if(names.includes(name)){setFieldErrors(old=>({...old,[name]:undefined}));saveText();}}} className="journal-composer">
    <fieldset disabled={busy || loadingImages} className="space-y-3">
      <legend className="mb-3 font-bold">Viết nhật ký</legend>
      {hasDraft && <div className="draft-choices"><button type="button" onClick={()=>{setHasDraft(false);formRef.current.elements.title.focus();}}>Viết tiếp</button><button type="button" onClick={discard}>Bỏ bản nháp</button></div>}
      <label className="block">Tiêu đề<input name="title" defaultValue={post?.title} required minLength={5} maxLength={120} className={field} />{hint('title')}</label>
      <label className="block">Nội dung<textarea name="content" defaultValue={post?.content} required maxLength={5000} rows={4} placeholder="Bạn đã trải nghiệm gì? Thêm #hashtag nếu muốn." className={field} />{hint('content')}</label>
      <label className="block">Địa điểm<input name="location" defaultValue={post?.location?.name} required maxLength={120} className={field} />{hint('location')}</label>
      <label className="block">Ngày đi<input name="tripDate" defaultValue={post?.tripDate?.slice(0,10)} type="date" required className={field} />{hint('tripDate')}</label>
      <label className="block">Chi phí (đồng)<input name="cost" type="number" min="0" max="999999999999" defaultValue={post?.cost||0} required className={field} />{hint('cost')}</label>
      <label className="block">Người xem<select name="visibility" defaultValue={post?.visibility||"public"} className={field}><option value="public">Công khai</option><option value="followers">Người theo dõi</option><option value="private">Riêng tư (chỉ mình tôi)</option></select>{hint('visibility')}</label>
      {post?.images?.map(i=><label key={i.publicId}><input type="checkbox" checked={keep.includes(i.publicId)} onChange={e=>{const ids=e.target.checked?[...keep,i.publicId]:keep.filter(id=>id!==i.publicId);setKeep(ids);saveText(ids);}}/> Giữ ảnh <JournalImage loading="lazy" width="90" src={i.url} alt={post.title}/></label>)}
      <small>{draftStatus || 'Bản nháp tự lưu trên thiết bị. Đóng khung soạn để đồng bộ với tài khoản.'}</small>
      {conflict && <div role="alert">Bản nháp trên hai thiết bị khác nhau.
        <button type="button" onClick={()=>resolveConflict(false)}>Mở bản trên tài khoản</button>
        <button type="button" onClick={()=>resolveConflict(true)}>Giữ nội dung trên máy này</button>
      </div>}
      <label className="block">Ảnh ({selectedFiles.length + cloudImages.length + keep.length}/6)<input className={field} type="file" name="images" onChange={chooseFiles} multiple accept="image/jpeg,image/png,image/webp" />{hint('images')}</label>
      {cloudImages.length > 0 && <ul className="composer-previews">{cloudImages.map((image,index)=><li key={image.publicId}><JournalImage src={image.url} alt={'Ảnh nháp '+(index+1)}/><button type="button" onClick={()=>{const remaining=cloudImages.filter(i=>i.publicId!==image.publicId);setCloudImages(remaining);saveText(keep,remaining);}}>Bỏ ảnh</button></li>)}</ul>}
      {previews.length > 0 && <ul className="composer-previews" aria-label="Ảnh đã chọn">
        {previews.map(({file,url})=><li key={url}><img src={url} alt={'Xem trước '+file.name}/><span title={file.name}>{file.name}</span><button type="button" aria-label={"Bỏ ảnh "+file.name} onClick={()=>{formRef.current.elements.images.value="";updateImages(selectedFiles.filter(item=>item!==file));}}>Bỏ ảnh</button></li>)}
      </ul>}
      {message && <p role="alert">{message}</p>}
      <button disabled={conflict || !revision.current} className="composer-submit">{busy ? 'Đang xử lý…' : post?'Lưu thay đổi':'Đăng nhật ký'}</button>
      <button type="button" className="px-4 py-3" onClick={close}>Lưu nháp và đóng</button>
    </fieldset>
  </form></JournalDialog>;
}
