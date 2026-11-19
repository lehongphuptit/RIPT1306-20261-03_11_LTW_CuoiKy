import { useState } from 'react';
import { Eye, EyeOff, MountainSnow } from 'lucide-react';
export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState('');
  function submit(event) {
    event.preventDefault();
    if (!email.trim() || !password) return setMessage('Vui lòng nhập email và mật khẩu.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMessage('Email không hợp lệ.');
    if (password.length < 6) return setMessage('Mật khẩu cần tối thiểu 6 ký tự.');
    setMessage('Giao diện đã hoàn thành. Chưa kết nối API đăng nhập.');
  }
  return <section className="glass-card w-full max-w-[440px] rounded-[27px] px-7 py-10 sm:px-12 sm:py-12 lg:min-h-[605px]">
    <div className="mb-12 flex items-center gap-2 text-[#123b3b]"><MountainSnow size={31} strokeWidth={2.4}/><span className="text-2xl font-extrabold tracking-tight">Wanderly</span></div>
    <h1 className="text-[30px] sm:text-[34px] font-bold tracking-tight text-[#172a2b]">Welcome 👋</h1>
    <p className="mt-2 text-sm leading-relaxed text-[#476363]">Khám phá thế giới, lưu giữ hành trình của bạn.</p>
    <form onSubmit={submit} noValidate className="mt-9 space-y-5">
      <div><label htmlFor="email" className="mb-2 block text-xs font-semibold text-[#183536]">Email</label><input id="email" className="auth-input" type="email" autoComplete="email" placeholder="mail@abc.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
      <div><label htmlFor="password" className="mb-2 block text-xs font-semibold text-[#183536]">Mật khẩu</label><div className="relative"><input id="password" className="auth-input pr-12" type={visible?'text':'password'} autoComplete="current-password" placeholder="Nhập mật khẩu" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={visible?'Ẩn mật khẩu':'Hiện mật khẩu'} onClick={()=>setVisible(v=>!v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4b6e6b] hover:text-[#173f40]">{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
      <div className="flex items-center justify-between gap-3 text-[11px] text-[#254949]"><label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="accent-[#164747]" checked={remember} onChange={e=>setRemember(e.target.checked)}/>Ghi nhớ đăng nhập</label><span className="text-[#456a68]" title="Chức năng sẽ được thêm sau">Quên mật khẩu?</span></div>
      {message&&<p role="status" className="rounded-lg bg-white/70 px-3 py-2 text-xs text-[#7d3939]">{message}</p>}
      <button type="submit" className="w-full rounded-full bg-[#173f40] py-3.5 text-sm font-semibold text-white transition hover:bg-[#286b68] active:scale-[.99]">Đăng nhập</button>
    </form>
    <div className="my-8 flex items-center gap-3 text-[11px] text-[#476968]"><span className="h-px flex-1 bg-[#729a97]/60"/>Wanderly · Travel diary<span className="h-px flex-1 bg-[#729a97]/60"/></div>
    <p className="text-center text-xs text-[#254949]">Chưa có tài khoản? <span className="font-bold text-[#075d5a]">Đăng ký (sắp có)</span></p>
  </section>;
}
