import {useState} from 'react';

export default function CommentAvatar({author, className = "comment-avatar"}) {
  const url = author?.avatar?.url;
  const [failed,setFailed] = useState(null);
  const words = (author?.displayName || author?.username || '?').trim().split(/\s+/);
  const initials = (words[0][0] + (words.length>1 ? words.at(-1)[0] : '')).toUpperCase();
  return <span className={className} aria-hidden="true">{url && failed!==url
    ? <img src={url} alt="" onError={()=>setFailed(url)}/>
    : initials}</span>;
}
