import React, { useEffect, useState } from 'react';
import { CornerDownRight, Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { errorMessage, postService } from '../../services/postService';

export default function CommentSection({ postId, postAuthorId, currentUser, onCountChange }) {
  const [comments, setComments] = useState([]);
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
      const items = data.items || data || [];
      setComments((prev) => (append ? [...prev, ...items] : items));
      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error(err);
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
      const created = await postService.createComment(postId, payload);

      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === replyTo.id
              ? { ...c, replies: [...(c.replies || []), created] }
              : c,
          ),
        );
      } else {
        setComments((prev) => [created, ...prev]);
      }

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
      if (!parentId) {
        const removedCount = 1 + (comment.replies?.length || 0);
        setComments((prev) => prev.filter((c) => c._id !== comment._id));
        onCountChange?.(-removedCount);
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId
              ? { ...c, replies: (c.replies || []).filter((r) => r._id !== comment._id) }
              : c,
          ),
        );
        onCountChange?.(-1);
      }
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const canDeleteComment = (authorId) => {
    if (!currentUser) return false;
    return (
      currentUser.role === 'admin' ||
      currentUser._id === authorId ||
      currentUser._id === postAuthorId
    );
  };

  return (
    <div className="space-y-4">
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
              type="text"
              maxLength={1000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={replyTo ? 'Viết câu trả lời...' : 'Chia sẻ cảm nghĩ của bạn...'}
              className="flex-1 rounded-full bg-white dark:bg-[#182828] px-4 py-2.5 text-sm border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-full bg-[#1F3333] hover:bg-[#142222] text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Gửi</span>
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      ) : (
        !currentUser && (
          <p className="text-xs text-[#4a6363] dark:text-[#9eb7b8]">
            <Link to="/login" className="font-semibold underline text-[#1F3333] dark:text-white">
              Đăng nhập
            </Link>{' '}
            để tham gia bình luận.
          </p>
        )
      )}

      {loading ? (
        <p className="text-sm text-[#4a6363]">Đang tải bình luận...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[#4a6363] dark:text-[#9eb7b8]">Chưa có bình luận nào.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="p-3.5 rounded-2xl bg-white/65 dark:bg-[#182828]/75 border border-white/50 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/u/${comment.author?.username}`}
                    className="text-sm font-bold text-[#162424] dark:text-[#e8f0f0] hover:underline"
                  >
                    {comment.author?.displayName || comment.author?.username}
                  </Link>
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

                {canDeleteComment(comment.author?._id) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment, null)}
                    title="Xoá bình luận"
                    className="text-[#4a6363] hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {comment.replies?.length > 0 && (
                <div className="pl-4 border-l-2 border-[#1F3333]/20 space-y-2.5 pt-1">
                  {comment.replies.map((reply) => (
                    <div key={reply._id} className="flex items-start justify-between gap-2">
                      <div className="flex gap-2">
                        <CornerDownRight className="w-3.5 h-3.5 text-[#4a6363] shrink-0 mt-1" />
                        <div>
                          <Link
                            to={`/u/${reply.author?.username}`}
                            className="text-xs font-bold text-[#162424] dark:text-[#e8f0f0] hover:underline"
                          >
                            {reply.author?.displayName || reply.author?.username}
                          </Link>
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

                      {canDeleteComment(reply.author?._id) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(reply, comment._id)}
                          title="Xoá trả lời"
                          className="text-[#4a6363] hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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