// App.js - FIXED VERSION
import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import Results from './Results';
import Navbar from './Navbar';
import Footer from './Footer';
import SignIn from './SignIn';
import AboutPage from './pages/About';
import SignUp from './SignUp';
import Dashboard from './pages/Dashboard';
import './App.css';

function HomePage({ query, setQuery, onSearch }) {
  return (
    <div className="home-container">
      <div className="search-content">
        <h1 className="logo">
          <span className="logo-letter" style={{ color: '#4285F4' }}>L</span>
          <span className="logo-letter" style={{ color: '#DB4437' }}>e</span>
          <span className="logo-letter" style={{ color: '#F4B400' }}>e</span>
          <span className="logo-letter" style={{ color: '#4285F4' }}>t</span>
          <span className="logo-letter" style={{ color: '#0F9D58' }}>S</span>
          <span className="logo-letter" style={{ color: '#DB4437' }}>n</span>
          <span className="logo-letter" style={{ color: '#F4B400' }}>i</span>
          <span className="logo-letter" style={{ color: '#0F9D58' }}>f</span>
          <span className="logo-letter" style={{ color: '#4285F4' }}>f</span>
        </h1>
        <SearchBar query={query} setQuery={setQuery} onSearch={onSearch} />
      </div>
    </div>
  );
}

function SearchResultsPage({ query, setQuery, onSearch, isLoading, error, results, currentUser, onLogout }) {
  const navigate = useNavigate();
  
  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="search-results-page">
      <div className="search-results-navbar">
        <div className="search-results-nav-left">
          <h2 className="compact-logo" onClick={handleLogoClick}>
            <span className="logo-letter" style={{ color: '#4285F4' }}>L</span>
            <span className="logo-letter" style={{ color: '#DB4437' }}>e</span>
            <span className="logo-letter" style={{ color: '#F4B400' }}>e</span>
            <span className="logo-letter" style={{ color: '#4285F4' }}>t</span>
            <span className="logo-letter" style={{ color: '#0F9D58' }}>S</span>
            <span className="logo-letter" style={{ color: '#DB4437' }}>n</span>
            <span className="logo-letter" style={{ color: '#F4B400' }}>i</span>
            <span className="logo-letter" style={{ color: '#0F9D58' }}>f</span>
            <span className="logo-letter" style={{ color: '#4285F4' }}>f</span>
          </h2>
          <div className="search-bar-container">
            <SearchBar query={query} setQuery={setQuery} onSearch={onSearch} />
          </div>
        </div>
        <div className="search-results-nav-right">
          {currentUser ? (
            <div className="user-info">
              <span>Welcome, {currentUser.name || currentUser.login}</span>
              <button onClick={onLogout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <div className="auth-links">
              <a href="/signin" className="auth-link">Sign In</a>
            </div>
          )}
        </div>
      </div>

      <div className="search-results-main">
        <div className="search-results-container">
          {isLoading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">Searching...</div>
            </div>
          )}
          
          {error && (
            <div className="error-container">
              <div className="error-message">{error}</div>
            </div>
          )}
          
          {!isLoading && !error && results.length > 0 && (
            <>
              <div className="results-info">
                About {results.length} results for "{query}"
              </div>
              <Results data={results} />
            </>
          )}
          
          {!isLoading && !error && results.length === 0 && query && (
            <div className="no-results">
              <div className="no-results-message">
                No results found for "{query}"
              </div>
              <div className="no-results-suggestions">
                Try different keywords or check your spelling
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function useAuthFromUrl() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const authParam = urlParams.get('auth');
    const userParam = urlParams.get('user');

    if (authParam === 'success' && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        setUser(userData);
        setAuthStatus('success');
        localStorage.setItem('user', JSON.stringify(userData));

        setTimeout(() => {
          window.history.replaceState({}, document.title, '/');
        }, 100);
      } catch (error) {
        setAuthStatus('error');
        setTimeout(() => {
          window.history.replaceState({}, document.title, '/');
        }, 100);
      }
    } else if (authParam === 'error') {
      setAuthStatus('error');
      setTimeout(() => {
        window.history.replaceState({}, document.title, '/');
      }, 100);
    }
  }, [location]);

  return { user, authStatus };
}

function AppContent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [hasExecutedInitialSearch, setHasExecutedInitialSearch] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchExecutedRef = useRef(false);

  const { user: urlUser, authStatus } = useAuthFromUrl();

  // FIXED: Better handling of URL parameters and initial search
  useEffect(() => {
    if (location.pathname === '/search') {
      const urlParams = new URLSearchParams(location.search);
      const searchQuery = urlParams.get('q');
      
      if (searchQuery && searchQuery.trim()) {
        setQuery(searchQuery);
        
        // Only execute search if we haven't done the initial search yet
        if (!hasExecutedInitialSearch) {
          setHasExecutedInitialSearch(true);
          executeSearch(searchQuery);
        }
      }
    } else {
      // Reset when leaving search page
      setHasExecutedInitialSearch(false);
      searchExecutedRef.current = false;
    }
  }, [location.pathname, location.search, hasExecutedInitialSearch]);

  // FIXED: Separated search execution logic
  const executeSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return;
    
    // Prevent duplicate searches
    if (searchExecutedRef.current && searchExecutedRef.current === searchQuery) {
      return;
    }
    
    searchExecutedRef.current = searchQuery;
    
    console.log('🔍 Executing search for:', searchQuery);
    
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await axios.get(`https://leetsniff.onrender.com/search?q=${encodeURIComponent(searchQuery)}`);
      console.log('✅ Search results received:', res.data?.length || 0, 'items');
      setResults(res.data || []);
    } catch (err) {
      console.error('❌ Search failed:', err);
      setError('Failed to fetch results. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // FIXED: Simplified handleSearch function
  const handleSearch = useCallback(async (searchQuery = query) => {
    if (!searchQuery || !searchQuery.trim()) return;
    
    const trimmedQuery = searchQuery.trim();
    
    // If we're not on search page, navigate there first
    if (location.pathname !== '/search') {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      return;
    }
    
    // Update URL if query changed
    const currentUrlQuery = new URLSearchParams(location.search).get('q');
    if (currentUrlQuery !== trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`, { replace: true });
      return;
    }
    
    // Execute the search
    await executeSearch(trimmedQuery);
  }, [query, navigate, location.pathname, location.search, executeSearch]);

  // Auth and user management (unchanged)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem('user');
    }
    setIsUserLoaded(true);
  }, []);

  useEffect(() => {
    if (urlUser) setCurrentUser(urlUser);
  }, [urlUser]);

  useEffect(() => {
    if (authStatus === 'success') {
      setError(null);
    } else if (authStatus === 'error') {
      setError('Authentication failed. Please try again.');
    }
  }, [authStatus]);

  useEffect(() => {
    if (!currentUser && isUserLoaded) {
      axios.get('https://leetsniff.onrender.com/auth/user', { withCredentials: true })
        .then(res => {
          if (res.data?.user) {
            setCurrentUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {});
    }
  }, [currentUser, isUserLoaded]);

  const handleLogout = useCallback(async () => {
    try {
      await axios.post('https://leetsniff.onrender.com/auth/logout', {}, { withCredentials: true });
    } catch {}
    setCurrentUser(null);
    localStorage.removeItem('user');
  }, []);

  return (
    <div className="App">
      {location.pathname !== '/search' && (
        <Navbar githubUser={currentUser} onLogout={handleLogout} />
      )}
      
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              query={query}
              setQuery={setQuery}
              onSearch={handleSearch}
            />
          }
        />
        <Route
          path="/search"
          element={
            <SearchResultsPage
              query={query}
              setQuery={setQuery}
              onSearch={handleSearch}
              isLoading={isLoading}
              error={error}
              results={results}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          }
        />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      
      {location.pathname !== '/search' && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;