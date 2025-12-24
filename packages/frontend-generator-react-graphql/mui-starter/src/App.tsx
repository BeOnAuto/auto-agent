import { ApolloProvider } from '@apollo/client';
import { ThemeProvider } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { apolloClient } from '@/apolloClient';
import { Index } from '@/pages/Index';
import { NotFound } from '@/pages/NotFound';
import { theme } from '@/theme.ts';

export const App = () => (
  <ApolloProvider client={apolloClient}>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </ApolloProvider>
);
