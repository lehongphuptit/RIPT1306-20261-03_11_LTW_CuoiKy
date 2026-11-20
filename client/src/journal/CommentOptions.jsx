import {MoreHorizontal} from 'lucide-react';
import {Action} from './common.jsx';
import {useEffect,useRef,useState} from 'react';
import JournalDialog from './JournalDialog.jsx';
import {api,errorMessage} from '../services/api.js';

export default function CommentOptions({comment,user,onEdited,onDelete}) {
  const own = user?._id === comment.author?._id;
  const [open,setOpen] = useState(false);
  const [text,setText] = useState('');
  const [reason,setReason] = useState('spam');
  const [reported,setReported] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const trigger = useRef(null);
  const menu=useRef(null);
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{
    if(!expanded)return;
    function outside(e){if(!menu.current?.contains(e.target))setExpanded(false);}
    document.addEventListener('pointerdown',outside);document.addEventListener('focusin',outside);
    return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('focusin',outside);};
  },[expanded]);
  if(user?.role !== 'member') return null;
  const title = own ? 'Sửa bình luận' : 'Báo cáo bình luận';
  function close() { setOpen(false); trigger.current?.focus(); }
  async function submit(event) {
    event.preventDefault();
    if(busy || (own && !text.trim())) return;
    setBusy(true); setError('');
    const url='/comments/'+comment._id;
    try {
      if(own) {
        const {data}=await api.patch(url,{content:text.trim()});
        onEdited(data.content);
      } else {
        await api.post(url+'/reports',{reason});
        setReported(true);
      }
      close();
    } catch(err) {
      if(!own && err.response?.status===409) {setReported(true);close();}
      else setError(errorMessage(err));
    } finally {setBusy(false);}
  }
  return <>
    <span className="comment-tools" ref={menu} onKeyDown={e=>{if(e.key==='Escape'&&expanded){e.stopPropagation();setExpanded(false);trigger.current.focus();}}}>
    <button type="button" ref={trigger} aria-expanded={expanded} aria-label="Tùy chọn bình luận" onClick={()=>setExpanded(!expanded)}><MoreHorizontal size={19}/></button>
    {expanded&&<span className="comment-tool-list"><button type="button" disabled={reported} aria-label={reported?'Đã báo cáo bình luận':title}
      onClick={()=>{setExpanded(false);setText(comment.content);setError('');setOpen(true);}}>
      {own?'Sửa':reported?'Đã báo cáo':'Báo cáo'}
    </button>
    {onDelete&&<Action run={async()=>{await onDelete();setExpanded(false);}}>Xóa</Action>}</span>}</span>
    {open && <JournalDialog title={title} onClose={()=>{if(!busy)close();}}>
      <form className="comment-options-form" onSubmit={submit}>
        {own?<label>Nội dung bình luận<textarea autoFocus required maxLength={1000} value={text} onChange={e=>setText(e.target.value)}/></label>
          :<><blockquote>{comment.content}</blockquote><label>Lý do báo cáo<select value={reason} onChange={e=>setReason(e.target.value)}>
            <option value="spam">Spam</option><option value="offensive">Nội dung phản cảm</option><option value="false_info">Thông tin sai</option><option value="other">Khác</option>
          </select></label></>}
        {error&&<p role="alert">{error}</p>}
        <button className="primary" disabled={busy || (own && !text.trim())}>{own?'Lưu thay đổi':'Gửi báo cáo bình luận'}</button>
      </form>
    </JournalDialog>}
  </>;
}
