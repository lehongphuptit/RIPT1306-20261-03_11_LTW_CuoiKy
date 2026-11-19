import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../services/api.js';

const fields = [
  { name: 'displayName', label: 'Tên hiển thị', autoComplete: 'name', maxLength: 80 },
  { name: 'username', label: 'ID người dùng', autoComplete: 'username', maxLength: 30 },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', maxLength: 254 },
  { name: 'password', label: 'Mật khẩu', type: 'password', autoComplete: 'new-password', maxLength: 72 },
  { name: 'confirmPassword', label: 'Xác nhận mật khẩu', type: 'password', autoComplete: 'new-password', maxLength: 72 },
];

function fieldError(input, form) {
  const value = input.value;
  const label = fields.find(field => field.name === input.name).label.toLowerCase();
  if (!value.trim()) return 'Vui lòng nhập ' + label + '.';
  if (input.name === 'username') {
    if (/\s/.test(value)) return 'Hãy bỏ khoảng trắng trong ID.';
    if (value.includes('@')) return 'Hãy bỏ ký tự @ trong ID.';
    if (/[^a-z0-9_]/i.test(value)) return 'ID chỉ dùng chữ không dấu, số và dấu gạch dưới (_).';
    if (value.length < 3) return 'ID cần ít nhất 3 ký tự.';
  }
  if (input.name === 'email' && input.validity.typeMismatch) return 'Email chưa đúng định dạng.';
  if (input.name === 'password') {
    if (value.length < 8) return 'Mật khẩu cần ít nhất 8 ký tự.';
    if (!/[a-z]/i.test(value)) return 'Mật khẩu cần có chữ cái.';
    if (!/\d/.test(value)) return 'Mật khẩu cần có chữ số.';
    if (new TextEncoder().encode(value).length > 72) return 'Mật khẩu quá dài, hãy rút ngắn lại.';
  }
  if (input.name === 'confirmPassword' && value !== form.elements.password.value) return 'Mật khẩu xác nhận chưa khớp.';
  return '';
}
export default function RegisterPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState({});

  const [errors, setErrors] = useState({});
  function check(event) {
    const input = event.target;
    if (!input.name) return;
    if (input.name === 'username') {
      const cleaned = input.value.replace(/^@+/, '').trimEnd();
      if (cleaned !== input.value) input.value = cleaned;
    }
    const form = input.form;
    const result = fieldError(input, form);
    const confirmation = fieldError(form.elements.confirmPassword, form);
    const blur = event.type === 'blur';
    setErrors(previous => {
      const next = { ...previous };
      if (blur || input.name in previous) next[input.name] = result;
      if (input.name === 'password' && 'confirmPassword' in previous) next.confirmPassword = confirmation;
      return next;
    });
    setMessage('');
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const displayName = form.get('displayName').trim();
    const username = form.get('username').trim().toLowerCase();
    const email = form.get('email').trim();
    const password = form.get('password');

    const element = event.currentTarget;
    const next = Object.fromEntries(fields.map(({ name }) => [name, fieldError(element.elements[name], element)]));
    setErrors(next);
    const first = fields.find(({ name }) => next[name]);
    if (first) {
      element.elements[first.name].focus();
      return;
    }
    setMessage('');
    setBusy(true);
    try {
      await api.post('/auth/register', { displayName, username, email, password });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (error) {
      setMessage(error.response?.status === 409
        ? 'Email hoặc tên người dùng đã được sử dụng.'
        : errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="scene flex min-h-screen items-center justify-center p-4">
      <section className="glass-card w-full max-w-[440px] rounded-[27px] p-7 sm:p-10">
        <Link to="/login" className="font-bold text-[#123b3b]">Wanderly</Link>
        <h1 className="mt-4 text-3xl font-bold text-[#172a2b]">Tạo tài khoản</h1>
        <form noValidate onBlur={check} onChange={check} onSubmit={submit} className="mt-6 space-y-3">
          {fields.map(({ name, label, type = 'text', ...options }) => (
            <div key={name}>
              <label htmlFor={name} className="mb-1 block text-sm font-semibold">{label}</label>
              <div className="relative">
                {name === 'username' && (
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#416466]">@</span>
                )}
                <input id={name} name={name} type={visible[name] ? 'text' : type}
                  className="auth-input [&::-ms-reveal]:hidden"
                  style={name === 'username' ? { paddingLeft: '2.3rem' } : type === 'password' ? { paddingRight: '4rem' } : undefined}
                  aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? name + "-error" : undefined} required {...options} />
                {type === 'password' && (
                  <button type="button" aria-controls={name}
                    aria-label={`${visible[name] ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
                    className="absolute inset-y-0 right-3 px-2 text-sm font-semibold text-[#173f40]"
                    onClick={() => setVisible(previous => ({ ...previous, [name]: !previous[name] }))}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                      strokeLinejoin="round" aria-hidden="true">
                      {visible[name] ? (
                        <path d="m3 3 18 18 M10.6 5.1A11 11 0 0 1 12 5c6 0 10 7 10 7a18 18 0 0 1-3 3.8 M6.1 6.8A20 20 0 0 0 2 12s4 7 10 7a12 12 0 0 0 5-1.2 M10 10a2.8 2.8 0 0 0 4 4" />
                      ) : (
                        <>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                )}
              </div>
              {errors[name] && <p id={name + '-error'} className="mt-1 text-sm text-red-800" role="status">{errors[name]}</p>}
            </div>
          ))}
          {message && <p role="alert" className="text-sm text-red-900">{message}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-full bg-[#173f40] py-3 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? 'Đang đăng ký…' : 'Đăng ký'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Đã có tài khoản? <Link to="/login" className="font-bold underline">Đăng nhập</Link>
        </p>
      </section>
    </main>
  );
}
