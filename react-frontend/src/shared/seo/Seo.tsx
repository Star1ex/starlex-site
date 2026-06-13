import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://starlex.cc';
const SITE_NAME = 'Starlex';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  'A fast, keyboard-first task tracker for small teams. Projects, subtasks, and realtime boards in one calm workspace.';

export interface SeoProps {
  /** Full <title>. Appended with the brand unless `titleIsFull` is set. */
  title: string;
  description?: string;
  /** Path beginning with "/" — used for canonical + og:url. */
  path: string;
  /** Absolute or root-relative image URL for OG/Twitter cards. */
  image?: string;
  /** Skip the " — Starlex" suffix (e.g. the landing page owns the full title). */
  titleIsFull?: boolean;
  /** Marketing/public pages index; everything else should pass false. */
  index?: boolean;
  /** schema.org og:type. */
  type?: 'website' | 'article';
}

/**
 * Single source of truth for per-route document head tags. The static
 * index.html carries the same set for the landing route so crawlers and
 * social scrapers get correct metadata before React hydrates; this keeps
 * client-side navigation and Google's rendered pass consistent.
 */
export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE,
  titleIsFull = false,
  index = true,
  type = 'website',
}: SeoProps) {
  const fullTitle = titleIsFull ? title : `${title} — ${SITE_NAME}`;
  const canonical = `${SITE_URL}${path}`;
  const ogImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  const robots = index
    ? 'index, follow, max-image-preview:large, max-snippet:-1'
    : 'noindex, nofollow';

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}

export default Seo;
