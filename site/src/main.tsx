import '@fabiocv/ui/styles.css';

import { StrictMode } from 'react';
import { ThemeProvider } from '@fabiocv/ui/theme';
import { createRoot, hydrateRoot } from 'react-dom/client';

import { HomePage, NotFoundPage } from './home';

import './site.css';

const root = document.getElementById('root')!;
// `404.html` says so on its root, and answers whatever path was asked for.
const missing = root.dataset.page === 'not-found';
const app = (
  <StrictMode>
    {/* Follows the system's light or dark, as the theme script set it. */}
    <ThemeProvider>{missing ? <NotFoundPage /> : <HomePage />}</ThemeProvider>
  </StrictMode>
);

// The build renders the page ahead of time; the dev server does not.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
