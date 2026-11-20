import {useEffect,useState} from 'react';
import {api,errorMessage} from '../services/api.js';

export function useResult(url, revision=0) {
 const [result,setResult]=useState({});
 useEffect(()=>{
   if(!url)return;
   const abort=new AbortController();
   setResult({});
   api.get(url,{signal:abort.signal}).then(r=>{
     if(!abort.signal.aborted)setResult({data:r.data});
   }).catch(e=>{if(!abort.signal.aborted)setResult({error:errorMessage(e)});});
   return ()=>abort.abort();
 },[url,revision]);
 return result;
}

export function Action({run,children,...props}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function click(){
   setBusy(true);setError('');
   try{await run();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}
 }
 return <><button type="button" {...props} disabled={busy||props.disabled} onClick={click}>{children}</button>{error&&<small role="alert">{error}</small>}</>;
}

function Batch({url,render,first,empty}){
 const result=useResult(url);
 const [more,setMore]=useState(false);
 if(result.error)return <p role="alert">{result.error}</p>;
 if(!result.data)return <p role="status">Đang tải…</p>;
 const {data,nextCursor}=result.data;
 const next=new URL(url,'http://local');
 if(nextCursor)next.searchParams.set('cursor',nextCursor);
 return <>{first&&!data.length&&<p>{empty}</p>}{data.map(render)}
 {nextCursor&&(more?<Batch key={nextCursor} url={next.pathname+next.search} render={render}/>:<button onClick={()=>setMore(true)}>Xem thêm</button>)}</>;
}
export function List({url,revision=0,render,empty='Chưa có dữ liệu.'}){
 return <Batch key={url+'|'+revision} url={url} render={render} first empty={empty}/>;
}
export function profileUrl(id){return '/?view=profile&id='+encodeURIComponent(id);}
