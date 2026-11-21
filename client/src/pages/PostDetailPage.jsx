import {confirmAction, notify} from '../journal/Feedback.jsx';
import JournalImage from '../journal/JournalImage.jsx';
import TaggedText from '../journal/TaggedText.jsx';
import GuestPostActions from '../journal/GuestPostActions.jsx';
import PostOptions from '../journal/PostOptions.jsx';
import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,


  Heart,
  MapPin,
  EyeOff,
  Wallet,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CommentSection from '../components/posts/CommentSection';
import ReportDialog from '../components/posts/ReportDialog';
import { useAuth } from '../context/AuthContext';
import { errorMessage, postService } from '../services/postService';

function AppealForm({post}){
  const [reason,setReason]=useState('');
  const [status,setStatus]=useState(post.appeal?.status);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function submit(e){
    e.preventDefault();
    if(busy || !reason.trim())return;
    setBusy(true);setError('');
    try{
      await postService.appeal(post._id,reason.trim(),post.moderationCycle || post._id);
      setStatus('pending');notify('Đã gửi khiếu nại.');
    }catch(err){setError(errorMessage(err));}finally{setBusy(false);}
  }
  return <section className="moderation-appeal"><h2>Bài viết đang bị ẩn</h2>
    {status?<p role="status">{status==='pending'?'Khiếu nại của bạn đang chờ quản trị viên xem xét.':'Quản trị viên đã xem xét và giữ nguyên quyết định ẩn bài.'}</p>:
      <form onSubmit={submit}><label htmlFor="appeal-reason">Vì sao bạn đề nghị mở lại bài viết?</label>
        <textarea id="appeal-reason" rows={3} maxLength={1500} required value={reason} onChange={e=>setReason(e.target.value)}/>
        <button type="submit" className="primary" disabled={busy || !reason.trim()}>Gửi khiếu nại</button>
        {error&&<p role="alert">{error}</p>}
      </form>}
  </section>;
}

export default function PostDetailPage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  return <PostDetail key={id+":"+(currentUser?._id || "guest")} id={id} currentUser={currentUser}/>;
}

function PostDetail({id,currentUser}) {
  const navigate = useNavigate();

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

    const prevLiked = Boolean(post.liked);
    const prevCount = post.likeCount || 0;

    setPost((prev) => ({
      ...prev,
      liked: !prevLiked,
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
        liked: prevLiked,
        likeCount: prevCount,
      }));
    }
  };

  const [moderating,setModerating]=useState(false);
  async function hidePost() {
    const hidden=post.status==='hidden';
    if(moderating || !await confirmAction(hidden?'Bỏ ẩn bài viết này?':'Ẩn bài viết này khỏi bảng tin?',hidden?'Bỏ ẩn':'Ẩn bài'))return;
    setModerating(true);
    try {
      await postService.setStatus(post._id,hidden?'active':'hidden');
      notify(hidden?"Đã bỏ ẩn bài viết.":"Đã ẩn bài viết khỏi bảng tin.");
      setPost(prev=>prev?._id===post._id?{...prev,status:hidden?'active':'hidden'}:prev);
    } catch(err) { notify(errorMessage(err),'error'); }
    finally {setModerating(false);}
  }

  const handleDeletePost = async () => {
    if (!await confirmAction('Bạn có chắc chắn muốn xoá bài viết này? Hành động không thể hoàn tác.', 'Xóa bài')) {
      return;
    }
    try {
      await postService.deletePost(post._id);
      notify("Đã xóa bài viết.");
      navigate('/');
    } catch (err) {
      notify(errorMessage(err),'error');
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
          to="/"
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
    <div className="detail-page">
      <div className="detail-card">
        {images.length > 0 && (<div className="detail-gallery">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/10">
                <JournalImage
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
                      <JournalImage src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
        </div>)}

        <div className="detail-body">
          {isOwner && post.status==="hidden" && <AppealForm key={post._id+(post.moderationCycle || "")} post={post}/>}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Link to={`/u/${post.author?.username}`} className="flex items-center gap-2.5">
                <img
                  src={post.author?.avatar?.url || 'https://ui-avatars.com/api/?name=' + post.author?.username}
                  alt={post.author?.username}
                  className="w-10 h-10 rounded-full object-cover border border-white"
                />
                <div>
                  <div className="text-sm font-bold detail-text">
                    {post.author?.displayName || post.author?.username}
                  </div>
                  <div className="text-xs detail-secondary">
                    @{post.author?.username} ·{' '}
                    {post.visibility === 'private' ? 'Riêng tư' : post.visibility === 'followers' ? 'Chỉ người theo dõi' : 'Công khai'}
                  </div>
                </div>
              </Link>
            </div>

            <div>
              <h1 className="text-xl font-bold detail-text">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs detail-secondary">
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
                  <span className="flex items-center gap-1 font-semibold detail-accent">
                    <Wallet className="w-3.5 h-3.5" /> {Number(post.cost).toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm detail-text whitespace-pre-line leading-relaxed">
              <TaggedText text={post.content}/>
            </p>

            {post.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/?q=${encodeURIComponent("#"+tag)}`}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#1F3333]/10 detail-text hover:bg-[#1F3333]/20"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="detail-actions">
              {!currentUser ? <GuestPostActions post={post}/> : isMember ? (
                <button
                  type="button"
                  aria-pressed={!!post.liked} onClick={handleToggleLike}
                  className={`px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition ${
                    post.liked
                      ? 'bg-[#1F3333] text-white'
                      : 'bg-white/80 hover:bg-white text-[#162424]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                  <span>Thích ({post.likeCount || 0})</span>
                </button>
              ) : (
                <span className="text-sm font-semibold text-[#4a6363]">
                  {post.likeCount || 0} lượt thích
                </span>
              )}

              {isMember && <PostOptions id={post._id} saved={!!post.saved} onSaved={saved=>setPost(prev=>({...prev,saved}))} onEdit={isOwner?()=>navigate("/posts/"+post._id+"/edit"):undefined} onDelete={isOwner?handleDeletePost:undefined} onReport={isOwner?undefined:()=>setIsReportOpen(true)}/>}
            </div>

            {isAdmin && <button type="button" disabled={moderating} onClick={hidePost}><EyeOff size={16}/> {post.status==='hidden'?'Bỏ ẩn bài':'Ẩn bài'}</button>}
            <CommentSection
              postId={post._id}
              postAuthorId={post.author?._id}
              currentUser={currentUser}
              onCountChange={(delta, exact) =>
                setPost((prev) => ({
                  ...prev,
                  commentCount: exact ?? Math.max(0, (prev.commentCount || 0) + delta),
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
