// SignInWithGithub.js
import React from 'react';

const SignInWithGithub = () => {
  const handleLogin = () => {
    window.location.href = 'https://leetsniff.onrender.com/auth/github/callback';
  };

  return (
    <button onClick={handleLogin}>
      Sign in with GitHub
    </button>
  );
};

export default SignInWithGithub;