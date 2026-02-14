import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';

const queryClient = new QueryClient();

const LandingPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50">
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="flex flex-col items-center gap-6">
        <h1 className="text-5xl md:text-7xl font-extralight tracking-tight text-foreground">
          Your ideas await
        </h1>
        <Separator className="w-16 bg-muted-foreground/30" />
      </CardContent>
    </Card>
  </div>
);

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);
