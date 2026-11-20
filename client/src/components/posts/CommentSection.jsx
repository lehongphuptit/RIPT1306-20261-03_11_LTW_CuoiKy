import CommentAvatar from '../../journal/CommentAvatar.jsx';
import CommentOptions from '../../journal/CommentOptions.jsx';
import {useLocation} from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { CornerDownRight, Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { errorMessage, postService } from '../../services/postService';

export default function CommentSection({ postId, postAuthorId, currentUser, onCountChange }) {
  const {hash}=useLocation();
  useEffect(()=>{
    if(hash==='#write-comment')document.getElementById('write-comment')?.focus();
    else if(hash==='#comments')document.getElementById('comments')?.scrollIntoView();
  },[hash,postId,currentUser?._id]);
  const [comments, setComments] = useState([]);
  const roots=new Map(comments.filter(c=>!c.parent).map(c=>[c._id,{...c,replies:[]}]));
  const threads=[];
  for(const c of comments){
    if(!c.parent)threads.push(roots.get(c._id));
    else if(roots.has(c.parent))roots.get(c.parent).replies.push(c);
    else threads.push(c);
  }
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canComment = currentUser && currentUser.role === 'member';

  const fetchComments = async (cursor = null, append = false) => {
    try {
      const data = await postService.getComments(postId, cursor);
      const items = data.data;
      setComments((prev) => (append ? [...prev, ...items] : items));
      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.nextCursor));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Nội dung bình luận không được để trống.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const payload = {
        content: trimmed,
        ...(replyTo ? { parentId: replyTo.id } : {}),
      };
      const {comment}=await postService.createComment(postId,payload);
      setComments(prev=>[{...comment,author:currentUser},...prev]);
      setContent('');
      setReplyTo(null);
      onCountChange?.(1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (comment, parentId = null) => {
    if (!window.confirm('Bạn có chắc muốn xoá bình luận này?')) return;
    try {
      await postService.deleteComment(comment._id);
      setComments(prev=>prev.filter(c=>c._id!==comment._id&&c.parent!==comment._id));
      const refreshed=await postService.getPostById(postId);
      onCountChange?.(0,refreshed.post.commentCount);
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const canDeleteComment = (authorId) => {
    if (currentUser?.role !== "member") return false;
    return (
      currentUser._id === authorId ||
      currentUser._id === postAuthorId
    );
  };

  if (!currentUser && !loading && comments.length===0 && !error) return null;
  return (
    <div id="comments" className="space-y-4">
      <h3 className="text-base font-bold text-[#162424] dark:text-[#e8f0f0]">Bình luận</h3>

      {canComment ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          {replyTo && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#1F3333]/10 text-xs text-[#162424] dark:text-[#e8f0f0]">
              <span>
                Đang trả lời <strong>{replyTo.authorName}</strong>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="underline hover:text-red-600"
              >
                Huỷ
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              id="write-comment" type="text"
              maxLength={1000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={replyTo ? 'Viết câu trả lời...' : 'Chia sẻ cảm nghĩ của bạn...'}
              className="flex-1 rounded-full bg-white dark:bg-[#182828] px-4 py-2.5 text-sm border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
            />
            <button
              aria-label="Gửi bình luận" type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-full bg-[#1F3333] hover:bg-[#142222] text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />

            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-[#4a6363]">Đang tải bình luận...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[#4a6363] dark:text-[#9eb7b8]">Chưa có bình luận nào.</p>
      ) : (
        <div className="space-y-4">
          {threads.map((comment) => (
            <div
              key={comment._id}
              className="p-3.5 rounded-2xl bg-white/65 dark:bg-[#182828]/75 border border-white/50 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="detail-comment-author"><CommentAvatar author={comment.author}/><Link
                    to={`/u/${comment.author?.username}`}
                    className="text-sm font-bold text-[#162424] dark:text-[#e8f0f0] hover:underline"
                  >
                    {comment.author?.displayName || comment.author?.username}
                  </Link><CommentOptions comment={comment} onDelete={canDeleteComment(comment.author?._id)?()=>handleDelete(comment,null):undefined} user={currentUser} onEdited={content=>setComments(list=>list.map(item=>item._id===comment._id?{...item,content}:item))}/></div>
                  <p className="text-sm text-[#162424] dark:text-[#e8f0f0] mt-0.5 whitespace-pre-line">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[#4a6363] dark:text-[#9eb7b8]">
                    <span>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>

                    {canComment && (
                      <button
                        type="button"
                        onClick={() =>
                          setReplyTo({
                            id: comment._id,
                            authorName: comment.author?.displayName || comment.author?.username,
                          })
                        }
                        className="font-semibold hover:text-[#1F3333] dark:hover:text-white"
                      >
                        Trả lời
                      </button>
                    )}
                  </div>
                </div>


              </div>

              {comment.replies?.length > 0 && (
                <div className="pl-4 border-l-2 border-[#1F3333]/20 space-y-2.5 pt-1">
                  {comment.replies.map((reply) => (
                    <div key={reply._id} className="flex items-start justify-between gap-2">
                      <div className="flex gap-2">
                        <CornerDownRight className="w-3.5 h-3.5 text-[#4a6363] shrink-0 mt-1" />
                        <div>
                          <div className="detail-comment-author"><CommentAvatar author={reply.author}/><Link
                            to={`/u/${reply.author?.username}`}
                            className="text-xs font-bold text-[#162424] dark:text-[#e8f0f0] hover:underline"
                          >
                            {reply.author?.displayName || reply.author?.username}
                          </Link><CommentOptions comment={reply} onDelete={canDeleteComment(reply.author?._id)?()=>handleDelete(reply,comment._id):undefined} user={currentUser} onEdited={content=>setComments(list=>list.map(item=>item._id===reply._id?{...item,content}:item))}/></div>
                          <p className="text-sm text-[#162424] dark:text-[#e8f0f0] whitespace-pre-line">
                            {reply.content}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[#4a6363] dark:text-[#9eb7b8]">
                            <span>{new Date(reply.createdAt).toLocaleDateString('vi-VN')}</span>

                            {canComment && (
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyTo({
                                    id: comment._id,
                                    authorName: reply.author?.displayName || reply.author?.username,
                                  })
                                }
                                className="font-semibold hover:text-[#1F3333]"
                              >
                                Trả lời
                              </button>
                            )}
                          </div>
                        </div>
                      </div>


                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={() => fetchComments(nextCursor, true)}
              className="w-full py-2 rounded-full text-xs font-semibold bg-white/70 hover:bg-white text-[#1F3333]"
            >
              Tải thêm bình luận
            </button>
          )}
        </div>
      )}
    </div>
  );
}
