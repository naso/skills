// The page `scripts/images.js` opens to draw the share image.
import '@fabiocv/ui/styles.css';

import { createRoot } from 'react-dom/client';

import { SUMMARY } from './home';
import { imageStyles, OgImage } from './images';
import { SkillsLogo } from './logos';

import './site.css';

const style = document.createElement('style');
style.textContent = imageStyles;
document.head.append(style);
// The share image is dark.
document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')!).render(
  <OgImage name="Skills" summary={SUMMARY} Logo={SkillsLogo} />,
);
