'use strict';
const icons = {
 home:'M3 10 12 3l9 7v10H3z M9 20v-7h6v7', compass:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M16 8l-3 5-5 3 3-5z',
 bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-3a8 8 0 0 1 16 0v3',
 plus:'M12 5v14 M5 12h14',search:'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8',
 comment:'M21 11a9 9 0 0 1-9 9H3l2-4a9 9 0 1 1 16-5',pin:'M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 1 1 14 0 M14 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
 arrow:'M5 12h14 M14 7l5 5-5 5',calendar:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16',wallet:'M3 5h17v15H3z M15 10h6v6h-6z',flag:'M5 21V3 M5 3h14l-3 4 3 4H5',
 shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z M8 12l3 3 5-6',sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M5 19l1-1 M18 6l1-1',more:'M5 12h.01 M12 12h.01 M19 12h.01',logout:'M9 3H3v18h6 M9 12h12 M17 8l4 4-4 4',edit:'m4 16-1 5 5-1L21 7l-5-5z M13 5l6 6',lock:'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4',check:'m5 12 4 4L19 6',bookmark:'M5 3h14v18l-7-5-7 5z',map:'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15 M15 6v15'};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name]||icons.compass}"/></svg>`;
const esc = value => String(value??'').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const photo = {
 hagiang:'https://media.mia.vn/uploads/blog-du-lich/hanh-trinh-lang-thang-ha-giang-bang-xe-may-day-thu-vi-15-1668444071.jpg',
 hoian:'hoian.webp',
 ninhbinh:'https://sodulich.ninhbinh.gov.vn/uploads/images/trang_an1.jpg'
};
const people = [
 {id:'me',name:'Minh Anh',username:'minhanh',bio:'Một chiếc máy ảnh, một cuốn sổ nhỏ và những ngày rong ruổi.',avatar:'',locked:false},
 {id:'lan',name:'Lan Nguyễn',username:'lannguyen',bio:'Đi chậm một chút, để thấy nhiều hơn.',avatar:'',locked:false},
 {id:'nam',name:'Hoàng Nam',username:'hoangnam',bio:'Yêu những cung đường miền Bắc và cà phê buổi sáng.',avatar:'',locked:false},
 {id:'an',name:'An Trần',username:'antran',bio:'Gom nhặt những điều bình dị trên từng hành trình.',avatar:'',locked:false},
 {id:'admin',name:'Quản trị viên',username:'admin',bio:'',avatar:'',locked:false}
];
const seedPosts = [
 {id:'p1',author:'lan',title:'Hà Giang, những ngày chạm vào mây',content:'Có những nơi khiến mình chỉ muốn dừng lại thật lâu. Sáng thức dậy giữa những triền núi xanh, nghe gió đi qua ô cửa và thấy mọi bộn bề bỗng nhỏ lại.\n\nMình dành ba ngày đi thật chậm, dừng ở những quán nhỏ ven đường và chụp thật nhiều ảnh. Nhớ mang áo ấm và kiểm tra thời tiết trước khi lên đường nhé!',location:'Hà Giang',date:'2026-11-12',cost:2450000,visibility:'public',images:[photo.hagiang],tags:'#hagiang #chamvaomay #vietnam',likes:128,likedBy:[],comments:[{id:'c1',author:'nam',text:'Nhìn những thửa ruộng mà muốn lên đường ngay!',parent:null}],hidden:false,created:6},
 {id:'p2',author:'nam',title:'Một chiều chậm rãi ở Hội An',content:'Phố cổ lên đèn, dòng sông Hoài lấp lánh và một buổi chiều chẳng cần kế hoạch. Mình đi bộ dọc bờ sông, ăn cao lầu rồi ngồi ngắm những chiếc thuyền trôi qua.',location:'Hội An',date:'2026-11-08',cost:890000,visibility:'public',images:[photo.hoian],tags:'#hoian #phoco #dicham',likes:86,likedBy:[],comments:[],hidden:false,created:5},
 {id:'p3',author:'an',title:'Tràng An trong một ngày xanh',content:'Ngồi trên thuyền nhỏ, đi giữa những dãy núi đá vôi và nghe tiếng mái chèo khua mặt nước. Chuyến đi cuối tuần vừa đủ để nạp lại năng lượng.',location:'Ninh Bình',date:'2026-11-03',cost:760000,visibility:'public',images:[photo.ninhbinh],tags:'#ninhbinh #trangan #cuoituan',likes:64,likedBy:[],comments:[],hidden:false,created:4},
 {id:'p4',author:'me',title:'Gửi lại một chút bình yên ở Hội An',content:'Một buổi sáng đi bộ qua phố vàng, ngồi uống cà phê và viết vài dòng vào cuốn nhật ký. Đây là bài viết đầu tiên của mình trên Wanderly.',location:'Hội An',date:'2026-10-28',cost:1250000,visibility:'public',images:[photo.hoian],tags:'#nhatky #hoian',likes:24,likedBy:[],comments:[],hidden:false,created:3},
 {id:'p5',author:'an',title:'Góc nhỏ dành cho những người bạn',content:'Mình lưu ở đây một vài kỷ niệm của chuyến đi. Bài viết này chỉ dành cho những người đang theo dõi mình.',location:'Ninh Bình',date:'2026-10-20',cost:650000,visibility:'followers',images:[photo.ninhbinh],tags:'#banbe #ninhbinh',likes:12,likedBy:[],comments:[],hidden:false,created:2}
];
const fresh = () => ({users:structuredClone(people),posts:structuredClone(seedPosts),follows:[['me','lan'],['me','nam'],['nam','me']],notifications:[{id:'n1',recipient:'me',actor:'nam',text:'Hoàng Nam đã bắt đầu theo dõi bạn.',read:false,post:null},{id:'n2',recipient:'me',actor:'lan',text:'Lan Nguyễn đã thích bài viết của bạn.',read:false,post:'p4'}],bookmarks:{},reports:[{id:'r1',post:'p2',by:'an',reason:'Thông tin cần kiểm tra',status:'pending'}]});
let data;
try {data=JSON.parse(localStorage.getItem('travel-diary-social-v1'))||fresh();if(!Array.isArray(data.posts)||!Array.isArray(data.users))data=fresh();} catch {data=fresh();}
if(!data.bookmarks||typeof data.bookmarks!=='object')data.bookmarks={};
let viewer=sessionStorage.getItem('td-social-viewer')||'guest';
let query='',placeFilter='',limit=3,replyTo=null,editingImages=[],observer;
const $ = selector => document.querySelector(selector);
const user = id => data.users.find(u=>u.id===id);
const isAdmin = () => viewer==='admin';
const member = () => viewer!=='guest'&&!isAdmin()&&user(viewer)&&!user(viewer).locked;
const savedPosts = () => data.bookmarks[viewer]||[];
const bookmarked = id => savedPosts().includes(id);
const matchingUsers = () => !query?[]:data.users.filter(u=>!u.locked&&u.id!=='admin'&&normalize(u.id+' '+u.username+' '+u.name).includes(normalize(query.replace(/^@/,''))));
const following = id => data.follows.some(f=>f[0]===viewer&&f[1]===id);
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const money = value => Number(value).toLocaleString('vi-VN')+' ₫';
const dateLabel = value => value.split('-').reverse().join('/');
const uid = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2,'0')).join('');
const avatar = person => person?.avatar?`<img class="avatar" src="${esc(person.avatar)}" alt="Ảnh đại diện ${esc(person.name)}">`:`<span class="avatar">${esc((person?.name||'Khách').split(' ').map(v=>v[0]).slice(-2).join(''))}</span>`;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
let lastSaved=JSON.stringify(data);
function save(){try{localStorage.setItem('travel-diary-social-v1',JSON.stringify(data));lastSaved=JSON.stringify(data);return true;}catch{data=JSON.parse(lastSaved);toast('Bộ nhớ trình duyệt đã đầy. Chưa lưu được. Hãy giảm dung lượng ảnh hoặc giải phóng bộ nhớ.');return false;}}
function canView(post){if(isAdmin())return true;if(user(post.author)?.locked)return false;if(post.author===viewer)return true;if(post.hidden)return false;return post.visibility==='public'||following(post.author);}
function requireMember(){if(member())return true;toast('Chọn tài khoản thành viên để thử thao tác này.');roles();return false;}
function notify(recipient,text,post=null){if(recipient===viewer)return;data.notifications.unshift({id:uid(),recipient,actor:viewer,text,post,read:false});}
function route(){const [path,parameter]=location.hash.slice(1).split('/');return {page:path||'explore',parameter};}
function go(path){query='';placeFilter='';limit=3;location.hash=path;render();window.scrollTo({top:0,behavior:'smooth'});}
function nav(path,label,symbol){return `<a aria-label="${label}" href="#${path}" class="${route().page===path?'active':''}">${icon(symbol)}<span>${label}</span>${path==='notifications'&&data.notifications.filter(n=>n.recipient===viewer&&!n.read).length?'<b class="count">'+data.notifications.filter(n=>n.recipient===viewer&&!n.read).length+'</b>':''}</a>`;}
function shell(){
 const current=user(viewer);const admin=isAdmin();
 $('#sidebar').innerHTML=`<a class="logo" href="#explore"><span class="mark">t</span><span><strong>Wanderly</strong><small>NHẬT KÝ NHỮNG CHUYẾN ĐI</small></span></a><div class="nav-label">HÀNH TRÌNH CỦA BẠN</div><nav class="nav">${nav('feed','Bảng tin','home')}${nav('explore','Khám phá','compass')}${nav('notifications','Thông báo','bell')}${nav('profile','Trang cá nhân','user')}${nav('saved','Đã lưu','bookmark')}${nav('map','Bản đồ Việt Nam','map')}${admin?nav('admin','Quản trị','shield'):''}</nav><div class="sidebar-bottom"><div class="smallbox"><strong>Mỗi chuyến đi là một câu chuyện.</strong>Lưu lại những nơi đã đến, những điều đã thấy.</div><button class="account" data-action="roles" style="width:100%;text-align:left">${avatar(current)}<span><strong>${esc(current?.name||'Khách ghé thăm')}</strong><small>${admin?'Tài khoản quản trị':current?'@'+esc(current.username):'Đang xem bài công khai'}</small></span>${icon('more')}</button></div>`;
 $('#topbar').innerHTML=`<a class="mobile-logo" href="#explore">Wanderly</a><form class="searchbar" id="search-form">${icon('search')}<input id="search" aria-label="Tìm địa điểm hoặc hashtag" placeholder="Tìm địa điểm hoặc #hashtag..." value="${esc(query)}"></form><div class="top-actions"><button class="iconbtn" data-action="theme" title="Chuyển sáng tối" aria-label="Chuyển sáng tối">${icon('sun')}</button><button class="secondary" data-action="roles">${viewer==='guest'?'Vào trải nghiệm':'Đổi tài khoản'}</button><button class="primary" data-action="create">${icon('plus')} Viết nhật ký</button></div>`;
 $('#search-form').onsubmit=e=>{e.preventDefault();query=$('#search').value.trim();placeFilter='';limit=3;location.hash='explore';renderBody();};
}
function openModal(title,content){flushDraft?.();flushDraft=null;$('#modal').innerHTML=`<div class="modal-head"><h2>${title}</h2><button data-action="close" aria-label="Đóng">×</button></div>${content}`;if(!$('#modal').open)$('#modal').showModal();}
function closeModal(){flushDraft?.();flushDraft=null;$('#modal').close();replyTo=null;editingImages=[];}
function themeSwitch(){
 const dark=document.body.classList.contains('dark');
 return '<button class="mode-switch" type="button" role="switch" aria-label="Chế độ tối" aria-checked="'+dark+'" data-action="theme"><span>Chế độ tối</span><span class="mode-track" aria-hidden="true"><span class="mode-thumb"></span></span></button>';
}
function setTheme(dark){
 document.body.classList.toggle('dark',dark);
 document.querySelectorAll('.mode-switch').forEach(b=>b.setAttribute('aria-checked',String(dark)));
 try{localStorage.setItem('td-social-theme',dark?'dark':'light');}catch{}
}
let drag=null;
document.addEventListener('pointerdown',event=>{
 const track=event.target.closest('.mode-track');
 if(!track||!event.isPrimary||event.button!==0)return;
 const button=track.closest('button');
 button.setPointerCapture(event.pointerId);
 drag={button,track,id:event.pointerId,start:event.clientX,moved:false,dark:document.body.classList.contains('dark')};
});
document.addEventListener('pointermove',event=>{
 if(!drag||drag.id!==event.pointerId)return;
 const dx=event.clientX-drag.start;
 if(Math.abs(dx)>4)drag.moved=true;
 if(drag.moved){
   const offset=Math.max(0,Math.min(22,(drag.dark?22:0)+dx));
   drag.track.style.setProperty('--thumb-x',offset+'px');
 }
});
function endThemeDrag(event){
 if(!drag||drag.id!==event.pointerId)return;
 const {button,track,start,dark,moved}=drag;
 drag=null;
 track.style.removeProperty('--thumb-x');
 if(event.type==='pointerup'&&moved){
   setTheme((dark?22:0)+event.clientX-start>=11);
   button.dataset.skipClick='yes';
   setTimeout(()=>delete button.dataset.skipClick,0);
 }
}
document.addEventListener('pointerup',endThemeDrag);
document.addEventListener('pointercancel',endThemeDrag);
document.addEventListener('lostpointercapture',endThemeDrag);
function roles(){openModal('Trải nghiệm Wanderly',`<p class="form-note">Chọn vai trò để thử demo. Các thao tác được lưu trên trình duyệt này. Đăng nhập thật và API sẽ được kết nối ở bản phát triển tiếp theo.</p>${themeSwitch()}<div class="role-grid"><button class="role-option" data-action="role" data-id="guest">${icon('compass')}<span><strong>Khách</strong><small>Xem bài công khai và tìm địa điểm</small></span></button>${data.users.map(u=>`<button class="role-option" data-action="role" data-id="${u.id}" ${u.locked?'disabled':''}>${avatar(u)}<span><strong>${esc(u.name)}${u.locked?' · Đã khoá':''}</strong><small>${u.id==='admin'?'Duyệt báo cáo, quản lý tài khoản và thống kê':'Thành viên · @'+esc(u.username)}</small></span></button>`).join('')}</div>`);}
function empty(title,text){return `<div class="empty">${icon('compass')}<h3>${title}</h3><p>${text}</p></div>`;}
function side(){return `<aside class="right-column"><section class="side-panel"><h3>Đi đâu tiếp theo?</h3>${[['Hà Giang',photo.hagiang],['Hội An',photo.hoian],['Ninh Bình',photo.ninhbinh]].map(([name,img])=>`<button class="place" data-action="place" data-id="${name}"><img src="${img}" alt="${name}" loading="lazy"><span><strong>${name}</strong><small>${data.posts.filter(p=>canView(p)&&!p.hidden&&p.location===name).length} câu chuyện được chia sẻ</small></span>${icon('arrow')}</button>`).join('')}</section><section class="side-panel note"><h3>Một chuyến đi.<br>Nhiều điều để nhớ.</h3><p>Một khung hình, một quán nhỏ, một khoảnh khắc. Viết lại câu chuyện của riêng bạn.</p><button class="secondary" data-action="create">${icon('plus')} Viết nhật ký</button></section><p class="side-foot">Ảnh minh hoạ từ MIA.vn, Vietnam Honeymoons và Sở Du lịch Ninh Bình. Nội dung bài viết là dữ liệu mẫu.</p></aside>`;}
function visibleThread(post) {
 const eligible=post.comments.filter(c=>isAdmin()||!user(c.author)?.locked);
 const roots=new Set(eligible.filter(c=>!c.parent).map(c=>c.id));
 return eligible.filter(c=>!c.parent||roots.has(c.parent));
}
function refreshCard(post) {
 const node=document.querySelector('[data-card="'+CSS.escape(post.id)+'"]');
 if(node)node.outerHTML=card(post);
}
function card(post){const author=user(post.author);const comments=visibleThread(post);return `<article class="post" data-card="${esc(post.id)}"><div class="post-head">${avatar(author)}<div class="byline"><a href="#profile/${post.author}">${esc(author.name)}</a><small>@${esc(author.username)} · ${post.visibility==='public'?'Công khai':'Chỉ người theo dõi'}${post.hidden?' · Đã ẩn':''}</small></div>${member()&&post.author===viewer?`<button class="iconbtn" data-action="edit" data-id="${post.id}" aria-label="Sửa bài">${icon('edit')}</button>`:''}</div>${post.images.length?`<div class="image-wrap"><img class="post-cover" src="${esc(post.images[0])}" alt="${esc(post.title)}" data-action="detail" data-id="${post.id}" loading="lazy"><span class="location-tag">${icon('pin')}${esc(post.location)}${post.images.length>1?' · '+post.images.length+' ảnh':''}</span></div>`:''}<div class="post-body"><h3><a href="#post/${post.id}">${esc(post.title)}</a></h3><p>${esc(post.content.slice(0,180))}${post.content.length>180?'…':''}</p><div class="tags">${esc(post.tags)}</div><div class="post-meta"><span>${icon('calendar')}${dateLabel(post.date)}</span><span>${icon('wallet')}${money(post.cost)}</span></div></div><div class="post-actions"><button class="${post.likedBy.includes(viewer)?'liked':''}" data-action="like" data-id="${post.id}" aria-label="Thích bài ${esc(post.title)}">${icon('heart')}${post.likes+post.likedBy.length}</button><button data-action="detail" data-id="${post.id}">${icon('comment')}${comments.length} bình luận</button><button class="save-post ${bookmarked(post.id)?'is-saved':''}" data-action="bookmark" data-id="${post.id}" aria-label="${bookmarked(post.id)?'Bỏ lưu':'Lưu'} bài viết" title="${bookmarked(post.id)?'Bỏ lưu bài viết':'Lưu bài viết'}">${icon('bookmark')}</button>${member()&&post.author!==viewer?`<button class="report" data-action="report" data-id="${post.id}">${icon('flag')}Báo cáo</button>`:''}${member()&&post.author===viewer?`<button class="report" data-action="delete" data-id="${post.id}">Xoá bài</button>`:''}</div></article>`;}
function renderList(){const {page,parameter}=route();const exploring=page==='explore';const term=exploring?normalize(query.replace(/^@/,'')):'';let list=data.posts.filter(canView);if(page==='feed'){list=list.filter(p=>p.author===viewer||following(p.author));}else if(page==='profile'){list=list.filter(p=>p.author===(parameter||viewer));}else if(page==='saved'){list=list.filter(p=>bookmarked(p.id));}else list=list.filter(p=>!p.hidden);
 list=list.filter(p=>(!exploring||!query||(term&&normalize(p.location+' '+p.tags+' '+p.title+' '+(user(p.author)?.username||'')+' '+(user(p.author)?.name||'')+' '+p.author).includes(term)))&&(!exploring||!placeFilter||p.location===placeFilter)).sort((a,b)=>b.created-a.created);
 const host=$('#posts');if(!host)return;if(exploring&&query==='@'){observer?.disconnect();host.innerHTML=empty('Nhập ID sau dấu @','Ví dụ: @lannguyen');$('#result-count').textContent='';$('#loadmore').innerHTML='';return;}host.innerHTML=(page==='explore'&&query?renderUserResults():'')+(list.length?list.slice(0,limit).map(card).join(''):empty('Chưa có câu chuyện ở đây',query||placeFilter?'Thử tìm tên người dùng, @username, địa điểm hoặc hashtag khác nhé.':'Theo dõi một tác giả hoặc viết nhật ký đầu tiên của bạn.'));
 $('#result-count').textContent=list.length+' bài viết';$('#loadmore').innerHTML=list.length>limit?'<button class="secondary" data-action="more">Xem thêm câu chuyện</button>':'<span class="subtle">Bạn đã xem hết những câu chuyện này.</span>';
 observer?.disconnect();if(list.length>limit){observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){limit+=3;renderList();}},{rootMargin:'80px'});observer.observe($('#loadmore'));}
}
function renderBody(){const {page,parameter}=route();observer?.disconnect();
 if(page==='admin'){adminPage(parameter||'reports');return;}
 if(page==='notifications'){notifications();return;}
 if(page==='saved'){savedPage();return;}
 if(page==='map'){mapPage();return;}
 if(page==='post'){const p=data.posts.find(p=>p.id===parameter);$('#main').innerHTML=p&&canView(p)?`<a class="subtle" href="#explore">← Về khám phá</a><div style="max-width:850px;margin:24px auto">${card(p)}</div>`:empty('Không tìm thấy bài viết','Bài đã bị xoá hoặc tài khoản hiện tại chưa có quyền xem.');if(p&&canView(p))detail(p.id);return;}
 if(page==='profile'){profile(parameter||viewer);return;}
 if(page==='feed'&&!member()){$('#main').innerHTML=`<h1>Bảng tin của bạn</h1>${empty('Câu chuyện từ những người bạn theo dõi','Chọn tài khoản thành viên để xem bảng tin cá nhân.')}<div class="loadmore"><button class="primary" data-action="roles">Chọn tài khoản</button></div>`;return;}
 if(!['explore','feed'].includes(page)){$('#main').innerHTML=empty('Trang chưa tồn tại','<a href="#explore">Quay lại trang khám phá</a>');return;}
 $('#main').innerHTML=`<div class="eyebrow">NHỮNG HÀNH TRÌNH ĐÁNG NHỚ</div><h1>${page==='feed'?'Những câu chuyện gần bạn.':'Đi xa hơn. Nhớ lâu hơn.'}</h1><p class="intro">${page==='feed'?'Theo chân những người bạn yêu thích, qua từng trang nhật ký.':'Một góc Việt Nam, một câu chuyện mới. Hành trình tiếp theo bắt đầu từ đây.'}</p>${page==='explore'&&!query?`<section class="hero"><img src="${photo.hagiang}" alt="Những thửa ruộng xanh trên núi Hà Giang"><div class="hero-copy"><div class="eyebrow">HÀNH TRÌNH NỔI BẬT</div><h2>Hà Giang, nơi<br>mây chạm vào núi.</h2><p>Những cung đường quanh co và khoảng trời khiến ta muốn dừng lại thật lâu.</p><button data-action="detail" data-id="p1">Đọc câu chuyện ${icon('arrow')}</button></div><div class="hero-label">${icon('pin')} Hà Giang, Việt Nam</div></section>`:''}<div class="layout"><section><div class="feed-head"><h2>${query?'Kết quả tìm kiếm':'Nhật ký từ cộng đồng'}</h2><span class="subtle" id="result-count"></span></div><div class="chips">${['','Hà Giang','Hội An','Ninh Bình'].map(p=>`<button class="chip ${placeFilter===p?'active':''}" data-action="filter" data-id="${p}">${p||'Tất cả'}</button>`).join('')}</div><div id="posts"></div><div class="loadmore" id="loadmore"></div></section>${side()}</div>`;renderList();
}
function render(){if(user(viewer)?.locked){viewer='guest';sessionStorage.setItem('td-social-viewer',viewer);}shell();renderBody();}
function profile(id){const person=user(id);if(!person||(person.locked&&!isAdmin())){$('#main').innerHTML=empty('Chưa có hồ sơ để hiển thị','Chọn một tài khoản thành viên để xem trang cá nhân.');return;}
 $('#main').innerHTML=`<div class="profile-hero">Những nơi đã đi, những điều còn nhớ.</div><div class="profile-info">${avatar(person)}<div><h2>${esc(person.name)}</h2><span class="subtle">@${esc(person.username)}</span><p>${esc(person.bio)}</p><div class="profile-numbers"><strong>${data.posts.filter(p=>p.author===id&&canView(p)).length}</strong> bài viết &nbsp; · &nbsp; <strong>${data.follows.filter(f=>f[1]===id).length}</strong> người theo dõi &nbsp; · &nbsp; <strong>${data.follows.filter(f=>f[0]===id).length}</strong> đang theo dõi</div></div>${id===viewer?'<button class="secondary" data-action="profile-edit">Chỉnh sửa hồ sơ</button>':id!=='admin'?`<button class="${following(id)?'secondary':'primary'}" data-action="follow" data-id="${id}">${following(id)?'Đang theo dõi':'Theo dõi'}</button>`:''}</div><div class="layout"><section><div class="feed-head"><h2>Nhật ký hành trình</h2><span id="result-count" class="subtle"></span></div><div id="posts"></div><div id="loadmore" class="loadmore"></div></section>${side()}</div>`;renderList();
}

function renderUserResults(){
 const users=matchingUsers();
 return `<section class="user-search-results"><div class="feed-head"><h2>Tài khoản phù hợp</h2><span class="subtle">${users.length} người dùng</span></div>${users.length?users.map(u=>`<a class="user-search-card" href="#profile/${esc(u.id)}">${avatar(u)}<span><strong>${esc(u.name)}</strong><small>@${esc(u.username)} · ID: ${esc(u.id)}</small></span>${icon('arrow')}</a>`).join(''):'<p class="form-note">Chưa tìm thấy tài khoản phù hợp.</p>'}</section>`;
}
function savedPage(){
 if(!member()){$('#main').innerHTML=empty('Bài viết đã lưu','Chọn tài khoản thành viên để lưu và xem các bài viết yêu thích.');return;}
 $('#main').innerHTML=`<div class="eyebrow">BỘ SƯU TẬP CỦA BẠN</div><h1>Bài viết đã lưu</h1><p class="intro">Những chuyến đi bạn muốn giữ lại và khám phá sau.</p><div class="saved-layout"><section><div class="feed-head"><h2>Nhật ký yêu thích</h2><span id="result-count" class="subtle"></span></div><div id="posts"></div><div id="loadmore" class="loadmore"></div></section>${side()}</div>`;
 renderList();
}

function notifications(){const list=data.notifications.filter(n=>n.recipient===viewer);$('#main').innerHTML=`<div class="page-heading"><div><div class="eyebrow">KẾT NỐI QUA NHỮNG CHUYẾN ĐI</div><h1>Thông báo</h1></div>${member()?'<button class="secondary" data-action="read-all">Đánh dấu tất cả đã đọc</button>':''}</div><p class="intro">Những tương tác mới nhất với câu chuyện của bạn.</p><div class="notifications">${list.length?list.map(n=>`<div class="notification ${n.read?'':'unread'}">${avatar(user(n.actor))}<div><p>${esc(n.text)}</p><small>${n.read?'Đã đọc':'Chưa đọc'}</small></div><button class="secondary" data-action="read" data-id="${n.id}">${n.post?'Xem bài':'Đã xem'}</button></div>`).join(''):empty('Chưa có thông báo',member()?'Thông báo sẽ xuất hiện khi có người tương tác với bạn.':'Chọn tài khoản thành viên để xem thông báo.')}</div>`;}
function detail(id){const p=data.posts.find(p=>p.id===id);if(!p||!canView(p)){toast('Bạn chưa có quyền xem bài viết này.');return;}
 const visibleComments=visibleThread(p);const commentHTML=c=>`<div class="comment ${c.parent?'reply':''}"><strong>${esc(user(c.author)?.name||'Thành viên')}</strong><p>${esc(c.text)}</p><button class="comment-heart ${(c.likedBy||[]).includes(viewer)?'liked':''}" data-action="comment-like" data-id="${p.id}" data-comment="${c.id}" title="Thích bình luận" aria-label="Thích bình luận">${icon('heart')}<span>${(c.likedBy||[]).length||''}</span></button>${member()?`<button data-action="reply" data-id="${p.id}" data-comment="${c.parent||c.id}">Trả lời</button>`:''}${member()&&(c.author===viewer||p.author===viewer)?`<button data-action="comment-delete" data-id="${p.id}" data-comment="${c.id}">Xoá</button>`:''}</div>`;
 const comments=visibleComments.filter(c=>!c.parent).map(c=>commentHTML(c)+visibleComments.filter(r=>r.parent===c.id).map(commentHTML).join('')).join('');
 openModal(esc(p.title),`${p.images.length?`<img class="detail-image" id="detail-image" src="${esc(p.images[0])}" alt="${esc(p.title)}">${p.images.length>1?'<div class="gallery">'+p.images.map(src=>`<button data-action="gallery" data-src="${esc(src)}"><img src="${esc(src)}" alt="Ảnh trong chuyến đi"></button>`).join('')+'</div>':''}`:''}<div class="post-meta"><span>${icon('pin')}${esc(p.location)}</span><span>${dateLabel(p.date)}</span><span>${money(p.cost)}</span></div><p style="white-space:pre-line;line-height:1.9;font-size:13px">${esc(p.content)}</p><p class="tags">${esc(p.tags)}</p><p class="form-note">Chia sẻ bởi <a href="#profile/${p.author}" data-action="close">${esc(user(p.author).name)}</a> · ${p.visibility==='public'?'Công khai':'Chỉ người theo dõi'}</p><h3 style="margin-top:24px">Bình luận (${visibleComments.length})</h3>${comments||'<p class="form-note">Hãy là người đầu tiên chia sẻ cảm nghĩ.</p>'}${member()?`<p class="form-note" id="reply-label">${replyTo?'Đang trả lời bình luận · <button data-action="cancel-reply" data-id="'+p.id+'">Huỷ</button>':''}</p><form class="comment-form" id="comment-form"><input name="comment" required maxlength="1000" aria-label="Nội dung bình luận" placeholder="Viết bình luận..."><button class="primary">Gửi</button></form>`:'<button class="secondary" data-action="roles">Chọn thành viên để bình luận</button>'}`);
 const form=$('#comment-form');if(form)form.onsubmit=e=>{e.preventDefault();const text=form.elements.comment.value.trim();if(!text)return;const parent=replyTo; const current=data.posts.find(item=>item.id===id);if(!member()||!current||!canView(current)||(parent&&!visibleThread(current).some(c=>c.id===parent))){toast('Bài viết hoặc bình luận đã thay đổi.');return;}current.comments.push({id:uid(),author:viewer,text,parent});notify(p.author,user(viewer).name+' đã bình luận bài viết của bạn.',p.id);if(!save())return;replyTo=null;shell();refreshCard(current);detail(id);};
}
async function readImage(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Chỉ nhận ảnh JPG, PNG hoặc WebP.');if(file.size>5*1024*1024)throw Error('Mỗi ảnh tối đa 5 MB.');const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');const ratio=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas.toDataURL('image/jpeg',.78);}
function previewImages(){$('#previews').innerHTML=editingImages.map((src,i)=>`<div class="preview"><img src="${esc(src)}" alt="Ảnh đã chọn ${i+1}"><button type="button" data-action="remove-image" data-id="${i}" aria-label="Bỏ ảnh ${i+1}">×</button></div>`).join('');}
let flushDraft=null;
function attachDraft(form, key) {
 const names=['title','content','location','date','cost','visibility','tags'];
 const read=()=>Object.fromEntries(names.map(name=>[name,form.elements[name].value]));
 const initial=JSON.stringify(read());
 const status=form.querySelector('.draft-status');
 let timer,dirty=false;
 try{
   const draft=JSON.parse(localStorage.getItem(key));
   if(draft){
     for(const name of names)if(typeof draft[name]==='string')form.elements[name].value=draft[name];
     status.textContent='Đã mở bản nháp trên máy này. Nếu có ảnh, hãy chọn lại.';
   }
 }catch{}
 function flush(){
   clearTimeout(timer);
   if(!dirty)return;
   try{
     const snapshot=JSON.stringify(read());
     if(snapshot===initial)localStorage.removeItem(key);
     else localStorage.setItem(key,snapshot);
     dirty=false;
     status.textContent=snapshot===initial?'':'Đã lưu nháp phần chữ và thông tin chuyến đi trên máy này.';
   }catch{status.textContent='Chưa lưu được bản nháp. Hãy sao chép nội dung trước khi đóng.';}
 }
 flushDraft=flush;
 form.addEventListener('input',event=>{
   if(!names.includes(event.target.name))return;
   dirty=true;clearTimeout(timer);timer=setTimeout(flush,600);
 });
 return ()=>{
   dirty=false;clearTimeout(timer);flushDraft=null;
   localStorage.removeItem(key);
 };
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushDraft?.();});
window.addEventListener('pagehide',()=>flushDraft?.());
function postForm(id){if(!requireMember())return;const p=data.posts.find(p=>p.id===id);if(p&&p.author!==viewer)return;editingImages=p?[...p.images]:[];
 openModal(p?'Chỉnh sửa nhật ký':'Viết một trang nhật ký',`<form id="post-form"><label>Tiêu đề chuyến đi<input name="title" required minlength="5" maxlength="120" placeholder="Một ngày đáng nhớ ở..." value="${esc(p?.title||'')}"></label><label>Câu chuyện của bạn<textarea name="content" required maxlength="5000" placeholder="Bạn đã đi đâu, trải nghiệm điều gì?">${esc(p?.content||'')}</textarea></label><div class="form-grid"><label>Địa điểm<input name="location" required maxlength="100" placeholder="Ví dụ, Hội An" value="${esc(p?.location||'')}"></label><label>Ngày đi<input type="date" name="date" required max="${new Date().toLocaleDateString('en-CA')}" value="${p?.date||''}"></label><label>Chi phí (VNĐ)<input type="number" name="cost" min="0" max="1000000000000" required value="${p?.cost??0}"></label><label>Ai được xem?<select name="visibility"><option value="public">Công khai</option><option value="followers" ${p?.visibility==='followers'?'selected':''}>Chỉ người theo dõi</option></select></label></div><label>Hashtag<input name="tags" maxlength="150" placeholder="#hoian #nhatky" value="${esc(p?.tags||'')}"></label><label>Ảnh chuyến đi<input type="file" id="images" accept="image/jpeg,image/png,image/webp" multiple></label><div class="form-note">Tối đa 6 ảnh · JPG, PNG hoặc WebP · Mỗi ảnh tối đa 5 MB</div><div class="previews" id="previews"></div><p class="form-note draft-status" role="status">Tự lưu nháp phần chữ và thông tin chuyến đi. Khi mở lại, hãy chọn lại ảnh.</p><div class="form-actions"><button type="button" class="secondary" data-action="close">Huỷ</button><button class="primary" id="save-post">${p?'Lưu thay đổi':'Đăng nhật ký'}</button></div></form>`);previewImages();
 const form=$('#post-form'), picker=$('#images'), submit=$('#save-post');
 const clearDraft=attachDraft(form,'wanderly:draft:'+viewer+':'+(p?.id||'new'));
 const active=()=>form.isConnected&&$('#modal').open;
 picker.onchange=async()=>{
   const files=Array.from(picker.files);
   if(files.length+editingImages.length>6){toast('Mỗi bài được chọn tối đa 6 ảnh.');picker.value='';return;}
   picker.disabled=submit.disabled=true;
   try{
     const images=await Promise.all(files.map(readImage));
     if(active()){editingImages.push(...images);previewImages();}
   }catch(err){if(active())toast(err.message);}
   finally{picker.value='';picker.disabled=submit.disabled=false;}
 };
 $('#post-form').onsubmit=e=>{e.preventDefault();if(picker.disabled)return;if(!member()||(p&&!data.posts.some(item=>item.id===id&&item.author===viewer))){toast('Tài khoản hoặc bài viết đã thay đổi.');return;}const fields=Object.fromEntries(new FormData(e.target));if(fields.title.trim().length<5||!fields.content.trim()||!fields.location.trim()){toast('Nhập đủ tiêu đề, câu chuyện và địa điểm.');return;}if(fields.date>new Date().toLocaleDateString('en-CA')){toast('Ngày đi cần là hôm nay hoặc trước đó.');return;}const tags=[...new Set((fields.content+' '+fields.tags).match(/#[\p{L}\p{N}_]+/gu)||[])].join(' ').toLowerCase();const values={title:fields.title.trim(),content:fields.content.trim(),location:fields.location.trim(),date:fields.date,cost:Number(fields.cost),visibility:fields.visibility,tags,images:[...editingImages]};if(p)Object.assign(data.posts.find(item=>item.id===id),values);else data.posts.unshift({...values,id:uid(),author:viewer,likes:0,likedBy:[],comments:[],hidden:false,created:Date.now()});if(!save())return;clearDraft();closeModal();go('profile');toast(p?'Đã lưu thay đổi.':'Trang nhật ký mới đã được đăng.');};
}
function editProfile(){if(!requireMember())return;const p=user(viewer);openModal('Chỉnh sửa hồ sơ',`<form id="profile-form"><label>Tên hiển thị<input name="name" value="${esc(p.name)}" required maxlength="60"></label><label>Đôi điều về bạn<textarea name="bio" maxlength="200">${esc(p.bio)}</textarea></label><label>Ảnh đại diện<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp"></label><p class="form-note">JPG, PNG hoặc WebP · Tối đa 5 MB</p><div class="form-actions"><button class="primary">Lưu hồ sơ</button></div></form>`);$('#profile-form').onsubmit=async e=>{e.preventDefault();const form=e.target;const name=form.elements.name.value.trim();if(!name)return;const submit=form.querySelector('button');submit.disabled=true;try{const f=form.elements.avatar.files[0];const image=f?await readImage(f):p.avatar;Object.assign(user(viewer),{name,bio:form.elements.bio.value.trim(),avatar:image});if(!save()){submit.disabled=false;return;}closeModal();render();toast('Đã cập nhật hồ sơ.');}catch(err){toast(err.message);submit.disabled=false;}};}
function reportForm(id){if(!requireMember())return;if(data.reports.some(r=>r.post===id&&r.by===viewer)){toast('Bạn đã báo cáo bài viết này.');return;}openModal('Báo cáo bài viết',`<form id="report-form"><p class="form-note">Chọn lý do để quản trị viên kiểm tra nội dung.</p><label>Lý do<select name="reason"><option>Spam hoặc quảng cáo</option><option>Nội dung phản cảm</option><option>Thông tin sai sự thật</option><option>Khác</option></select></label><label>Thông tin bổ sung<textarea name="note" maxlength="500" placeholder="Mô tả ngắn điều cần kiểm tra..."></textarea></label><div class="form-actions"><button class="primary">Gửi báo cáo</button></div></form>`);$('#report-form').onsubmit=e=>{e.preventDefault();data.reports.push({id:uid(),post:id,by:viewer,reason:e.target.elements.reason.value,note:e.target.elements.note.value.trim(),status:'pending'});if(!save())return;closeModal();toast('Đã gửi báo cáo cho quản trị viên.');};}
function adminPage(tab){if(!isAdmin()){$('#main').innerHTML=empty('Khu vực quản trị','Chọn vai trò Quản trị viên trong bộ chọn demo để trải nghiệm.');return;}
 const active=data.posts.filter(p=>!p.hidden&&!user(p.author).locked);let content='';
 if(tab==='users'){content=`<div class="table-wrap"><table><thead><tr><th>Thành viên</th><th>Tài khoản</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${data.users.filter(u=>u.id!=='admin').map(u=>`<tr><td>${esc(u.name)}</td><td>@${esc(u.username)}</td><td><span class="badge">${u.locked?'Đã khoá':'Đang hoạt động'}</span></td><td><button class="secondary" data-action="lock" data-id="${u.id}">${u.locked?'Mở khoá':'Khoá tài khoản'}</button><a class="secondary" href="#profile/${u.id}">Hồ sơ</a></td></tr>`).join('')}</tbody></table></div>`;}
 else if(tab==='stats'){const locations=new Map();for(const p of active){const key=normalize(p.location).trim();const old=locations.get(key)||{name:p.location,count:0};old.count++;locations.set(key,old);}const sorted=[...locations.values()].sort((a,b)=>b.count-a.count).slice(0,10);content=`<div class="stats"><div class="stat">Bài viết đang hiển thị<strong>${active.length}</strong></div><div class="stat">Địa điểm được chia sẻ<strong>${locations.size}</strong></div><div class="stat">Thành viên hoạt động<strong>${data.users.filter(u=>u.id!=='admin'&&!u.locked).length}</strong></div></div><div class="table-wrap"><table><thead><tr><th>Địa điểm</th><th>Số bài viết</th><th>Tần suất</th></tr></thead><tbody>${sorted.map(l=>`<tr><td>${esc(l.name)}</td><td>${l.count}</td><td style="width:50%"><div class="bar" style="width:${l.count/Math.max(1,...sorted.map(s=>s.count))*100}%"></div></td></tr>`).join('')}</tbody></table></div>`;}
 else {content=`<div class="table-wrap"><table><thead><tr><th>Bài viết được báo cáo</th><th>Lý do</th><th>Trạng thái</th><th>Xử lý</th></tr></thead><tbody>${data.reports.map(r=>{const p=data.posts.find(p=>p.id===r.post);return p?`<tr><td><button data-action="detail" data-id="${p.id}" style="text-align:left">${esc(p.title)}</button><div class="subtle">Người báo cáo · ${esc(user(r.by)?.name)}</div></td><td>${esc(r.reason)}${r.note?'<br><span class="subtle">'+esc(r.note)+'</span>':''}</td><td><span class="badge">${({pending:'Chờ xử lý',resolved:'Đã ẩn bài',rejected:'Đã bỏ qua',restored:'Đã bỏ ẩn'})[r.status]}</span></td><td>${r.status==='pending'?`<button class="secondary" data-action="moderate" data-report="${r.id}" data-id="${p.id}" data-status="resolved">Ẩn bài</button><button class="secondary" data-action="moderate" data-report="${r.id}" data-id="${p.id}" data-status="rejected">Bỏ qua</button>`:p.hidden?`<button class="secondary" data-action="restore" data-id="${p.id}">Bỏ ẩn</button>`:'Đã xử lý'}</td></tr>`:'';}).join('')||'<tr><td colspan="4">Chưa có báo cáo.</td></tr>'}</tbody></table></div>`;}
 $('#main').innerHTML=`<div class="eyebrow">WANDERLY · QUẢN TRỊ</div><h1>Chăm sóc cộng đồng.</h1><p class="intro">Quản lý nội dung và giữ những hành trình luôn đáng nhớ.</p><div class="admin-tabs">${[['reports','Báo cáo bài viết'],['users','Tài khoản'],['stats','Thống kê địa điểm']].map(([key,label])=>`<a class="${tab===key?'primary':'secondary'}" href="#admin/${key}">${label}</a>`).join('')}</div>${content}`;
}

// Wanderly Vietnam map: demo pins + visible posts from the existing local dataset.
const vnDestinations=[
 {name:'Hà Nội',lat:21.0285,lng:105.8542,desc:'Thủ đô ngàn năm văn hiến'},
 {name:'Hà Giang',lat:22.8233,lng:104.9836,desc:'Những cung đường vùng cao'},
 {name:'Sa Pa',lat:22.3364,lng:103.8438,desc:'Núi rừng và ruộng bậc thang'},
 {name:'Ninh Bình',lat:20.2539,lng:105.9750,desc:'Tràng An và non nước'},
 {name:'Huế',lat:16.4637,lng:107.5909,desc:'Di sản cố đô'},
 {name:'Đà Nẵng',lat:16.0544,lng:108.2022,desc:'Biển và những cây cầu'},
 {name:'Hội An',lat:15.8801,lng:108.3380,desc:'Phố cổ bên sông Hoài'},
 {name:'Đà Lạt',lat:11.9404,lng:108.4583,desc:'Thành phố ngàn hoa'},
 {name:'TP. Hồ Chí Minh',lat:10.8231,lng:106.6297,desc:'Nhịp sống phương Nam'},
 {name:'Phú Quốc',lat:10.2899,lng:103.9840,desc:'Đảo ngọc và biển xanh'},
 {name:'Quần đảo Hoàng Sa',lat:16.5,lng:112.0,desc:'Việt Nam tuyên bố chủ quyền · hiện do Trung Quốc kiểm soát',island:true},
 {name:'Quần đảo Trường Sa',lat:9.5,lng:114.5,desc:'Việt Nam tuyên bố chủ quyền · khu vực có nhiều bên kiểm soát',island:true}
];
let vnMap=null,vnMarkers={};
function mapPage(){
 const main=$('#main');
 const places=vnDestinations.map(d=>{
  const posts=data.posts.filter(p=>canView(p)&&!p.hidden&&normalize(p.location).includes(normalize(d.name)));
  return `<button class="map-place" data-action="map-focus" data-id="${esc(d.name)}"><span class="map-place-icon">${icon('pin')}</span><span><strong>${esc(d.name)}</strong><small>${esc(d.desc)} · ${posts.length} bài viết</small></span>${icon('arrow')}</button>`;
 }).join('');
 main.innerHTML=`<section class="map-heading"><div class="eyebrow">WANDERLY · KHÁM PHÁ VIỆT NAM</div><h1>Bản đồ hành trình</h1><p class="intro">Khám phá Việt Nam từ đất liền đến Hoàng Sa và Trường Sa. Chọn ghim để xem thông tin và các câu chuyện du lịch.</p></section><div class="map-layout"><aside class="map-list"><label for="map-filter">Tìm điểm đến</label><input id="map-filter" type="search" placeholder="Ví dụ: Hội An, Hà Giang..."><div id="map-place-list">${places}</div><p class="map-hint">Ghim xanh: địa điểm du lịch · Ghim vàng: quần đảo. Hoàng Sa và Trường Sa có tranh chấp chủ quyền; vị trí ghim chỉ mang tính minh họa.</p></aside><section class="map-panel"><div id="vn-map" aria-label="Bản đồ Việt Nam tương tác"></div><div class="map-foot">Bản đồ © OpenStreetMap contributors · Giới hạn vùng xem quanh Việt Nam · Ranh giới và tên hiển thị trên nền bản đồ do OpenStreetMap cung cấp</div></section></div>`;
 const input=$('#map-filter');input.addEventListener('input',()=>{const q=normalize(input.value);document.querySelectorAll('.map-place').forEach(b=>b.hidden=!normalize(b.dataset.id).includes(q));});
 if(!window.L){$('#vn-map').innerHTML='<p class="map-error">Chưa tải được thư viện bản đồ. Hãy kiểm tra kết nối Internet.</p>';return;}
 const vietnamBounds=L.latLngBounds([[6.0,101.0],[24.0,119.0]]);
 vnMap=L.map('vn-map',{scrollWheelZoom:true,minZoom:4,maxZoom:13,maxBounds:vietnamBounds,maxBoundsViscosity:1.0});
 vnMap.fitBounds(vietnamBounds,{padding:[12,12]});
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(vnMap);
 vnMarkers={};
 vnDestinations.forEach(d=>{
  const posts=data.posts.filter(p=>canView(p)&&!p.hidden&&normalize(p.location).includes(normalize(d.name)));
  const cards=posts.length?posts.map(p=>`<a class="map-post-link" href="#post/${encodeURIComponent(p.id)}">${esc(p.title)} →</a>`).join(''):'<span class="map-no-post">Chưa có bài viết tại đây</span>';
  const marker=L.circleMarker([d.lat,d.lng],{radius:d.island?12:9,color:'#fff',weight:3,fillColor:d.island?'#e6ac27':'#207968',fillOpacity:1}).addTo(vnMap).bindPopup(`<div class="map-popup"><strong>${esc(d.name)}</strong><p>${esc(d.desc)}</p><small>${posts.length} bài viết</small>${cards}</div>`,{maxWidth:260});
  if(d.island){marker.bindTooltip(d.name,{permanent:true,direction:'top',offset:[0,-12],className:'wanderly-island-label',opacity:1});marker.setStyle({className:'wanderly-island-pin'});}
  vnMarkers[d.name]=marker;
 });
 setTimeout(()=>{if(vnMap&&document.getElementById('vn-map')){vnMap.invalidateSize();vnMap.fitBounds(vietnamBounds,{padding:[12,12]});}},180);
}
function focusMap(name){const d=vnDestinations.find(p=>p.name===name);if(!d||!vnMap)return;vnMap.flyTo([d.lat,d.lng],d.island?7:10,{duration:0.8});setTimeout(()=>vnMarkers[name]?.openPopup(),850);}
// Dispose previous Leaflet instance before re-rendering its container.
const mapAwareRenderBody=renderBody;
renderBody=function(){if(vnMap){vnMap.remove();vnMap=null;vnMarkers={};}return mapAwareRenderBody();};

document.addEventListener('click',e=>{const button=e.target.closest('[data-action]');if(!button)return;const {action,id,status,comment,src}=button.dataset;
 if(action==='map-focus'){focusMap(id);return;}
 if(action==='close'){closeModal();return;}if(action==='roles'){roles();return;}
 if(action==='role'){if(user(id)?.locked)return;viewer=id;sessionStorage.setItem('td-social-viewer',viewer);closeModal();go(id==='admin'?'admin':id==='guest'?'explore':'feed');toast('Đang xem với vai trò '+(user(id)?.name||'Khách')+'.');return;}
 if(action==='theme'){if(e.detail===0||!button.dataset.skipClick)setTheme(!document.body.classList.contains('dark'));return;}
 if(action==='bookmark'){if(!requireMember())return;const items=data.bookmarks[viewer]||[];data.bookmarks[viewer]=items.includes(id)?items.filter(x=>x!==id):[...items,id];if(!save())return;renderBody();toast(bookmarked(id)?'Đã lưu vào bộ sưu tập.':'Đã bỏ lưu bài viết.');return;}
 if(action==='comment-like'){if(!requireMember())return;const post=data.posts.find(p=>p.id===id);const c=post?.comments.find(c=>c.id===comment);if(!c)return;c.likedBy=Array.isArray(c.likedBy)?c.likedBy:[];if(c.likedBy.includes(viewer))c.likedBy=c.likedBy.filter(x=>x!==viewer);else{c.likedBy.push(viewer);notify(c.author,user(viewer).name+' đã thích bình luận của bạn.',id);}if(!save())return;detail(id);return;}
 if(action==='create'){postForm();return;}if(action==='edit'){postForm(id);return;}if(action==='detail'){replyTo=null;detail(id);return;}if(action==='gallery'){$('#detail-image').src=src;return;}
 if(action==='place'){query='';placeFilter=id;limit=3;location.hash='explore';render();return;}if(action==='filter'){if(route().page!=='explore'){location.hash='explore';}placeFilter=id;limit=3;renderBody();return;}if(action==='more'){limit+=3;renderList();return;}
 if(action==='remove-image'){editingImages.splice(Number(id),1);previewImages();return;}if(action==='profile-edit'){editProfile();return;}
 if(action==='follow'){if(!requireMember()||id===viewer)return;const index=data.follows.findIndex(f=>f[0]===viewer&&f[1]===id);if(index<0){data.follows.push([viewer,id]);notify(id,user(viewer).name+' đã bắt đầu theo dõi bạn.');}else data.follows.splice(index,1);if(!save())return;render();return;}
 if(action==='read-all'){data.notifications.filter(n=>n.recipient===viewer).forEach(n=>n.read=true);if(!save())return;render();return;}
 if(action==='read'){const n=data.notifications.find(n=>n.id===id&&n.recipient===viewer);if(!n)return;n.read=true;if(!save())return;render();if(n.post)detail(n.post);return;}
 if(action==='lock'){if(!isAdmin()||id==='admin')return;user(id).locked=!user(id).locked;if(!save())return;render();toast(user(id).locked?'Đã khoá tài khoản và ẩn nội dung của tác giả.':'Đã mở khoá tài khoản.');return;}
 const p=data.posts.find(p=>p.id===id);if(!p)return;
 if(action==='moderate'||action==='restore'){if(!isAdmin())return;if(action==='restore'){p.hidden=false;data.reports.filter(r=>r.post===id&&r.status==='resolved').forEach(r=>r.status='restored');}else{const report=data.reports.find(r=>r.id===button.dataset.report&&r.post===id&&r.status==='pending');if(!report)return;report.status=status;if(status==='resolved')p.hidden=true;}if(!save())return;render();toast('Đã cập nhật kết quả xử lý.');return;}
 if(!canView(p)){toast('Bạn chưa có quyền xem bài viết.');return;}
 if(action==='report'){reportForm(id);return;}if(action==='like'){if(!requireMember())return;const index=p.likedBy.indexOf(viewer);if(index>=0)p.likedBy.splice(index,1);else{p.likedBy.push(viewer);notify(p.author,user(viewer).name+' đã thích bài viết của bạn.',p.id);}if(!save())return;renderBody();shell();return;}
 if(action==='reply'){if(!requireMember())return;replyTo=comment;detail(id);$('#comment-form input')?.focus();return;}if(action==='cancel-reply'){replyTo=null;detail(id);return;}
 if(action==='comment-delete'){const c=p.comments.find(c=>c.id===comment);if(!member()||!c||(c.author!==viewer&&p.author!==viewer))return;p.comments=p.comments.filter(c=>c.id!==comment&&c.parent!==comment);if(!save())return;refreshCard(p);detail(id);return;}
 if(action==='delete'){if(!member()||p.author!==viewer)return;openModal('Xoá trang nhật ký?',`<p>Bạn muốn xoá bài “${esc(p.title)}” cùng các bình luận liên quan?</p><div class="form-actions"><button class="secondary" data-action="close">Giữ lại</button><button class="primary" data-action="delete-confirm" data-id="${id}">Xoá bài</button></div>`);return;}
 if(action==='delete-confirm'){if(!member()||p.author!==viewer)return;data.posts=data.posts.filter(p=>p.id!==id);Object.keys(data.bookmarks).forEach(k=>data.bookmarks[k]=data.bookmarks[k].filter(x=>x!==id));data.reports=data.reports.filter(r=>r.post!==id);data.notifications=data.notifications.filter(n=>n.post!==id);if(!save())return;closeModal();render();toast('Đã xoá bài viết.');}
});
window.addEventListener('hashchange',()=>{closeModal();limit=3;if(route().page!=='explore'){query='';placeFilter='';}render();window.scrollTo(0,0);});
window.addEventListener('storage',e=>{if(e.key==='travel-diary-social-v1'){try{data=JSON.parse(e.newValue)||fresh();data.bookmarks??={};lastSaved=JSON.stringify(data);if(!$('#modal').open){render();}else if(!$('#post-form')&&!$('#profile-form')&&!$('#comment-form')){closeModal();render();}}catch{}}});
$('#modal').addEventListener('cancel',()=>{flushDraft?.();flushDraft=null;});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
if(localStorage.getItem('td-social-theme')==='dark')document.body.classList.add('dark');
function refreshNotifications(){if(route().page==='notifications'&&!$('#modal').open)notifications();const link=document.querySelector('a[href="#notifications"]');if(!link)return;const unread=data.notifications.filter(n=>n.recipient===viewer&&!n.read).length;link.querySelector('.count')?.remove();if(unread){const badge=document.createElement('b');badge.className='count';badge.textContent=unread;link.append(badge);}}
let polling=setInterval(refreshNotifications,30000);
window.addEventListener('pagehide',()=>{clearInterval(polling);observer?.disconnect();});
window.addEventListener('pageshow',event=>{if(event.persisted){polling=setInterval(refreshNotifications,30000);render();}});

const legacyRenderBody=renderBody;
shell=function(){
 const current=user(viewer);
 $('#sidebar').innerHTML=`<a class="logo" href="#explore"><strong>Wanderly<span>.</span></strong></a><div class="brand-note">NHẬT KÝ DU LỊCH</div><nav class="nav">${nav('explore','Khám phá','compass')}${nav('notifications','Thông báo','bell')}<button aria-label="Tạo bài viết" data-action="create">${icon('plus')}<span>Tạo bài viết</span></button>${nav('profile','Trang cá nhân','user')}${nav('saved','Đã lưu','bookmark')}${nav('map','Bản đồ Việt Nam','map')}${isAdmin()?nav('admin','Quản trị','shield'):''}</nav><div class="sidebar-bottom">${themeSwitch()}<button class="account" data-action="roles">${avatar(current)}<span><strong>${esc(current?.name||'Khách')}</strong><small>Đổi tài khoản</small></span>${icon('more')}</button></div>`;
 $('#topbar').innerHTML=`<a class="mobile-logo" href="#explore">Wanderly.</a><span class="top-caption">Một chuyến đi, một câu chuyện.</span><div class="top-actions"><form class="wander-search" id="social-search" role="search"><input type="search" name="q" aria-label="Tìm tài khoản, địa điểm hoặc hashtag" placeholder="Tìm kiếm..." value="${esc(query)}"><button type="submit" aria-label="Tìm kiếm">${icon('search')}</button></form><button class="iconbtn" data-action="roles" aria-label="Tài khoản demo">${avatar(current)}</button><button class="primary" data-action="create">${icon('plus')} Đăng bài</button></div>`;
};
side=function(){return `<aside class="right-column"><div class="side-account">${avatar(user(viewer))}<div><strong>${esc(user(viewer)?.name||'Khách ghé thăm')}</strong><small>Hôm nay bạn muốn đi đâu?</small></div><button data-action="roles">Đổi</button></div><section class="side-panel"><div class="aside-title"><h3>Điểm đến được yêu thích</h3>${icon('compass')}</div>${[['Hà Giang',photo.hagiang,'Những mùa mây ngang núi'],['Hội An',photo.hoian,'Một chút bình yên phố cổ'],['Ninh Bình',photo.ninhbinh,'Lạc giữa miền xanh']].map(([name,img,caption])=>`<button class="place" data-action="place" data-id="${name}"><img src="${img}" alt="${name}"><span><strong>${name}</strong><small>${caption}</small></span>${icon('arrow')}</button>`).join('')}</section><section class="journal-note"><span>GÓC NHẬT KÝ</span><h3>Đi để thấy.<br>Viết để nhớ.</h3><p>Những điều nhỏ bé hôm nay,<br>là kỷ niệm đẹp của ngày mai.</p><button data-action="create">Kể câu chuyện của bạn ${icon('arrow')}</button></section><p class="side-foot">Wanderly · Đồ án mạng xã hội du lịch<br>Ảnh: MIA.vn · Vietnam Honeymoons · Sở Du lịch Ninh Bình<br><br>© 2026 WANDERLY</p></aside>`;};
renderBody=function(){
 const {page}=route();
 if(vnMap){vnMap.remove();vnMap=null;vnMarkers={};}
 if(!['explore','feed'].includes(page)||page==='feed'&&!member()){legacyRenderBody();return;}
 observer?.disconnect();
 $('#main').innerHTML=`<div class="layout"><section class="timeline"><div class="feed-tabs"><a href="#explore" class="${page==='explore'?'selected':''}">Dành cho bạn</a><a href="#feed" class="${page==='feed'?'selected':''}">Đang theo dõi</a><span>${icon('compass')}</span></div><div class="destination-strip"><button class="destination add-diary" data-action="create"><span>${icon('plus')}</span><small>Nhật ký mới</small></button><div class="journey-heading"><span class="journey-heading-kicker">WANDERLY · NHẬT KÝ DU LỊCH</span><h2>Mỗi chuyến đi, một câu chuyện</h2><p>Lưu giữ những khoảnh khắc đẹp và chia sẻ hành trình của riêng bạn.</p></div></div><div class="feed-head"><h2>${page==='explore'&&query?'Kết quả: '+esc(query):page==='explore'&&placeFilter?'Nhật ký ở '+esc(placeFilter):'Những chuyến đi đáng nhớ'}</h2><span id="result-count" class="subtle"></span></div><div class="chips">${['','Hà Giang','Hội An','Ninh Bình'].map(p=>`<button class="chip ${placeFilter===p?'active':''}" data-action="filter" data-id="${p}">${p||'Tất cả'}</button>`).join('')}</div><div id="posts"></div><div id="loadmore" class="loadmore"></div></section>${side()}</div>`;
 renderList();
};
document.addEventListener('submit',event=>{
 if(event.target.id!=='social-search')return;
 event.preventDefault();
 query=event.target.elements.q.value.trim();
 placeFilter='';
 limit=3;
 if(route().page!=='explore')location.hash='explore';
 else renderBody();
});
document.addEventListener('input',event=>{
 if(event.target.form?.id==='social-search'&&!event.target.value&&query){
   query='';placeFilter='';limit=3;
   if(route().page==='explore')renderBody();
 }
});
render();
