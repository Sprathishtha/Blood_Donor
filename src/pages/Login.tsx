// src/pages/Login.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PublicLayout } from '../components/PublicLayout';

export function Login() {
  const { signIn, user, userType, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ✅ UPDATED REDIRECT LOGIC */
  useEffect(() => {
    if (!loading && user && userType) {
      if (userType === 'donor') {
        navigate('/donor/dashboard', { replace: true });
      } else if (userType === 'hospital') {
        navigate('/hospital/dashboard', { replace: true });
      } else if (userType === 'bloodbank') {
        navigate('/bloodbank/dashboard', { replace: true });
      }
    }
  }, [user, userType, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="flex justify-center px-4 py-16">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow w-full max-w-md"
        >
          <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don’t have an account?{' '}
            <Link to="/register" className="text-red-500 font-medium">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </PublicLayout>
  );
}