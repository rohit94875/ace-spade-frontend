import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(email.trim(), password, username.trim());
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <motion.form style={styles.card} onSubmit={handleSubmit} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={styles.title}>Create account</h1>
        <input style={styles.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={styles.input} placeholder="Username (3–20 chars)" value={username} maxLength={20} onChange={(e) => setUsername(e.target.value)} required />
        <input style={styles.input} type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.btn} type="submit" disabled={loading}>{loading ? 'Creating…' : 'Register'}</button>
        <p style={styles.linkRow}>Already have an account? <Link to="/login" style={styles.link}>Sign in</Link></p>
        <Link to="/login" style={styles.back}>← Back to sign in</Link>
      </motion.form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0d2b1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { background: 'linear-gradient(135deg, #1b4332, #0d2b1a)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 },
  input: { padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: 15 },
  btn: { padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2d6a4f, #1b4332)', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  error: { color: '#e74c3c', fontSize: 13, margin: 0 },
  linkRow: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center' as const },
  link: { color: '#74c69d' },
  back: { color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center' as const, textDecoration: 'none' },
};
