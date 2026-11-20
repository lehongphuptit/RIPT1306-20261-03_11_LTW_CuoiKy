import {useState} from 'react';
import {Link} from 'react-router-dom';
import {api,errorMessage} from '../services/api.js';
import {Action,List,useResult,profileUrl} from './common.jsx';

export function Profile({id,user,refresh,revision}){
 const {data,error}=useResult('/users/'+id,revision);
 const [edit,setEdit]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 if(!data)return <p>{error||'Đang tải hồ sơ…'}</p>;
 const p=data.user,own=id===user?._id;
 async function save(e){e.preventDefault();const body=new FormData(e.currentTarget);if(!body.get('avatar')?.size)body.delete('avatar');
 setBusy(true);try{await api.patch('/users/me',body);setEdit(false);refresh();}catch(err){setMessage(errorMessage(err));}finally{setBusy(false);}}
 return <section className="journal-card">{p.avatar?.url&&<img className="portrait" src={p.avatar.url} alt="Ảnh đại diện"/>}
 <h1>{p.displayName}</h1><span>@{p.username}</span><p>{p.bio}</p><p>{data.posts} bài · {data.followers} người theo dõi · {data.following} đang theo dõi</p>
 {own?<button onClick={()=>setEdit(!edit)}>Chỉnh sửa hồ sơ</button>:user?.role==='member'&&<Action run={async()=>{const path='/users/'+id+'/follow';if(data.isFollowing)await api.delete(path);else await api.put(path);refresh();}}>{data.isFollowing?'Bỏ theo dõi':'Theo dõi'}</Action>}
 {edit&&<form onSubmit={save}><label>Tên hiển thị<input name="displayName" defaultValue={p.displayName} required maxLength={80}/></label><label>Giới thiệu<textarea name="bio" defaultValue={p.bio} maxLength={200}/></label><label>Ảnh đại diện<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp"/></label><button disabled={busy}>Lưu hồ sơ</button>{message&&<p>{message}</p>}</form>}</section>;
}
export function Notifications({revision,refresh}){
 return <><h1>Thông báo</h1><Action run={async()=>{await api.patch('/notifications/read-all');refresh();}}>Đánh dấu tất cả đã đọc</Action>
 <List url="/notifications" revision={revision} empty="Chưa có thông báo." render={n=><article key={n._id} className="journal-card">
 <Link to={profileUrl(n.actor?._id)}>{n.actor?.displayName||'Thành viên'}</Link> {{like:'đã thích bài viết',follow:'đã theo dõi bạn',comment:'đã bình luận'}[n.type]||n.type}
 {n.post&&<Link to={'/?view=post&id='+n.post}> · Xem bài</Link>}
 {!n.read&&<Action run={async()=>{await api.patch('/notifications/'+n._id+'/read');refresh();}}>Đánh dấu đã đọc</Action>}</article>}/></>;
}
export function Admin({user,revision,refresh}){
 const [status,setStatus]=useState("pending");
 const stats=useResult('/admin/stats',revision);
 return <><h1>Quản trị</h1>{stats.data&&<p>{stats.data.users} thành viên · {stats.data.posts} bài · {stats.data.pendingReports} báo cáo chờ</p>}{stats.error&&<p>{stats.error}</p>}
 <h2>Báo cáo</h2><select aria-label="Trạng thái báo cáo" value={status} onChange={e=>setStatus(e.target.value)}><option value="pending">Chờ xử lý</option><option value="resolved">Đã xử lý</option><option value="rejected">Đã bỏ qua</option></select><List url={'/admin/reports?status='+status} revision={revision} render={r=><article key={r._id} className="journal-card"><b>{r.post?.title}</b><p>{r.reporter?.displayName} · {r.reason} {r.note}</p>
 {status==='pending'&&['hide','dismiss'].map(a=><Action key={a} run={async()=>{if(confirm('Xử lý báo cáo này?')){await api.patch('/admin/reports/'+r._id,{action:a});refresh();}}}>{a==='hide'?'Ẩn bài':'Bỏ qua'}</Action>)}{r.post?.status==='hidden'&&<Action run={async()=>{await api.patch('/admin/posts/'+r.post._id+'/status',{status:'active'});refresh();}}>Hiện lại bài</Action>}</article>}/>
 <h2>Tài khoản</h2><List url="/admin/users" revision={revision} render={u=><article key={u._id} className="journal-card">{u.displayName} · @{u.username}
 {!u.isOwner&&u._id!==user._id&&(u.role!=='admin'||user.isOwner)&&<Action run={async()=>{if(confirm('Đổi trạng thái tài khoản này?')){await api.patch('/admin/users/'+u._id,{locked:!u.locked});refresh();}}}>{u.locked?'Mở khóa':'Khóa'}</Action>}</article>}/>
 <h2>Địa điểm nổi bật</h2>{stats.data?.locations.map(l=><p key={l._id}>{l.name} · {l.count} bài</p>)}</>;
}
