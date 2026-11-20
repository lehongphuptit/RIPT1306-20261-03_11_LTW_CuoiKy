import {useState} from 'react';
import {Heart, MessageCircle} from 'lucide-react';
import {Link} from 'react-router-dom';
import JournalDialog from './JournalDialog.jsx';
import PostOptions from './PostOptions.jsx';

export function GuestPrompt({postId,action,onClose}) {
  const state={postId,comment:action==='bình luận'};
  return <JournalDialog title="Đăng nhập hoặc đăng ký" onClose={onClose}>
    <p>Bạn cần đăng nhập để {action} bài viết này.</p>
    <div className="guest-auth-links"><Link to="/login" state={state}>Đăng nhập</Link><Link to="/register" state={state}>Đăng ký</Link></div>
  </JournalDialog>;
}

export default function GuestPostActions({post, showMenu=true}) {
  const [action, setAction] = useState('');

  return <>
    <button type="button" aria-label="Thích bài viết" onClick={()=>setAction('thả tim')}><Heart/> {post.likeCount || 0}</button>
    <button type="button" aria-label={'Bình luận ('+(post.commentCount || 0)+')'} onClick={()=>setAction('bình luận')}><MessageCircle/><span>{post.commentCount || 0} bình luận</span></button>
    {showMenu&&<PostOptions id={post._id} onGuestSave={()=>setAction('lưu')}/>}
    {action && <GuestPrompt postId={post._id} action={action} onClose={()=>setAction('')}/>}
  </>;
}
