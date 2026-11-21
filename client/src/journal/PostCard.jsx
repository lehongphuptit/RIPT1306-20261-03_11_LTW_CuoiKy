import {confirmAction, notify} from './Feedback.jsx';
import JournalImage from './JournalImage.jsx';
import CommentAvatar from './CommentAvatar.jsx';
import CommentOptions from './CommentOptions.jsx';
import GuestPostActions, {GuestPrompt} from './GuestPostActions.jsx';
import PostOptions from './PostOptions.jsx';
import JournalDialog from './JournalDialog.jsx';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Heart,Send,MessageCircle,Calendar,Wallet} from 'lucide-react';
import {api,errorMessage} from '../services/api.js';
import {Action,List,profileUrl} from './common.jsx';
import TaggedText from './TaggedText.jsx';
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
 return <section><List url={'/posts/'+post._id+'/comments'} revision={revision} empty="Chưa có bình luận." render={c=>
 <div key={c._id} className={"discussion-entry"+(c.parent?" is-reply":"")}><CommentAvatar author={c.author}/><strong>{c.author?.displayName||c.author?.username}</strong><CommentOptions comment={c} user={user} onDelete={member&&[post.author?._id,c.author?._id].includes(user._id)?async()=>{if(await confirmAction("Xóa bình luận và phản hồi liên quan?", 'Xóa bình luận')){await api.delete("/comments/"+c._id);notify("Đã xóa bình luận.");setReply(null);refresh(v=>v+1);await onCount();}}:undefined} onEdited={()=>refresh(v=>v+1)}/><p>{c.content}</p><div className="discussion-actions">{member&&<Action aria-pressed={c.liked} run={async()=>{const path="/comments/"+c._id+"/like";if(c.liked)await api.delete(path);else await api.put(path);refresh(v=>v+1);}}><Heart size={15}/> {c.likeCount||0}</Action>}
 {member&&<button onClick={()=>setReply(c)}>Trả lời</button>}
 </div></div>}/>
 {member&&<form className="discussion-input" onSubmit={submit}>{reply&&<p>Trả lời {reply.author?.displayName} <button type="button" onClick={()=>setReply(null)}>Hủy</button></p>}
 <input name="content" required maxLength={1000} placeholder="Viết bình luận" aria-label="Bình luận"/><button aria-label="Gửi bình luận" disabled={busy}><Send size={19}/></button></form>}{error&&<p role="alert">{error}</p>}</section>;
}
export default function PostCard({post,user,refresh,onRemoved}){
 const [guestSave,setGuestSave]=useState(false);
 const [editing,setEditing]=useState(false);
 const [saved,setSaved]=useState(!!post.saved);
 const [liked,setLiked]=useState(post.liked),[likes,setLikes]=useState(post.likeCount);
 const [comments,setComments]=useState(false),[count,setCount]=useState(post.commentCount);
 const [report,setReport]=useState(false),[reason,setReason]=useState('spam'),[note,setNote]=useState(''),[reported,setReported]=useState(false);
 const member=user?.role==='member',own=member&&user._id===post.author?._id,url='/posts/'+post._id;
 return <article className="post"><div className="post-head"><span className="avatar">{post.author?.displayName?.split(/\s+/).slice(0,2).map(n=>n[0]).join('')}</span><div className="byline"><div className="post-author-row"><Link to={profileUrl(post.author?._id)}>{post.author?.displayName}</Link>
 {!user&&<PostOptions id={post._id} onGuestSave={()=>setGuestSave(true)}/>}
 {member&&<PostOptions id={post._id} saved={saved} onSaved={value=>{setSaved(value);if(!value)onRemoved?.();}} onReport={own?undefined:()=>setReport(true)} reported={reported} onEdit={own?()=>setEditing(true):undefined} onDelete={own?async()=>{if(await confirmAction("Xóa vĩnh viễn nhật ký này?", 'Xóa bài')){await api.delete(url);notify("Đã xóa bài viết.");refresh();}}:undefined}/>}</div><small>@{post.author?.username} · {post.visibility==='private'?'Riêng tư':post.visibility==='followers'?'Chỉ người theo dõi':'Công khai'}</small></div></div>
 {post.images?.map(i=><div className="image-wrap" key={i.publicId||i.url}><Link to={url}><JournalImage className="post-cover" src={i.url} loading="lazy" alt={post.title}/></Link><span className="location-tag">{post.location?.name}</span></div>)}
 <div className="post-body">{own&&post.status==='hidden'&&<Link to={url}>Bài viết đang bị ẩn · Xem quyết định</Link>}<h3><Link to={url}>{post.title}</Link></h3><p className="content"><TaggedText text={post.content}/></p><div className="post-meta"><span><Calendar/>{new Date(post.tripDate).toLocaleDateString('vi-VN',{timeZone:'UTC'})}</span><span><Wallet/>{Number(post.cost).toLocaleString('vi-VN')} ₫</span><span>{post.location?.name}</span></div></div>
 <div className="post-actions">{!user?<GuestPostActions post={post} showMenu={false}/>:<>{member?<Action aria-pressed={liked} aria-label="Thích bài viết" run={async()=>{const r=liked?await api.delete(url+'/like'):await api.put(url+'/like');setLiked(r.data.liked);setLikes(v=>v+(r.data.liked?1:-1));}}><Heart size={18} fill={liked?'currentColor':'none'}/> {likes}</Action>:<span className="guest-like"><Heart/> {likes}</span>}
 <button onClick={()=>setComments(!comments)} aria-label={'Bình luận ('+count+')'}><MessageCircle/> {count} bình luận</button>
 </>}</div>
 <div className="extras">{guestSave&&!user&&<GuestPrompt postId={post._id} action="lưu" onClose={()=>setGuestSave(false)}/>}
 {report&&<JournalDialog title="Báo cáo bài viết" onClose={()=>setReport(false)}><select aria-label="Lý do báo cáo" value={reason} onChange={e=>setReason(e.target.value)}>{Object.entries({spam:'Spam',offensive:'Phản cảm',false_info:'Thông tin sai',other:'Khác'}).map(([v,n])=><option key={v} value={v}>{n}</option>)}</select>
 {reason==='other'&&<label className="report-note">Lý do báo cáo<textarea required maxLength={500} rows={3} value={note} onChange={e=>setNote(e.target.value)}/></label>}
 <Action className="report-submit" disabled={reason==='other'&&!note.trim()} run={async()=>{await api.post(url+'/reports',{reason,note:reason==='other'?note.trim():''});setReported(true);setReport(false);notify("Đã gửi báo cáo.");}}>Gửi báo cáo</Action></JournalDialog>}
 {own&&editing&&<Composer user={user} post={post} initiallyOpen onCancel={()=>setEditing(false)} onPosted={()=>{setEditing(false);refresh();}}/>}
 {comments&&<JournalDialog hideTitle title="Bình luận" onClose={()=>setComments(false)}><Discussion post={post} user={user} onCount={async delta=>{if(delta)setCount(n=>n+delta);else setCount((await api.get(url)).data.post.commentCount);}}/></JournalDialog>}</div></article>;
}
