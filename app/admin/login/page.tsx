'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use Supabase Auth to sign in
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        throw new Error(authError.message || 'Invalid email or password');
      }

      if (!data.user || !data.session) {
        throw new Error('Login failed. Please try again.');
      }

      // Verify user is admin (check by email or metadata)
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
      if (adminEmail && data.user.email !== adminEmail) {
        // Sign out if not admin
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin access only.');
      }

      // Wait a moment for session to be persisted
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify session is set
      const { data: { session: verifySession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Session verification failed. Please try again.');
      }
      
      if (!verifySession) {
        throw new Error('Session not created. Please try again.');
      }
      
      // Check for redirect parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/admin/dashboard';
      
      // Success - use window.location for hard redirect to ensure cookies are sent
      window.location.href = redirectTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="container section-padding">
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <h1 style={{ 
            fontSize: 'var(--text-3xl)', 
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-2)',
            textAlign: 'center'
          }}>
            Admin Login
          </h1>
          <p style={{ 
            color: 'var(--text-bright-secondary)',
            textAlign: 'center',
            marginBottom: 'var(--space-6)'
          }}>
            Enter admin password to access order management
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ 
                display: 'block',
                marginBottom: 'var(--space-2)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label style={{ 
                display: 'block',
                marginBottom: 'var(--space-2)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {error && (
              <div style={{
                marginBottom: 'var(--space-4)',
                padding: 'var(--space-3)',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: 'var(--radius-xl)',
                fontSize: 'var(--text-sm)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: 'var(--space-4)', fontSize: 'var(--text-lg)' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}




