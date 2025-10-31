import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { JournalForm } from './components/JournalForm';
import { JournalList } from './components/JournalList';
import { StatsAndAchievements } from './components/StatsAndAchievements';
import './App.css';

function AppContent() {
  const { user, logout, isAuthenticated } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEntryCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>SmartJournal</h1>
          <div className="user-info">
            <span className="user-greeting">
              Welcome, <strong>{user.username}</strong>
            </span>
            <button onClick={logout} className="btn-logout" title="Logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          <div className="left-column">
            <JournalForm onEntryCreated={handleEntryCreated} />
          </div>

          <div className="right-column">
            <StatsAndAchievements refreshTrigger={refreshTrigger} />
            <JournalList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>SmartJournal - Track your gratitude journey</p>
        <div className="debug-info">
          <small>User ID: {user.id} | Backend: http://localhost:3000</small>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
