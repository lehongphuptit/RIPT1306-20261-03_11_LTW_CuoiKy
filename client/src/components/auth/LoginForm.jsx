import { useState } from 'react';
import { Eye, EyeOff, MountainSnow } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../services/api.js';

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setMessage('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setMessage('');
    setSubmitting(true);

    try {
      await login(cleanEmail, password, remember);
      navigate('/account', { replace: true });
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="glass-card w-full max-w-[440px] rounded-[27px] px-7 py-10 sm:px-12 sm:py-12">
      <div className="mb-10 flex items-center gap-2 text-[#123b3b]">
        <MountainSnow size={31} aria-hidden="true" />
        <span className="text-2xl font-extrabold">Wanderly</span>
      </div>

      <h1 className="text-3xl font-bold text-[#172a2b]">Đăng nhập</h1>
      <p className="mt-2 text-sm text-[#476363]">
        Khám phá thế giới, lưu giữ hành trình của bạn.
      </p>

      {state?.registered && <p role="status" className="mt-3 text-sm font-semibold text-[#123b3b]">Tạo tài khoản thành công. Bạn có thể đăng nhập.</p>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-semibold">
            Email
          </label>
          <input
            id="login-email"
            className="auth-input"
            type="email"
            autoComplete="email"
            placeholder="ban@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="login-password" className="mb-2 block text-sm font-semibold">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="login-password"
              className="auth-input"
              style={{ paddingRight: '3rem' }}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#254949]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[#254949]">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="accent-[#164747]"
          />
          Ghi nhớ đăng nhập
        </label>

        {message && (
          <p role="alert" className="rounded-lg bg-white/70 px-3 py-2 text-sm text-red-800">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#173f40] py-3.5 text-sm font-semibold text-white hover:bg-[#286b68] disabled:opacity-60"
        >
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#254949]">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-bold underline">Đăng ký</Link>
      </p>
    </section>
  );
}

