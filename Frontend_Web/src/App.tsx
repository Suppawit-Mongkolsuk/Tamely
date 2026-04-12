import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes/router';
import { WebRTCProvider } from '@/contexts/WebRTCContext';
import { CallOverlay } from '@/components/call/CallOverlay';

function App() {
  return (
    <WebRTCProvider>
      <RouterProvider router={router} />
      <CallOverlay />
      <Toaster richColors position="top-center" />
    </WebRTCProvider>
  );
}

export default App;
