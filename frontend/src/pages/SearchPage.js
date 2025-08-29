  // src/pages/SearchPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchBar from '../SearchBar';
import Results from '../Results';
import './SearchPage.css'; // Create this file for styling

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  
  const location = useLocation();
  const navigate = useNavigate();

  // Extract query from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchQuery = urlParams.get('q');
    
    if (searchQuery) {
      setQuery(searchQuery);
      handleSearch(searchQuery);
    } else {
      // If no query, redirect to home
      navigate('/');
    }
  }, [location.search, navigate]);

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
        const res = await axios.get(`https://leetsniff.onrender.com/search?q=${encodeURIComponent(searchQuery)}`);
        console.log('Search results:', res.data);
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to fetch results. Please try again.');
      } finally {
        setIsLoading(false);
        setHasSearched(true); // ✅ Mark that a search has been performed
      }
  }, []);

  const handleNewSearch = useCallback((newQuery) => {
    if (newQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(newQuery)}`);
    }
  }, [navigate]);

  return (
    <div className="search-page">
      <div className="search-header">
        <div className="search-logo">
          <span style={{ color: '#4285F4' }}>L</span>
          <span style={{ color: '#DB4437' }}>e</span>
          <span style={{ color: '#F4B400' }}>e</span>
          <span style={{ color: '#4285F4' }}>t</span>
          <span style={{ color: '#0F9D58' }}>S</span>
          <span style={{ color: '#DB4437' }}>n</span>
          <span style={{ color: '#F4B400' }}>i</span>
          <span style={{ color: '#0F9D58' }}>f</span>
          <span style={{ color: '#4285F4' }}>f</span>
        </div>
        <div className="search-bar-container">
          <SearchBar
            query={query}
            setQuery={setQuery}
            onSearch={handleNewSearch}
            compact={true}
          />
        </div>
      </div>
      
      <div className="search-results-container">
        {isLoading && <div className="loading-indicator">Searching...</div>}
        {error && <div className="error-message">{error}</div>}
        {hasSearched && !isLoading && !error && results.length === 0 && (
        <div className="no-results">No results found for "{query}"</div>
        )}
        <Results data={results} />
      </div>
    </div>
  );
}

export default SearchPage;