import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div>
      <div>
        <h1>404</h1>
        <p>Oops! Page not found</p>
        <a href="/">Return to Home</a>
      </div>
    </div>
  );
};
