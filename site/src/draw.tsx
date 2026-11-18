// The page `scripts/images.js` opens to draw the share image.
import { createRoot } from 'react-dom/client';

import { SUMMARY } from './home';
import { imageStyles, OgImage } from './images';
import { SkillsLogo } from './logos';

import './site.css';

const style = document.createElement('style');
style.textContent = imageStyles;
document.head.append(style);
// The share image is dark.
document.documentElement.style.colorScheme = 'dark';

createRoot(document.getElementById('root')!).render(
  <OgImage name="Skills" summary={SUMMARY} Logo={SkillsLogo} />,
);
