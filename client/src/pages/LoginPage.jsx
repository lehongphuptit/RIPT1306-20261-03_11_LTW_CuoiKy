import LoginForm from '../components/auth/LoginForm.jsx';
export default function LoginPage() {
  return <main className="scene min-h-screen flex items-center justify-center p-4 sm:p-7 lg:p-10">
    <div className="landscape-panel relative flex w-full max-w-[1350px] min-h-[690px] items-center overflow-hidden rounded-[28px] shadow-[0_28px_75px_rgba(10,49,49,.25)]">
      <div className="relative z-10 w-full px-5 py-7 sm:px-9 lg:px-12"><LoginForm /></div>
      <div className="absolute bottom-7 right-9 hidden text-white/75 text-xs tracking-[.22em] lg:block">EXPLORE · CAPTURE · REMEMBER</div>
    </div>
  </main>;
}
