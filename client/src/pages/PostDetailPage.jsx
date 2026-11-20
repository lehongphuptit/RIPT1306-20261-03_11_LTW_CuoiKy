import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Flag,
  Heart,
  MapPin,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CommentSection from '../components/posts/CommentSection';
import ReportDialog from '../components/posts/ReportDialog';
import { useAuth } from '../context/AuthContext';
import { errorMessage, postService } from '../services/postService';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setActiveImageIdx(0);

    (async () => {
      try {
        const res = await postService.getPostById(id);
        setPost(res.post || res);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleToggleLike = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role === 'admin' || !post) return;

    const prevLiked = Boolean(post.isLiked);
    const prevCount = post.likeCount || 0;

    setPost((prev) => ({
      ...prev,
      isLiked: !prevLiked,
      likeCount: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
    }));

    try {
      if (prevLiked) {
        await postService.unlikePost(post._id);
      } else {
        await postService.likePost(post._id);
      }
    } catch {
      setPost((prev) => ({
        ...prev,
        isLiked: prevLiked,
        likeCount: prevCount,
      }));
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá bài viết này? Hành động không thể hoàn tác.')) {
      return;
    }
    try {
      await postService.deletePost(post._id);
      navigate('/');
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto py-16 text-center text-[#4a6363]">Đang tải bài viết...</div>;
  }

  if (notFound || !post) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-white/75 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#162424]">Không tìm thấy bài viết</h2>
        <p className="text-sm text-[#4a6363]">
          Bài viết không tồn tại, đã bị ẩn hoặc chỉ hiển thị với người theo dõi tác giả.
        </p>
        <Link
          to="/explore"
          className="inline-block px-6 py-2.5 rounded-full bg-[#1F3333] text-white text-sm font-semibold"
        >
          Quay lại Khám phá
        </Link>
      </div>
    );
  }

  const images = post.images || [];
  const isOwner = currentUser && currentUser._id === post.author?._id;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const isMember = currentUser && currentUser.role === 'member';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="rounded-3xl bg-white/75 dark:bg-[#162424]/85 backdrop-blur-xl border border-white/70 dark:border-white/15 overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 bg-[#162424]/5 dark:bg-black/30 p-4 sm:p-6 flex flex-col justify-between">
          {images.length > 0 ? (
            <>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/10">
                <img
                  src={images[activeImageIdx]?.url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#1F3333]/80 text-white flex items-center justify-center hover:bg-[#1F3333]"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#1F3333]/80 text-white flex items-center justify-center hover:bg-[#1F3333]"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 text-white text-xs">
                      {activeImageIdx + 1}/{images.length}
                    </span>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-6 gap-2 mt-3">
                  {images.map((img, idx) => (
                    <button
                      key={img.publicId || idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                        idx === activeImageIdx ? 'border-[#1F3333] scale-105' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-[4/3] rounded-2xl bg-[#DDE7E8]/60 flex items-center justify-center text-sm text-[#4a6363]">
              Bài viết không đính kèm hình ảnh
            </div>
          )}
        </div>

        <div className="lg:col-span-5 p-6 flex flex-col justify-between max-h-[85vh] overflow-y-auto space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Link to={`/u/${post.author?.username}`} className="flex items-center gap-2.5">
                <img
                  src={post.author?.avatar?.url || 'https://ui-avatars.com/api/?name=' + post.author?.username}
                  alt={post.author?.username}
                  className="w-10 h-10 rounded-full object-cover border border-white"
                />
                <div>
                  <div className="text-sm font-bold text-[#162424] dark:text-[#e8f0f0]">
                    {post.author?.displayName || post.author?.username}
                  </div>
                  <div className="text-xs text-[#4a6363] dark:text-[#9eb7b8]">
                    @{post.author?.username} ·{' '}
                    {post.visibility === 'followers' ? 'Chỉ người theo dõi' : 'Công khai'}
                  </div>
                </div>
              </Link>

              {(isOwner || isAdmin) && (
                <div className="flex items-center gap-1.5">
                  {isOwner && (
                    <Link
                      to={`/posts/${post._id}/edit`}
                      title="Sửa bài"
                      className="p-2 rounded-full bg-white/80 hover:bg-white text-[#1F3333]"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleDeletePost}
                    title="Xoá bài"
                    className="p-2 rounded-full bg-white/80 hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#162424] dark:text-[#e8f0f0]">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#4a6363] dark:text-[#9eb7b8]">
                {post.location?.name && (
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5" /> {post.location.name}
                  </span>
                )}
                {post.tripDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />{' '}
                    {new Date(post.tripDate).toLocaleDateString('vi-VN')}
                  </span>
                )}
                {post.cost !== undefined && post.cost !== null && (
                  <span className="flex items-center gap-1 font-semibold text-[#1F3333] dark:text-emerald-400">
                    <Wallet className="w-3.5 h-3.5" /> {Number(post.cost).toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-[#162424] dark:text-[#e8f0f0] whitespace-pre-line leading-relaxed">
              {post.content}
            </p>

            {post.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/explore?tag=${tag}`}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#1F3333]/10 text-[#1F3333] dark:text-[#e8f0f0] hover:bg-[#1F3333]/20"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 pb-3 border-y border-black/10 dark:border-white/10">
              {isMember ? (
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition ${
                    post.isLiked
                      ? 'bg-[#1F3333] text-white'
                      : 'bg-white/80 hover:bg-white text-[#162424]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                  <span>Thích ({post.likeCount || 0})</span>
                </button>
              ) : (
                <span className="text-sm font-semibold text-[#4a6363]">
                  {post.likeCount || 0} lượt thích
                </span>
              )}

              {isMember && !isOwner && (
                <button
                  type="button"
                  onClick={() => setIsReportOpen(true)}
                  className="px-4 py-2 rounded-full text-xs font-medium bg-white/70 hover:bg-red-50 text-[#4a6363] hover:text-red-600 flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Báo cáo</span>
                </button>
              )}
            </div>

            <CommentSection
              postId={post._id}
              postAuthorId={post.author?._id}
              currentUser={currentUser}
              onCountChange={(delta) =>
                setPost((prev) => ({
                  ...prev,
                  commentCount: Math.max(0, (prev.commentCount || 0) + delta),
                }))
              }
            />
          </div>
        </div>
      </div>

      <ReportDialog
        postId={post._id}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}