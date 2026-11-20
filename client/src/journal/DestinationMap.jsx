import {useState,useEffect,useRef} from 'react';
import {Link} from 'react-router-dom';
import {MapPin,ArrowRight} from 'lucide-react';
import {List} from './common.jsx';
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
let library;
function leaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!library) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    library = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve(window.L);
      script.onerror = () => { library = undefined; css.remove(); script.remove(); reject(Error('Leaflet')); };
      document.head.appendChild(script);
    });
  }
  return library;
}
export default function DestinationMap() {
  const container = useRef(null);
  const map = useRef(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    leaflet().then(L => {
      if (!active) return;
      const bounds = [[6,101],[24,119]];
      const instance = L.map(container.current,{minZoom:4,maxZoom:13,maxBounds:bounds}).fitBounds(bounds);
      map.current = instance;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(instance);
      for (const place of vnDestinations) {
        const marker = L.circleMarker([place.lat, place.lng],{radius:place.island?12:9,color:'#fff',weight:3,fillColor:place.island?'#e6ac27':'#207968',fillOpacity:1}).addTo(instance);
        marker.bindTooltip(place.name,{permanent:!!place.island,direction:'top'}).on('click',()=>setSelected(place));
      }
    }).catch(()=>{if(active)setUnavailable(true);});
    return () => { active=false; map.current?.remove(); map.current=null; };
  },[]);
  useEffect(()=>{
    if (selected) map.current?.flyTo([selected.lat,selected.lng],selected.island?7:10);
  },[selected]);
  const normalized = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll('đ','d');
  return <><section className="map-heading"><div className="eyebrow">WANDERLY · KHÁM PHÁ VIỆT NAM</div><h1>Bản đồ hành trình</h1>
    <p>Khám phá Việt Nam từ đất liền đến Hoàng Sa và Trường Sa. Chọn ghim để xem thông tin và các câu chuyện du lịch.</p></section>
    <div className="map-layout"><aside className="map-list"><label htmlFor="map-filter">Tìm điểm đến</label>
    <input id="map-filter" type="search" placeholder="Ví dụ: Hội An, Hà Giang..." value={filter} onChange={e=>setFilter(e.target.value)}/>
    {vnDestinations.filter(d=>normalized(d.name).includes(normalized(filter.trim()))).map(d=><button className="map-place" key={d.name} onClick={()=>setSelected(d)}><span className="map-place-icon"><MapPin/></span><span><strong>{d.name}</strong><small>{d.desc}</small></span><ArrowRight/></button>)}
    <p className="map-hint">Ghim xanh: địa điểm du lịch · Ghim vàng: quần đảo. Vị trí ghim mang tính minh họa.</p></aside>
    <section className="map-panel"><div id="vn-map" ref={container} aria-label="Bản đồ Việt Nam tương tác" hidden={unavailable}/>
    {unavailable&&<p className="map-error">Chưa tải được bản đồ. Bạn vẫn có thể chọn điểm đến trong danh sách để xem nhật ký.</p>}
    {selected&&<div className="map-foot"><strong>{selected.name}</strong><p>{selected.desc}</p><List url={'/posts?q='+encodeURIComponent(selected.name)} empty="Chưa có bài viết tại đây." render={post=><Link className="map-post-link" key={post._id} to={'/?view=post&id='+post._id}>{post.title} →</Link>}/></div>}
    <div className="map-foot">Bản đồ © OpenStreetMap contributors</div></section></div></>;
}
