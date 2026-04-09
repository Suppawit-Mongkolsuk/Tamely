import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes/router';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" />
    </>
  );
}

export default App;
