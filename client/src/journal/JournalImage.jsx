import {useEffect,useRef,useState} from 'react';
import {api} from '../services/api.js';

export default function JournalImage({src,loading,alt,...props}) {
  const node=useRef(null);
  const [loaded,setLoaded]=useState(null);
  const protectedPath=src?.startsWith('/posts/') || src?.startsWith('/me/drafts/');
  useEffect(()=>{
    if(!protectedPath || !src) return;
    const controller=new AbortController();
    let objectUrl;
    async function load(){
      try {
        const response=await api.get(src,{responseType:'blob',signal:controller.signal});
        if(controller.signal.aborted)return;
        objectUrl=URL.createObjectURL(response.data);
        setLoaded({src,url:objectUrl});
      } catch { /* Keep the image alternative text available. */ }
    }
    let observer;
    if(loading==='lazy' && typeof IntersectionObserver!=='undefined'){
      observer=new IntersectionObserver(entries=>{
        if(entries.some(e=>e.isIntersecting)){observer.disconnect();load();}
      },{rootMargin:'300px'});
      observer.observe(node.current);
    } else load();
    return ()=>{observer?.disconnect();controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[src,protectedPath,loading]);
  return <img ref={node} {...props} alt={alt} loading={loading} src={protectedPath?(loaded?.src===src?loaded.url:undefined):src}/>;
}
