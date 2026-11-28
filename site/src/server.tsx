import { StrictMode } from 'react';
import { ThemeProvider } from '@fabiocv/ui/theme';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';

import { HomePage, SUMMARY } from './home';
import { OG } from './images';
import { SkillsLogo } from './logos';
import { SITE } from './skills';

export { SITE };

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The paint's grey, light and dark, as @fabiocv/ui's Foreground disabled. */
const GROUND = { light: '#a2a4ab', dark: '#5c5d63' };

/** The page's title, as skedrick.fabio.cv's: the package, then what it is. */
const TITLE = '@fabiocv/skills – interface, interaction design and UX skills for coding agents';

/** The page as HTML, with its meta. */
export function render() {
  return {
    meta: [
      `<title>${TITLE}</title>`,
      `<meta name="description" content="${escape(SUMMARY)}" />`,
      `<meta property="og:title" content="${TITLE}" />`,
      `<meta property="og:description" content="${escape(SUMMARY)}" />`,
      `<meta property="og:url" content="${SITE}/" />`,
      `<meta property="og:image" content="${SITE}/og.png" />`,
      `<meta property="og:image:width" content="${OG.width}" />`,
      `<meta property="og:image:height" content="${OG.height}" />`,
      `<meta property="og:image:alt" content="${escape(`skills: ${SUMMARY}`)}" />`,
      `<link rel="canonical" href="${SITE}/" />`,
      `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`,
    ].join('\n    '),
    html: renderToString(
      <StrictMode>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </StrictMode>,
    ),
  };
}

/** The logo as a favicon, its grey following the system's theme. */
export function favicon() {
  return `${renderToStaticMarkup(<SkillsLogo size={32} />)
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace(
      /(<svg[^>]*>)/,
      `$1<style>.ground { fill: ${GROUND.light} } @media (prefers-color-scheme: dark) { .ground { fill: ${GROUND.dark} } }</style>`,
    )}\n`;
}
