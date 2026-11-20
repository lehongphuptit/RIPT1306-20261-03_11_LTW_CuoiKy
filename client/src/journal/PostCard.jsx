import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Heart,Bookmark,MessageCircle,Calendar,Wallet} from 'lucide-react';
import {api,errorMessage} from '../services/api.js';
import {Action,List,profileUrl} from './common.jsx';
import Composer from './Composer.jsx';

function Discussion({post,user,onCount}){
 const [revision,refresh]=useState(0),[reply,setReply]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const member=user?.role==='member';
 async function submit(e){
   e.preventDefault();const form=e.currentTarget;
   const content=form.elements.content.value.trim();if(!content)return;
   setBusy(true);setError('');
   try{await api.post('/posts/'+post._id+'/comments',{content,parentId:reply?._id});form.reset();setReply(null);refresh(v=>v+1);onCount(1);}
   catch(err){setError(errorMessage(err));}finally{setBusy(false);}
 }
 return <section><h3>Bình luận</h3><List url={'/posts/'+post._id+'/comments'} revision={revision} empty="Chưa có bình luận." render={c=>
 <div key={c._id} className={c.parent?'reply':'comment'}><b>{c.author?.displayName}</b>{c.parent&&<small> · Phản hồi</small>}<p>{c.content}</p>{member&&<Action aria-pressed={c.liked} run={async()=>{const path="/comments/"+c._id+"/like";if(c.liked)await api.delete(path);else await api.put(path);refresh(v=>v+1);}}>♥ {c.likeCount||0}</Action>}
 {member&&<button onClick={()=>setReply(c)}>Trả lời</button>}
 {member&&[post.author?._id,c.author?._id].includes(user._id)&&<Action run={async()=>{if(!confirm('Xóa bình luận và phản hồi liên quan?'))return;await api.delete('/comments/'+c._id);setReply(null);refresh(v=>v+1);await onCount();}}>Xóa</Action>}</div>}/>
 {member&&<form onSubmit={submit}>{reply&&<p>Trả lời {reply.author?.displayName} <button type="button" onClick={()=>setReply(null)}>Hủy</button></p>}
 <input name="content" required maxLength={1000} placeholder="Viết bình luận" aria-label="Bình luận"/><button disabled={busy}>Gửi</button></form>}{error&&<p role="alert">{error}</p>}</section>;
}
export default function PostCard({post,user,refresh,onRemoved}){
 const [saved,setSaved]=useState(!!post.saved);
 const [liked,setLiked]=useState(post.liked),[likes,setLikes]=useState(post.likeCount);
 const [comments,setComments]=useState(false),[count,setCount]=useState(post.commentCount);
 const [report,setReport]=useState(false),[reason,setReason]=useState('spam'),[reported,setReported]=useState(false);
 const member=user?.role==='member',own=member&&user._id===post.author?._id,url='/posts/'+post._id;
 return <article className="post"><div className="post-head"><span className="avatar">{post.author?.displayName?.split(/\s+/).slice(0,2).map(n=>n[0]).join('')}</span><div className="byline"><Link to={profileUrl(post.author?._id)}>{post.author?.displayName}</Link><small>@{post.author?.username} · {post.visibility==='public'?'Công khai':'Chỉ người theo dõi'}</small></div></div>
 {post.images?.map(i=><div className="image-wrap" key={i.publicId||i.url}><img className="post-cover" src={i.url} loading="lazy" alt={post.title}/><span className="location-tag">{post.location?.name}</span></div>)}
 <div className="post-body"><h3>{post.title}</h3><p className="content">{post.content}</p><div className="post-meta"><span><Calendar/>{new Date(post.tripDate).toLocaleDateString('vi-VN',{timeZone:'UTC'})}</span><span><Wallet/>{Number(post.cost).toLocaleString('vi-VN')} ₫</span><span>{post.location?.name}</span></div></div>
 <div className="post-actions">{member?<Action aria-pressed={liked} aria-label="Thích bài viết" run={async()=>{const r=liked?await api.delete(url+'/like'):await api.put(url+'/like');setLiked(r.data.liked);setLikes(v=>v+(r.data.liked?1:-1));}}><Heart size={18} fill={liked?'currentColor':'none'}/> {likes}</Action>:<span className="guest-like"><Heart/> {likes}</span>}
 <button onClick={()=>setComments(!comments)} aria-label={'Bình luận ('+count+')'}><MessageCircle/> {count} bình luận</button>
 {member&&<Action className={'save-post '+(saved?'is-saved':'')} aria-label={saved?'Đã lưu':'Lưu'} aria-pressed={saved} run={async()=>{const r=saved?await api.delete(url+"/save"):await api.put(url+"/save");setSaved(r.data.saved);if(!r.data.saved)onRemoved?.();}}><Bookmark size={16}/></Action>}
 {member&&!own&&<button disabled={reported} onClick={()=>setReport(!report)}>{reported?'Đã báo cáo':'Báo cáo'}</button>}</div>
 <div className="extras">{report&&<div><select aria-label="Lý do báo cáo" value={reason} onChange={e=>setReason(e.target.value)}>{Object.entries({spam:'Spam',offensive:'Phản cảm',false_info:'Thông tin sai',other:'Khác'}).map(([v,n])=><option key={v} value={v}>{n}</option>)}</select><Action run={async()=>{await api.post(url+'/reports',{reason});setReported(true);setReport(false);}}>Gửi báo cáo</Action></div>}
 {own&&<div className="actions"><Composer user={user} post={post} onPosted={refresh}/><Action run={async()=>{if(confirm('Xóa vĩnh viễn nhật ký này?')){await api.delete(url);refresh();}}}>Xóa bài</Action></div>}
 {comments&&<Discussion post={post} user={user} onCount={async delta=>{if(delta)setCount(n=>n+delta);else setCount((await api.get(url)).data.post.commentCount);}}/>}</div></article>;
}
