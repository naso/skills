import { StrictMode } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';

import { HomePage, SUMMARY } from './home';
import { SkillsLogo } from './logos';
import { SITE } from './skills';

export { SITE };

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The paint's grey, light and dark, as the site's `--disabled`. */
const GROUND = { light: '#a2a4ab', dark: '#5c5d63' };

/** The page as HTML, with its meta. */
export function render() {
  return {
    meta: [
      `<title>Skills</title>`,
      `<meta name="description" content="${escape(SUMMARY)}" />`,
      `<meta property="og:title" content="Skills" />`,
      `<meta property="og:description" content="${escape(SUMMARY)}" />`,
      `<meta property="og:url" content="${SITE}/" />`,
      `<link rel="canonical" href="${SITE}/" />`,
      `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`,
    ].join('\n    '),
    html: renderToString(
      <StrictMode>
        <HomePage />
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
