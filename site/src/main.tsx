import '@fabiocv/ui/styles.css';

import { StrictMode } from 'react';
import { ThemeProvider } from '@fabiocv/ui/theme';
import { createRoot, hydrateRoot } from 'react-dom/client';

import { HomePage } from './home';

import './site.css';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    {/* Follows the system's light or dark, as the theme script set it. */}
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  </StrictMode>
);

// The build renders the page ahead of time; the dev server does not.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
