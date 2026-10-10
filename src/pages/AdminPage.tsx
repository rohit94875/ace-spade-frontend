import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import * as adminApi from '../services/adminApi';
import type { AdminUser } from '../services/adminApi';

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const getAccessToken = useAuthStore((s) => s.getAccessToken);
  const [code, setCode] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const [codeRes, userList] = await Promise.all([
        adminApi.getRegistrationCode(token),
        adminApi.listAdminUsers(token),
      ]);
      setCode(codeRes.code);
      setUsers(userList);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (user?.admin) load();
  }, [user?.admin, load]);

  async function toggleBlock(target: AdminUser) {
    setActionId(target.id);
    setError('');
    try {
      const token = await getAccessToken();
      if (!token) return;
      const updated = target.blocked
        ? await adminApi.unblockUser(token, target.id)
        : await adminApi.blockUser(token, target.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Action failed');
    } finally {
      setActionId(null);
    }
  }

  if (!user?.admin) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.muted}>Admin access required.</p>
          <Link to="/" style={styles.link}>← Lobby</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <h1 style={styles.title}>Admin</h1>
          <Link to="/" style={styles.link}>← Lobby</Link>
        </div>

        {loading && <p style={styles.muted}>Loading…</p>}
        {error && <p style={styles.error}>{error}</p>}

        {!loading && (
          <>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Registration code</h2>
              <p style={styles.hint}>Share this for one new signup. It rotates automatically after each successful registration.</p>
              <div style={styles.codeRow}>
                <code style={styles.code}>{code || '—'}</code>
                <button
                  type="button"
                  style={styles.smallBtn}
                  disabled={!code}
                  onClick={() => navigator.clipboard.writeText(code)}
                >
                  Copy
                </button>
              </div>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Accounts</h2>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>User</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th} />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td style={styles.td}>
                          {u.username}
                          {u.admin ? ' · admin' : ''}
                          {u.id === user.id ? ' (you)' : ''}
                        </td>
                        <td style={styles.td}>{u.email}</td>
                        <td style={styles.td}>{u.blocked ? 'Blocked' : 'Active'}</td>
                        <td style={styles.td}>
                          {u.id !== user.id && (
                            <button
                              type="button"
                              style={u.blocked ? styles.unblockBtn : styles.blockBtn}
                              disabled={actionId === u.id}
                              onClick={() => toggleBlock(u)}
                            >
                              {u.blocked ? 'Unblock' : 'Deactivate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0d2b1a', padding: 24 },
  card: {
    maxWidth: 900, margin: '0 auto', background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24,
  },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#fff', margin: 0, fontSize: 26, fontWeight: 800 },
  link: { color: '#74c69d', textDecoration: 'none', fontSize: 14 },
  muted: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  error: { color: '#e74c3c', fontSize: 14 },
  section: { marginTop: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, margin: '0 0 8px' },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 12px', lineHeight: 1.45 },
  codeRow: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  code: {
    flex: 1, minWidth: 200, padding: '10px 12px', borderRadius: 8,
    background: 'rgba(0,0,0,0.35)', color: '#a8e6cf', fontSize: 13, wordBreak: 'break-all',
  },
  smallBtn: {
    padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontWeight: 600,
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left', color: 'rgba(255,255,255,0.5)', padding: '8px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  td: { color: 'rgba(255,255,255,0.85)', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  blockBtn: {
    padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(231,76,60,0.5)',
    background: 'rgba(231,76,60,0.15)', color: '#e74c3c', cursor: 'pointer', fontWeight: 600,
  },
  unblockBtn: {
    padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(116,198,157,0.5)',
    background: 'rgba(116,198,157,0.15)', color: '#74c69d', cursor: 'pointer', fontWeight: 600,
  },
};
