import { useEffect, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const APP_NAME = 'יומן חנ״ג חכם';
const MAIN_CONTENT_ID = 'route-main-content';

const ROUTE_TITLES = [
  [/^\/$/, 'ראשי'],
  [/^\/login\/?$/, 'התחברות'],
  [/^\/register\/?$/, 'הרשמה'],
  [/^\/forgot-password\/?$/, 'שחזור סיסמה'],
  [/^\/reset-password\/?$/, 'איפוס סיסמה'],
  [/^\/class\/[^/]+\/student\/[^/]+\/?$/, 'כרטיס תלמיד'],
  [/^\/class\/[^/]+\/tests\/?$/, 'מבדקים'],
  [/^\/class\/[^/]+\/bagrut\/?$/, 'בגרות חנ״ג'],
  [/^\/class\/[^/]+\/?$/, 'כיתה'],
  [/^\/manage-tests\/?$/, 'ניהול מבדקים'],
  [/^\/schedule\/?$/, 'מערכת שעות'],
  [/^\/lesson-manage\/?$/, 'ניהול שיעור'],
  [/^\/lesson-edit\/?$/, 'עריכת שיעור'],
  [/^\/live-run\/?$/, 'ריצה חיה'],
  [/^\/stopwatch\/?$/, 'סטופר חנ״ג'],
  [/^\/substitute-fills\/?$/, 'מילויי מקום'],
  [/^\/missing-grades\/?$/, 'השלמות וחוסרים'],
  [/^\/reports\/?$/, 'דוחות'],
  [/^\/settings\/?$/, 'הגדרות'],
];

const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export const getRouteTitle = (pathname) => (
  ROUTE_TITLES.find(([pattern]) => pattern.test(pathname))?.[1] || APP_NAME
);

const makeFocusable = (element) => {
  if (!element) return false;
  if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll: true });
  return true;
};

const findMainContent = () => document.querySelector('main, [role="main"]');

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const navigationType = useNavigationType();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const pageTitle = getRouteTitle(pathname);
    document.title = pageTitle === APP_NAME || pathname === '/'
      ? APP_NAME
      : `${pageTitle} | ${APP_NAME}`;

    setAnnouncement('');
    const announceTimer = window.setTimeout(() => setAnnouncement(`עמוד ${pageTitle}`), 50);
    let scrollTimer;

    if (navigationType !== 'POP') {
      if (hash) {
        const id = getHashId(hash);
        scrollTimer = window.setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }

    let focusTimer;
    let observer;
    const focusPageHeading = () => {
      const main = findMainContent();
      if (main && !main.id) main.id = MAIN_CONTENT_ID;
      const heading = document.querySelector('h1');
      if (!heading) return false;
      makeFocusable(heading);
      return true;
    };

    focusTimer = window.setTimeout(() => {
      if (focusPageHeading()) return;
      observer = new MutationObserver(() => {
        if (focusPageHeading()) observer?.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }, 0);
    const observerTimeout = window.setTimeout(() => observer?.disconnect(), 10000);

    return () => {
      window.clearTimeout(announceTimer);
      window.clearTimeout(scrollTimer);
      window.clearTimeout(focusTimer);
      window.clearTimeout(observerTimeout);
      observer?.disconnect();
    };
  }, [pathname, search, hash, navigationType]);

  const handleSkip = (event) => {
    event.preventDefault();
    const main = findMainContent();
    const target = main || document.querySelector('h1');
    if (!target) return;
    if (main && !main.id) main.id = MAIN_CONTENT_ID;
    makeFocusable(target);
    target.scrollIntoView({ block: 'start', behavior: 'auto' });
  };

  return (
    <>
      <a
        href={`#${MAIN_CONTENT_ID}`}
        onClick={handleSkip}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[200] focus:rounded-xl focus:bg-background focus:px-4 focus:py-3 focus:font-bold focus:text-foreground focus:shadow-xl focus:ring-2 focus:ring-primary"
      >
        דלג לתוכן הראשי
      </a>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </>
  );
}
