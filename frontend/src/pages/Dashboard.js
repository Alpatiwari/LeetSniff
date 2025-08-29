// src/pages/Dashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Add a small delay to ensure session is properly set after OAuth redirect
    const checkAuth = async () => {
      // First check for stored user in localStorage (for existing users)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem('user');
        }
      }

      // If no stored user, check with backend session
      try {
        const res = await fetch('https://leetsniff.onrender.com/auth/user', {
          credentials: 'include'
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          // Store user data in localStorage for future visits
          localStorage.setItem('user', JSON.stringify(userData));
          setLoading(false);
        } else {
          throw new Error('Not authenticated');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setLoading(false);
        // Clear any invalid stored data
        localStorage.removeItem('user');
        navigate('/signin');
      }
    };

    // Add a small delay to ensure session is set after OAuth redirect
    setTimeout(checkAuth, 100);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch('https://leetsniff.onrender.com/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      // Clear stored user data
      localStorage.removeItem('user');
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout request fails, clear local data and redirect
      localStorage.removeItem('user');
      navigate('/signin');
    }
  };

  if (loading) {
    return (
      <div className="dashboard" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dashboard" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Welcome, {user.name || user.login}!</h2>
      
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <img 
          src={user.avatar_url} 
          alt={user.name || user.login} 
          width="100" 
          height="100"
          style={{ borderRadius: '50%', border: '3px solid #ddd' }} 
        />
      </div>

      <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
        <p><strong>Email:</strong> {user.email || 'N/A'}</p>
        <p><strong>Provider:</strong> {user.provider}</p>
        {user.bio && <p><strong>Bio:</strong> {user.bio}</p>}
        {user.location && <p><strong>Location:</strong> {user.location}</p>}
        {user.public_repos && <p><strong>Public Repos:</strong> {user.public_repos}</p>}
        {user.followers && <p><strong>Followers:</strong> {user.followers}</p>}
        {user.following && <p><strong>Following:</strong> {user.following}</p>}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button 
          onClick={handleLogout}
          style={{
            padding: '0.8rem 2rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;