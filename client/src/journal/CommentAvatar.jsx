import {useState} from 'react';

export default function CommentAvatar({author}) {
  const url = author?.avatar?.url;
  const [failed,setFailed] = useState(null);
  const words = (author?.displayName || author?.username || '?').trim().split(/\s+/);
  const initials = (words[0][0] + (words.length>1 ? words.at(-1)[0] : '')).toUpperCase();
  return <span className="comment-avatar" aria-hidden="true">{url && failed!==url
    ? <img src={url} alt="" onError={()=>setFailed(url)}/>
    : initials}</span>;
}
