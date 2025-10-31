import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi, ApiError } from '../lib/api';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'create' | 'login'>('login');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[Login] Creating user:', username);
      const user = await userApi.create(username, email, 'debug_password');
      console.log('[Login] User created successfully:', user);
      login(user);
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? err.message
        : 'Failed to create user. Please try again.';

      console.error('[Login] Error creating user:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const id = parseInt(userId);
      if (isNaN(id) || id <= 0) {
        setError('Please enter a valid user ID');
        setLoading(false);
        return;
      }

      console.log('[Login] Logging in with user ID:', id);
      const user = await userApi.getById(id);
      console.log('[Login] User found:', user);
      login(user);
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? err.message
        : 'Failed to login. Please check the user ID.';

      console.error('[Login] Error logging in:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>SmartJournal Debug Login</h1>
        <p className="subtitle">Simple authentication for testing</p>

        <div className="mode-switcher">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Login by ID
          </button>
          <button
            className={mode === 'create' ? 'active' : ''}
            onClick={() => setMode('create')}
          >
            Create New User
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="userId">User ID</label>
              <input
                id="userId"
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID (e.g., 1)"
                required
                min="1"
              />
              <small>Enter an existing user ID from the database</small>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateUser} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                minLength={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        )}

        <div className="debug-info">
          <p><strong>Debug Mode</strong></p>
          <p>Backend API: <code>http://localhost:3000/api</code></p>
          <p>Make sure your backend server is running!</p>
        </div>
      </div>
    </div>
  );
}
