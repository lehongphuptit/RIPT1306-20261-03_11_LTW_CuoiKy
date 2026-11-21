import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Check, CircleAlert, CircleHelp, X} from 'lucide-react';
import {useBackdropDismiss} from './useBackdropDismiss.js';
import './feedback.css';

const events=new EventTarget();
export function confirmAction(message, label='Xác nhận'){
  return new Promise(resolve=>events.dispatchEvent(new CustomEvent('ask',{detail:{message,label,resolve}})));
}
export function notify(message, kind='success'){
  events.dispatchEvent(new CustomEvent('notice',{detail:{message,kind}}));
}

function Question({question,finish,dark}){
  const dialog=useRef(null);
  const backdrop=useBackdropDismiss(()=>finish(false));
  useLayoutEffect(()=>{
    const el=dialog.current;
    el.showModal();
    return ()=>el.close();
  },[]);
  return <dialog ref={dialog} className="wf-question" data-dark={dark} aria-labelledby="wf-title"
    {...backdrop} onCancel={e=>{e.preventDefault();finish(false);}}>
    <div className="wf-symbol" aria-hidden="true"><CircleHelp size={23}/></div>
    <h2 id="wf-title">{question.message}</h2>
    <div className="wf-actions"><button autoFocus onClick={()=>finish(false)}>Hủy</button>
      <button className="wf-confirm" onClick={()=>finish(true)}>{question.label}</button></div>
  </dialog>;
}
function Notice({notice,dismiss,dark}){
  const element=useRef(null);
  useLayoutEffect(()=>{
    const el=element.current;
    el.showPopover?.();
    return ()=>el.hidePopover?.();
  },[]);
  useEffect(()=>{
    const timer=setTimeout(dismiss,notice.kind==='error'?8000:4000);
    return ()=>clearTimeout(timer);
  },[notice]);
  const error=notice.kind==='error';
  return <div ref={element} popover="manual" className="wf-notice" data-dark={dark} data-error={error}>
    {error?<CircleAlert aria-hidden="true"/>:<Check aria-hidden="true"/>}
    <span role={error?'alert':'status'}>{notice.message}</span>
    <button onClick={dismiss} aria-label="Đóng thông báo"><X size={17}/></button>
  </div>;
}
export default function Feedback(){
  const pending=useRef(null);
  const [question,setQuestion]=useState(null),[notice,setNotice]=useState(null);
  useEffect(()=>{
    function ask({detail}){
      if(pending.current){detail.resolve(false);return;}
      pending.current=detail;setQuestion(detail);setNotice(null);
    }
    const show=({detail})=>setNotice(detail);
    events.addEventListener('ask',ask);events.addEventListener('notice',show);
    return ()=>{
      events.removeEventListener('ask',ask);events.removeEventListener('notice',show);
      pending.current?.resolve(false);pending.current=null;
    };
  },[]);
  function finish(answer){
    const current=pending.current;pending.current=null;setQuestion(null);current?.resolve(answer);
  }
  const dark=!!document.querySelector('.wv2.dark');
  return <>{question&&<Question question={question} finish={finish} dark={dark}/>}
    {notice&&<Notice notice={notice} dismiss={()=>setNotice(null)} dark={dark}/>}</>;
}
