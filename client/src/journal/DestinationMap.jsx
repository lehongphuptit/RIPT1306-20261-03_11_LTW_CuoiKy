import {useState} from 'react';
import {Link} from 'react-router-dom';
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
export default function DestinationMap(){
 const [name,setName]=useState('Hà Giang');
 const d=vnDestinations.find(p=>p.name===name);
 const box=[d.lng-0.6,d.lat-0.4,d.lng+0.6,d.lat+0.4].join(',');
 return <section><h1>Bản đồ Việt Nam</h1><label>Chọn điểm đến <select value={name} onChange={e=>setName(e.target.value)}>{vnDestinations.map(p=><option key={p.name}>{p.name}</option>)}</select></label>
 <iframe title={'Bản đồ '+name} loading="lazy" src={'https://www.openstreetmap.org/export/embed.html?bbox='+box+'&layer=mapnik&marker='+d.lat+','+d.lng}/>
 <p>{d.desc}</p><Link to={'/?q='+encodeURIComponent(name)}>Xem nhật ký ở {name}</Link></section>;
}