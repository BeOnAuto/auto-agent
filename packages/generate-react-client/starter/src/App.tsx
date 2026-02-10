import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const queryClient = new QueryClient();

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* Add routes here */}
        <Route path="/" element={<div>Hello World</div>} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);
