import { useEffect } from 'react';

/**
 * Imperatively set SEO tags on <head>. Bypasses react-helmet-async v2
 * which has known bugs merging <meta>/<link> with static index.html tags.
 *
 * All tags inserted by this hook carry data-seo-managed="true" so subsequent
 * navigations can clean up tags from the previous page without touching the
 * static tags set by index.html or other libraries.
 */
const CLEANUP_ATTR = 'data-seo-managed';

function setOrUpdateMeta({ key, keyAttr = 'name', content }) {
  if (!content) return null;
  let el = document.head.querySelector(`meta[${keyAttr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(keyAttr, key);
    el.setAttribute(CLEANUP_ATTR, 'true');
    document.head.appendChild(el);
  } else {
    // Mark existing (static) tag so we restore it rather than delete on unmount
    if (!el.hasAttribute(CLEANUP_ATTR)) {
      el.setAttribute('data-seo-original', el.getAttribute('content') || '');
      el.setAttribute(CLEANUP_ATTR, 'update');
    }
  }
  el.setAttribute('content', content);
  return el;
}

function setOrUpdateLink({ rel, href }) {
  if (!href) return null;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute(CLEANUP_ATTR, 'true');
    document.head.appendChild(el);
  } else if (!el.hasAttribute(CLEANUP_ATTR)) {
    el.setAttribute('data-seo-original', el.getAttribute('href') || '');
    el.setAttribute(CLEANUP_ATTR, 'update');
  }
  el.setAttribute('href', href);
  return el;
}

function setOrUpdateJsonLd(id, data) {
  if (!data) return null;
  const selector = `script[type="application/ld+json"][data-seo-id="${id}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-seo-id', id);
    el.setAttribute(CLEANUP_ATTR, 'true');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
  return el;
}

export default function useSEO({ title, description, canonical, ogImage, jsonLd, noindex = false }) {
  useEffect(() => {
    const originalTitle = document.title;
    if (title) document.title = title;

    setOrUpdateMeta({ key: 'description', content: description });
    setOrUpdateMeta({ key: 'og:title', keyAttr: 'property', content: title });
    setOrUpdateMeta({ key: 'og:description', keyAttr: 'property', content: description });
    setOrUpdateMeta({ key: 'og:url', keyAttr: 'property', content: canonical });
    setOrUpdateMeta({ key: 'og:image', keyAttr: 'property', content: ogImage });
    setOrUpdateMeta({ key: 'og:type', keyAttr: 'property', content: 'article' });
    setOrUpdateMeta({ key: 'og:locale', keyAttr: 'property', content: 'en_GB' });
    setOrUpdateMeta({ key: 'twitter:title', content: title });
    setOrUpdateMeta({ key: 'twitter:description', content: description });
    setOrUpdateMeta({ key: 'twitter:image', content: ogImage });

    if (noindex) {
      setOrUpdateMeta({ key: 'robots', content: 'noindex, nofollow' });
    }

    setOrUpdateLink({ rel: 'canonical', href: canonical });
    setOrUpdateJsonLd('page-jsonld', jsonLd);

    // Cleanup: restore original tags when navigating away
    return () => {
      document.title = originalTitle;
      document.head.querySelectorAll(`[${CLEANUP_ATTR}="true"]`).forEach((el) => el.remove());
      document.head.querySelectorAll(`[${CLEANUP_ATTR}="update"]`).forEach((el) => {
        const orig = el.getAttribute('data-seo-original') || '';
        if (el.tagName === 'META') el.setAttribute('content', orig);
        if (el.tagName === 'LINK') el.setAttribute('href', orig);
        el.removeAttribute(CLEANUP_ATTR);
        el.removeAttribute('data-seo-original');
      });
    };
  }, [title, description, canonical, ogImage, jsonLd, noindex]);
}
