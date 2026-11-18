import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import { HomePage } from './home';

import './site.css';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <HomePage />
  </StrictMode>
);

// The build renders the page ahead of time; the dev server does not.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
