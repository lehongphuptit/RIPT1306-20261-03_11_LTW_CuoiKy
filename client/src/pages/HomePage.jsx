import {useCallback,useEffect,useMemo,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {configureStore,createSlice} from '@reduxjs/toolkit';
import {Provider,useDispatch,useSelector} from 'react-redux';
import {Search,Compass,Bell,Plus,User,Bookmark,Map as MapIcon,Shield,Calendar,ArrowRight} from 'lucide-react';
import {useAuth} from '../context/AuthContext.jsx';
import {api} from '../services/api.js';
import {List,useResult,Action,profileUrl} from '../journal/common.jsx';
import DestinationMap from '../journal/DestinationMap.jsx';
import Composer from '../journal/Composer.jsx';
import PostCard from '../journal/PostCard.jsx';
import {Profile,Notifications,Admin} from '../journal/Panels.jsx';
import '../journal/selected.css';

const alerts=createSlice({name:'notifications',initialState:{count:0},reducers:{received:(state,action)=>{state.count=action.payload;}}});
function OnePost({id,card,revision}){
 const result=useResult('/posts/'+encodeURIComponent(id),revision);
 return result.data?card(result.data.post):<p>{result.error||'Đang tải…'}</p>;
}
function Journal({user,logout}){
 const [params,setParams]=useSearchParams(), view=params.get('view')||'explore',id=params.get('id'),q=params.get('q')||'';
 const [input,setInput]=useState(q),[revision,setRevision]=useState(0),[tick,setTick]=useState(0);
 const refresh=useCallback(()=>setRevision(n=>n+1),[]);
 const unread=useSelector(s=>s.count),dispatch=useDispatch();
 const [dark,setDark]=useState(()=>localStorage.getItem('wanderly-theme')==='dark');
 const member=user?.role==='member';
 useEffect(()=>setInput(q),[q,view]);
 useEffect(()=>{
   if(!user)return;
   const abort=new AbortController();let pending=false;
   async function poll(){if(pending)return;pending=true;try{const r=await api.get('/notifications/unread-count',{signal:abort.signal});
    if(!abort.signal.aborted){dispatch(alerts.actions.received(r.data.count));setTick(v=>v+1);}
   }catch{}finally{pending=false;}}
   poll();const timer=setInterval(poll,30000);return ()=>{abort.abort();clearInterval(timer);};
 },[user,revision,dispatch]);
 function card(post){return <PostCard key={post._id} post={post} user={user} refresh={refresh} onRemoved={view==="saved"?refresh:undefined}/>;}
 function changeTheme(value){setDark(value);try{localStorage.setItem('wanderly-theme',value?'dark':'light');}catch{}}
 const protectedLink=v=>user?'/?view='+v:'/login';
 const initials=(user?.displayName||'Khách').split(/\s+/).slice(0,2).map(s=>s[0]).join('');
 const avatar=<span className="avatar">{initials}</span>;
 const nav=(path,label,Icon,href)=> <Link aria-label={label} className={view===path?'active':''} to={href}><Icon/><span>{label}</span></Link>;
 const search=e=>{e.preventDefault();setParams(input.trim()?{q:input.trim()}:{});};
 function theme(){return <button role="switch" type="button" aria-label="Chế độ tối" aria-checked={dark} className="mode-switch"
 onPointerDown={e=>{e.currentTarget.dataset.start=e.clientX;e.currentTarget.setPointerCapture(e.pointerId);}}
 onPointerUp={e=>{const b=e.currentTarget,dx=e.clientX-Number(b.dataset.start);if(Math.abs(dx)>7){changeTheme(dx>0);b.dataset.drag='1';setTimeout(()=>delete b.dataset.drag,0);}}}
 onClick={e=>{if(!e.currentTarget.dataset.drag||e.detail===0)changeTheme(!dark);}}><span>Chế độ tối</span><span className="mode-track"><span className="mode-thumb"/></span></button>;}
 return <div className={'wv2'+(dark?' dark':'')}><aside id="sidebar"><Link className="logo" to="/"><strong>Wanderly<span>.</span></strong></Link><div className="brand-note">NHẬT KÝ DU LỊCH</div><nav className="nav">
 {nav('explore','Khám phá',Compass,'/')}{nav('notifications','Thông báo'+(unread?' ('+unread+')':''),Bell,protectedLink('notifications'))}
 {nav('create','Tạo bài viết',Plus,protectedLink('create'))}{nav('profile','Trang cá nhân',User,member?profileUrl(user._id):user?'/account':'/login')}{nav('saved','Đã lưu',Bookmark,protectedLink('saved'))}{nav('map','Bản đồ Việt Nam',MapIcon,'/?view=map')}
 {user?.role==='admin'&&nav('admin','Quản trị',Shield,'/?view=admin')}</nav><div className="sidebar-bottom">{theme()}<div className="account">{avatar}<span><strong>{user?.displayName||'Khách'}</strong>{user?<Action run={logout}>Đăng xuất</Action>:<Link to="/login">Đăng nhập</Link>}</span></div></div></aside>
 <div className="shell"><header id="topbar"><Link className="mobile-logo" to="/">Wanderly.</Link><span className="top-caption">Một chuyến đi, một câu chuyện.</span><div className="top-actions">
 <form className="wander-search" role="search" onSubmit={search}><input type="search" aria-label="Tìm kiếm tài khoản, địa điểm hoặc hashtag" placeholder="Tìm kiếm..." value={input} onChange={e=>{setInput(e.target.value);if(!e.target.value&&q)setParams({});}}/><button aria-label="Tìm kiếm"><Search/></button></form>
 <details className="account-menu"><summary aria-label="Tài khoản">{avatar}</summary><div>{theme()}{member&&<Link to={profileUrl(user._id)}>Trang cá nhân</Link>}{user?<Action run={logout}>Đăng xuất</Action>:<Link to="/login">Đăng nhập</Link>}</div></details>
 <Link className="primary" aria-label="Đăng bài" to={protectedLink('create')}><Plus/> Đăng bài</Link></div></header>
 <main><div className="layout"><section className="timeline">
 {['explore','following'].includes(view)&&<><div className="feed-tabs"><Link className={view==='explore'?'selected':''} to="/">Dành cho bạn</Link><Link className={view==='following'?'selected':''} to={protectedLink('following')}>Đang theo dõi</Link><span><Compass/></span></div>
 <div className="destination-strip"><Link className="destination add-diary" to={protectedLink('create')}><span><Plus/></span><small>Nhật ký mới</small></Link><div className="journey-heading"><span className="journey-heading-kicker">WANDERLY · NHẬT KÝ DU LỊCH</span><h2>Mỗi chuyến đi, một câu chuyện</h2><p>Lưu giữ những khoảnh khắc đẹp và chia sẻ hành trình của riêng bạn.</p></div></div>
 <div className="feed-head"><h2>{q?'Kết quả cho “'+q+'”':'Những chuyến đi đáng nhớ'}</h2></div><div className="chips">{['','Hà Giang','Hội An','Ninh Bình'].map(n=><button key={n} className={'chip '+(q===n?'active':'')} onClick={()=>setParams({...view==='following'?{view}:{},...n?{q:n}:{}})}>{n||'Tất cả'}</button>)}</div>
 {q.startsWith('@')?(q.length>1?<List url={'/users?q='+encodeURIComponent(q.slice(1))} render={p=><p key={p._id}><Link to={profileUrl(p._id)}>{p.displayName} · @{p.username}</Link></p>}/>:<p>Nhập ID sau dấu @.</p>):
 view==='following'&&!member?<Link to="/login">Đăng nhập để xem bảng tin.</Link>:<List url={(view==='following'?'/feed':'/posts')+'?q='+encodeURIComponent(q)} revision={revision} render={card} empty="Chưa có nhật ký để hiển thị."/>}</>}
 {view==='create'&&(member?<Composer user={user} initiallyOpen onPosted={()=>{refresh();setParams({});}}/>:<Link to="/login">Đăng nhập để đăng bài.</Link>)}
 {view==='map'&&<DestinationMap/>}{view==='post'&&id&&<OnePost id={id} card={card} revision={revision}/>}
 {view==='profile'&&id&&<><Profile id={id} user={user} refresh={refresh} revision={revision}/><List url={'/posts?author='+encodeURIComponent(id)} render={card} revision={revision}/></>}
 {view==='saved'&&member&&<><h1>Nhật ký đã lưu</h1><List url="/saved" revision={revision} render={card} empty="Chưa có nhật ký đã lưu."/></>}
 {view==='notifications'&&user&&<Notifications revision={revision+tick} refresh={refresh}/>}
 {((!user&&['saved','notifications','admin'].includes(view))||(user&&view==='admin'&&user.role!=='admin'))&&<p>Bạn cần tài khoản phù hợp để xem trang này. <Link to="/login">Đăng nhập</Link></p>}
 {view==='admin'&&user?.role==='admin'&&<Admin user={user} refresh={refresh} revision={revision}/>}
 </section><aside className="right-column"><div className="side-account">{avatar}<div><strong>{user?.displayName||'Khách ghé thăm'}</strong><small>Hôm nay bạn muốn đi đâu?</small></div></div><section className="side-panel"><div className="aside-title"><h3>Điểm đến được yêu thích</h3><Compass/></div>{['Hà Giang','Hội An','Ninh Bình'].map((n,i)=><Link className="place" key={n} to={'/?q='+encodeURIComponent(n)}><img src={['https://media.mia.vn/uploads/blog-du-lich/hanh-trinh-lang-thang-ha-giang-bang-xe-may-day-thu-vi-15-1668444071.jpg','/wanderly-1.0/hoian.webp','https://sodulich.ninhbinh.gov.vn/uploads/images/trang_an1.jpg'][i]} alt=""/><span><strong>{n}</strong><small>{['Những mùa mây ngang núi','Một chút bình yên phố cổ','Lạc giữa miền xanh'][i]}</small></span><ArrowRight/></Link>)}</section></aside></div></main></div></div>;
}
export default function HomePage(){
 const {user,loading,logout}=useAuth();
 const store=useMemo(()=>configureStore({reducer:alerts.reducer}),[user?._id]);
 if(loading)return <p>Đang kiểm tra phiên…</p>;
 return <Provider store={store}><Journal key={user?._id||'guest'} user={user} logout={logout}/></Provider>;
}
