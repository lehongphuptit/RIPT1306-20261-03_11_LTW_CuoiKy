import {notify} from '../journal/Feedback.jsx';
import JournalImage from '../journal/JournalImage.jsx';
import TaggedText from '../journal/TaggedText.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Edit3, Heart, MapPin, MessageCircle, Settings, UserCheck, UserPlus } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage, userService } from '../services/userService';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  return <Profile key={username+':'+(currentUser?._id||'guest')} username={username} currentUser={currentUser}/>;
}

function Profile({username,currentUser}) {
  const navigate = useNavigate();
  const [revision,setRevision]=useState(0);
  const [postsError,setPostsError]=useState('');

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    let active=true;
    if (!revision) setLoading(true);
    setNotFound(false);

    (async () => {
      try {
        const res = await userService.getProfileByUsername(username);
        const userData = {...res.user, followerCount:res.followers, postCount:res.posts, followingCount:res.following, isFollowing:res.isFollowing};
        if(!active)return;
        setProfile(userData);


      } catch {
        if(active)setNotFound(true);
      } finally {
        if(active)setLoading(false);
      }
    })();
    return ()=>{active=false;};
  }, [username,currentUser?._id,revision]);

  const sentinel = useRef(null);
  const [loadingPosts,setLoadingPosts] = useState(true);
  const profileId=profile?._id;
  useEffect(()=>{
    if(!profileId)return;
    const controller=new AbortController();
    setPostsError('');
    let observer;
    let pending = false;
    async function load(cursor) {
      if (pending || controller.signal.aborted) return;
      pending = true;
      setLoadingPosts(true);
      try {
        const page = await userService.getUserPosts(profileId,cursor,controller.signal);
        if (controller.signal.aborted) return;
        setPosts(previous => cursor ? [...previous,...page.data] : page.data);
        observer?.disconnect();
        if (page.nextCursor && sentinel.current) {
          observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) load(page.nextCursor);
          }, {rootMargin:'150px'});
          observer.observe(sentinel.current);
        }
      } catch (err) {
        if (!controller.signal.aborted) setPostsError(errorMessage(err));
        observer?.disconnect();
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoadingPosts(false);
      }
    }
    setPosts([]);
    load(null);
    return () => { controller.abort(); observer?.disconnect(); };
  },[profileId,revision]);

  const handleToggleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!profile || currentUser.role !== 'member' || followLoading) return;

    const prevFollowing = Boolean(profile.isFollowing);
    const prevFollowers = profile.followerCount || 0;

    setFollowLoading(true);
    try {
      const target = profile._id;
      if (prevFollowing) {
        await userService.unfollowUser(target);
      } else {
        await userService.followUser(target);
      }
      setProfile(prev=>({...prev,isFollowing:!prevFollowing,
        followerCount:Math.max(0,prevFollowers+(prevFollowing?-1:1))}));
      if(prevFollowing)setPosts(list=>list.filter(post=>post.visibility==='public'));
      setRevision(n=>n+1);
    } catch (err) {
      notify(errorMessage(err),'error');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-16 text-center text-[#4a6363]">Đang tải trang cá nhân...</div>;
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-white/75 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#162424]">Không tìm thấy người dùng</h2>
        <p className="text-sm text-[#4a6363]">Tài khoản @{username} không tồn tại hoặc đã bị khoá.</p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 rounded-full bg-[#1F3333] text-white text-sm font-semibold"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.username === profile.username;
  const isMember = currentUser && currentUser.role === 'member';
  const visitedPlaces = posts.filter((p) => p.location?.name);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-3xl bg-white/75 dark:bg-[#162424]/85 backdrop-blur-xl border border-white/70 dark:border-white/15 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <img
              src={
                profile.avatar?.url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=1F3333&color=fff`
              }
              alt={profile.username}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
            />
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-[#162424] dark:text-[#e8f0f0]">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-sm text-[#4a6363] dark:text-[#9eb7b8]">@{profile.username}</p>
              {profile.bio && (
                <p className="text-sm text-[#162424] dark:text-[#e8f0f0] max-w-lg pt-1 whitespace-pre-line">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-5 pt-2 text-sm">
                <span>
                  <strong className="text-[#162424] dark:text-white">{profile.postCount}</strong>{' '}
                  <span className="text-[#4a6363] dark:text-[#9eb7b8]">bài viết</span>
                </span>
                <span>
                  <strong className="text-[#162424] dark:text-white">{profile.followerCount || 0}</strong>{' '}
                  <span className="text-[#4a6363] dark:text-[#9eb7b8]">người theo dõi</span>
                </span>
                <span>
                  <strong className="text-[#162424] dark:text-white">{profile.followingCount || 0}</strong>{' '}
                  <span className="text-[#4a6363] dark:text-[#9eb7b8]">đang theo dõi</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwnProfile ? (
              <>
                <Link
                  to="/settings/profile"
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#1F3333] hover:bg-[#142222] text-white flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa hồ sơ</span>
                </Link>
                <Link
                  to="/settings/password"
                  title="Đổi mật khẩu"
                  className="p-2 rounded-full bg-white/80 hover:bg-white text-[#1F3333] border border-white/60"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </>
            ) : (
              isMember && (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition ${
                    profile.isFollowing
                      ? 'bg-white/85 hover:bg-white text-[#162424] border border-white/60'
                      : 'bg-[#1F3333] hover:bg-[#142222] text-white shadow-md'
                  }`}
                >
                  {profile.isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Đang theo dõi</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Theo dõi</span>
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === 'posts'
                ? 'bg-[#1F3333] text-white'
                : 'bg-white/60 hover:bg-white text-[#4a6363]'
            }`}
          >
            Nhật ký đã đăng ({profile.postCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('places')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === 'places'
                ? 'bg-[#1F3333] text-white'
                : 'bg-white/60 hover:bg-white text-[#4a6363]'
            }`}
          >
            Địa điểm đã đi ({visitedPlaces.length})
          </button>
        </div>
      </div>

      {activeTab === 'posts' ? (
        postsError ? <p role="alert">{postsError} <button onClick={()=>setRevision(n=>n+1)}>Thử tải lại bài viết</button></p> : loadingPosts && !posts.length ? <p>Đang tải bài viết…</p> : posts.length === 0 ? (
          <div className="rounded-3xl bg-white/70 p-10 text-center space-y-3">
            <p className="text-sm text-[#4a6363]">Chưa có nhật ký chuyến đi nào được đăng.</p>
            {isOwnProfile && (
              <Link
                to="/posts/new"
                className="inline-block px-6 py-2.5 rounded-full bg-[#1F3333] text-white text-xs font-semibold"
              >
                + Viết nhật ký đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {posts.map((post) => (
              <article
                key={post._id}
                className="group rounded-3xl bg-white/75 dark:bg-[#162424]/85 backdrop-blur-xl border border-white/70 overflow-hidden shadow-md hover:shadow-xl transition flex flex-col"
              >
                <Link to={`/posts/${post._id}`} aria-label={post.title}>{post.images?.[0]?.url ? (
                  <div className="aspect-[16/10] overflow-hidden bg-black/10">
                    <JournalImage
                      src={post.images[0].url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-[#DDE7E8]/70 flex items-center justify-center text-xs text-[#4a6363]">
                    Không có ảnh bìa
                  </div>
                )}</Link>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-[#162424] dark:text-[#e8f0f0] line-clamp-1">
                      <Link to={`/posts/${post._id}`}>{post.title}</Link>
                    </h3>
                    <p className="text-xs text-[#4a6363] dark:text-[#9eb7b8] line-clamp-2 mt-1">
                      <TaggedText text={post.content}/>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs text-[#4a6363]">
                    <span className="flex items-center gap-1 truncate max-w-[60%]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{post.location?.name || 'Chưa rõ địa điểm'}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" /> {post.likeCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> {post.commentCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      ) : visitedPlaces.length === 0 ? (
        <div className="rounded-3xl bg-white/70 p-10 text-center text-sm text-[#4a6363]">
          Chưa có địa điểm nào được ghi nhận.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visitedPlaces.map((post) => (
            <Link
              key={post._id}
              to={`/posts/${post._id}`}
              className="p-4 rounded-2xl bg-white/75 hover:bg-white border border-white/70 flex items-start gap-3 transition"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#1F3333] text-white flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#162424] truncate">{post.location.name}</div>
                <div className="text-xs text-[#4a6363] truncate mt-0.5">{post.title}</div>
                {post.tripDate && (
                  <div className="flex items-center gap-1 text-[11px] text-[#4a6363] mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(post.tripDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      <div ref={sentinel} aria-hidden="true" />
    </div>
  );
}
