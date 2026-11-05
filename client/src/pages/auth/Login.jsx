import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { AuthCard } from '../../components/PublicLayout.jsx';
import { PasswordField } from '../../components/PasswordField.jsx';
import { Alert, Button, TextField } from '../../components/ui.jsx';
import { safeNext } from '../../components/RequireAuth.jsx';

export default function Login() {
  const { user, login, devTools } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({ email: params.get('email') || '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(form.email, form.password, { preview });
      navigate(u.role === 'ADMIN' && next === '/app' ? '/admin' : next, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Log in" intro="Welcome back. Logging in also tells us you are well.">
      {location.state?.signedOut && (
        <Alert tone="ok" className="mb-6">You have been logged out safely.</Alert>
      )}
      {location.state?.passwordReset && (
        <Alert tone="ok" className="mb-6">Your password was changed. Please log in with your new password.</Alert>
      )}
      <form onSubmit={submit} className="space-y-6" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <PasswordField
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        {devTools && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-line bg-mist px-4 py-3">
            <input
              type="checkbox"
              className="mt-1 size-5 shrink-0 accent-[#173b65]"
              checked={preview}
              onChange={(e) => setPreview(e.target.checked)}
            />
            <span>
              <span className="font-bold">Read-only demo preview</span>
              <span className="block text-sm text-muted">
                For the demo accounts only. Look around without it counting as a check-in, so the scenario stays as it is.
              </span>
            </span>
          </label>
        )}
        <Button type="submit" size="lg" icon={LogIn} loading={busy} className="w-full">
          {preview ? 'Open read-only preview' : 'Log in'}
        </Button>
      </form>
      <div className="mt-7 space-y-3 text-lg">
        <p><Link to="/forgot-password" className="font-bold">I forgot my password</Link></p>
        <p>
          New here?{' '}
          <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-bold">
            Create a free account
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
