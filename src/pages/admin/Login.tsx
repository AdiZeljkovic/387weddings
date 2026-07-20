import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLogin() {
  const { login, admin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (admin) {
    navigate('/admin', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Greška pri prijavi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-moody-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="text-4xl font-script text-white block mb-1">387 Cinematic</span>
          <span className="text-[9px] tracking-[0.5em] uppercase font-bold text-gold-600">Admin Panel</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-moody-900 border border-white/5 rounded-sm p-8 space-y-5">
          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase font-bold text-white/40 mb-2">
              Korisničko ime
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full bg-moody-950 border border-white/10 rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-600/50 transition-colors"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.3em] uppercase font-bold text-white/40 mb-2">
              Lozinka
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-moody-950 border border-white/10 rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-600/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-white text-[10px] tracking-[0.4em] uppercase font-bold transition-colors rounded-sm"
          >
            {loading ? 'Prijava...' : 'Prijava'}
          </button>
        </form>
      </div>
    </div>
  );
}
