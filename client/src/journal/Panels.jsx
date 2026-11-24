import './notifications.css';
import {ArrowRight, Bell, CheckCheck} from 'lucide-react';
import './adminSections.css';
import {confirmAction, notify} from './Feedback.jsx';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {api,errorMessage} from '../services/api.js';
import {Action,List,useResult,profileUrl} from './common.jsx';

import {useAuth} from '../context/AuthContext.jsx';

export function Profile({id,user,refresh,revision}){
 const {setUser}=useAuth();
 const {data,error}=useResult('/users/'+id,revision);
 const [edit,setEdit]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 if(!data)return <p>{error||'Đang tải hồ sơ…'}</p>;
 const p=data.user,own=id===user?._id;
 async function save(e){e.preventDefault();const body=new FormData(e.currentTarget);if(!body.get('avatar')?.size)body.delete('avatar');
 setBusy(true);try{const {data}=await api.patch('/users/me',body);setUser(current=>current?._id===data.user._id?{...current,...data.user}:current);setEdit(false);refresh();}catch(err){setMessage(errorMessage(err));}finally{setBusy(false);}}
 return <><section className="profile-info"><div className="avatar">{!p.avatar?.url&&p.displayName?.slice(0,1)}{p.avatar?.url&&<img className="portrait" src={p.avatar.url} alt="Ảnh đại diện"/>}</div><div>
 <h1>{p.displayName}</h1><span>@{p.username}</span><p>{p.bio}</p><p>{data.posts} bài · {data.followers} người theo dõi · {data.following} đang theo dõi</p>
 </div>{own?<button onClick={()=>setEdit(!edit)}>Chỉnh sửa hồ sơ</button>:user?.role==='member'&&<Action run={async()=>{const path='/users/'+id+'/follow';if(data.isFollowing)await api.delete(path);else await api.put(path);refresh();}}>{data.isFollowing?'Bỏ theo dõi':'Theo dõi'}</Action>}
 {edit&&<form onSubmit={save}><label>Tên hiển thị<input name="displayName" defaultValue={p.displayName} required maxLength={80}/></label><label>Giới thiệu<textarea name="bio" defaultValue={p.bio} maxLength={200}/></label><label>Ảnh đại diện<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp"/></label><button disabled={busy}>Lưu hồ sơ</button>{message&&<p>{message}</p>}</form>}</section><div className="feed-head"><h2>Nhật ký hành trình</h2></div></>;
}
export function Notifications({revision, refresh}) {
  async function markRead(path) {
    await api.patch(path);
    refresh();
  }

  const descriptions = {like: 'đã thích bài viết', follow: 'đã theo dõi bạn', comment: 'đã bình luận'};
  return <section className="notice-panel" aria-labelledby="notice-title">
    <div className="notice-heading">
      <h1 id="notice-title">Thông báo</h1>
      <Action className="notice-all" run={() => markRead('/notifications/read-all')}>
        <CheckCheck size={17} aria-hidden="true"/> Đánh dấu tất cả đã đọc
      </Action>
    </div>
    <List url="/notifications" revision={revision} empty="Chưa có thông báo." render={n => {
      const actor = n.actor?.displayName || 'Thành viên';
      return <article key={n._id} className="notice-item" data-unread={!n.read}>
        <span className="notice-icon" aria-hidden="true"><Bell size={18}/></span>
        <div className="notice-body">
          <p>{n.message || <>{n.actor?._id ? <Link to={profileUrl(n.actor._id)}>{actor}</Link> : <strong>{actor}</strong>} {descriptions[n.type] || n.type}</>}</p>
          <div className="notice-actions">
            {n.post && n.type !== 'report_dismissed' && <Link to={'/posts/' + n.post}>
              {n.type === 'post_hidden' ? 'Xem bài và khiếu nại' : 'Xem bài'} <ArrowRight size={14} aria-hidden="true"/>
            </Link>}
            {!n.read && <Action run={() => markRead('/notifications/' + n._id + '/read')}>Đánh dấu đã đọc</Action>}
          </div>
        </div>
      </article>;
    }}/>
  </section>;
}
export function Admin({user,revision,refresh,queues}){
 const [status,setStatus]=useState("pending");
 const [target,setTarget]=useState("post");
 const [appealStatus,setAppealStatus]=useState('pending');
 const [section,setSection]=useState('');
 const [input,setInput]=useState('');
 const [username,setUsername]=useState('');
 function toggle(id){
   setSection(current=>current===id?'':id);
   setUsername('');setInput('');
 }
 function heading(id,label,count=0){
   return <h2><button type="button" className="admin-heading" aria-expanded={section===id} onClick={()=>toggle(id)}>
     {label}{count>0&&<b className="queue-count">{count}</b>}<span aria-hidden="true">{section===id?'−':'+'}</span>
   </button></h2>;
 }
 const stats=useResult('/admin/stats',revision);
 return <section className="admin-sections"><h1>Quản trị</h1>{stats.data&&<p>{stats.data.users} thành viên · {stats.data.posts} bài · {queues?queues.post+queues.comment:stats.data.pendingReports} báo cáo chờ</p>}{stats.error&&<p>{stats.error}</p>}
 {heading('reports','Báo cáo',queues?queues.post+queues.comment:stats.data?.pendingReports)}{section==='reports'&&<div className="admin-section-content"><div className="review-filters"><select aria-label="Loại báo cáo" value={target} onChange={e=>setTarget(e.target.value)}><option value="post">Bài viết{queues?.post ? " ("+queues.post+")":""}</option><option value="comment">Bình luận{queues?.comment ? " ("+queues.comment+")":""}</option></select><select aria-label="Trạng thái báo cáo" value={status} onChange={e=>setStatus(e.target.value)}><option value="pending">Chờ xử lý</option><option value="resolved">Đã xử lý</option><option value="rejected">Đã bỏ qua</option></select></div><List url={'/admin/reports?target='+target+'&status='+status} revision={revision+'-'+(status==='pending'?queues?.[target]:0)} render={r=><article key={r._id} className="review-card">{r.post?<Link to={'/posts/'+r.post._id}>{r.post.title}</Link>:<b>Bài viết không còn hiển thị</b>}{r.originalContent&&<blockquote>{r.originalContent}</blockquote>}<p className="review-by">Người báo cáo: {r.reporter?.displayName}</p><p><strong>Lý do:</strong> {{spam:'Spam',offensive:'Nội dung phản cảm',false_info:'Thông tin sai',other:'Khác'}[r.reason] || r.reason}</p>
 {r.note&&<p className="review-note">{r.note}</p>}<div className="review-actions">
 {status==='pending'&&(r.post?[target==='comment'?'remove':'hide','dismiss']:['dismiss']).map(a=><Action key={a} className={a==='dismiss'?'review-neutral':'review-restrict'} run={async()=>{if(await confirmAction(a==='remove'?'Xóa bình luận và các phản hồi liên quan?':'Xử lý báo cáo này?')){await api.patch((target==='comment'?'/admin/comment-reports/':'/admin/reports/')+r._id,{action:a});notify("Đã xử lý báo cáo.");refresh();}}}>{a==='remove'?'Xóa bình luận':a==='hide'?'Ẩn bài':target==='post'?'Không ẩn bài':'Bỏ qua'}</Action>)}{target==='post'&&r.post?.status==='hidden'&&<Action run={async()=>{await api.patch('/admin/posts/'+r.post._id+'/status',{status:'active'});refresh();}}>Hiện lại bài</Action>}</div></article>}/>
 </div>}
 {heading('appeals','Khiếu nại',queues?.appeals)}{section==='appeals'&&<div className="admin-section-content">
 <select aria-label="Trạng thái khiếu nại" value={appealStatus} onChange={e=>setAppealStatus(e.target.value)}>
 <option value="pending">Chờ xem xét</option><option value="approved">Đã chấp nhận</option><option value="rejected">Đã từ chối</option></select>
 <List url={'/admin/appeals?status='+appealStatus} revision={revision+'-'+(appealStatus==='pending'?queues?.appeals:0)} empty="Chưa có khiếu nại." render={a=><article className="moderation-appeal" key={a._id}>
 <strong>{a.author?.displayName}</strong> · {a.post?<Link to={'/posts/'+a.post._id}>{a.post.title}</Link>:'Bài viết riêng tư hoặc đã xóa'}
 <p>{a.reason}</p><div className="review-actions">{a.status==='pending'&&['approve','reject'].map(action=>{
 const label=action==='approve'?'Chấp nhận và bỏ ẩn':'Giữ nguyên ẩn bài';
 return <Action key={action} run={async()=>{if(!await confirmAction(label+'?',label))return;
 await api.patch('/admin/appeals/'+a._id,{action});notify('Đã xử lý khiếu nại.');refresh();}}>{label}</Action>;
 })}</div></article>}/></div>}
 {heading('accounts','Tài khoản')}{section==='accounts'&&<div className="admin-section-content">
 <form role="search" className="admin-lookup" onSubmit={e=>{e.preventDefault();setUsername(input.trim().replace(/^@/,'').toLowerCase());}}>
   <label htmlFor="admin-username">Tìm theo ID người dùng</label>
   <input id="admin-username" placeholder="@bin_noc" value={input} onChange={e=>{setInput(e.target.value);setUsername('');}} autoComplete="off"/>
   <button type="submit" disabled={!/^@?[a-z0-9_]{3,30}$/i.test(input.trim())}>Tìm</button>
 </form>
 {username&&<List url={'/admin/users?username='+encodeURIComponent(username)} empty="Không tìm thấy tài khoản này."  revision={revision} render={u=><article key={u._id} className="admin-account"><span><strong>{u.displayName}</strong><small>@{u.username}</small></span>
 {!u.isOwner&&u._id!==user._id&&(u.role!=='admin'||user.isOwner)&&<Action run={async()=>{if(await confirmAction('Đổi trạng thái tài khoản này?')){await api.patch('/admin/users/'+u._id,{locked:!u.locked});notify(u.locked?'Đã mở khóa tài khoản.':'Đã khóa tài khoản.');refresh();}}}>{u.locked?'Mở khóa':'Khóa'}</Action>}</article>}/>
 }</div>}
 {heading('places','Địa điểm nổi bật')}{section==='places'&&<div className="admin-section-content">
 {stats.data?.locations.map(l=><p key={l._id}>{l.name} · {l.count} bài</p>)}
 {stats.data?.locations.length===0&&<p>Chưa có địa điểm.</p>}
 </div>}</section>;
}
