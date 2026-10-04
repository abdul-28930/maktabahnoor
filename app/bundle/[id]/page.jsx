import redis from '@/lib/redis';
import { headers } from 'next/headers';
import BundlePageClient from './BundlePageClient';

// Strip markdown bold/italic markers for plain-text OG description
function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
}

function getSiteOrigin() {
  try {
    const headersList = headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    if (host) {
      const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
      return `${proto}://${host}`;
    }
  } catch {}
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const siteName = 'Maktabah An Noor';
  const origin = getSiteOrigin();

  try {
    const bundle = await redis.get(`mn_bundle:${id}`);
    if (!bundle) return { title: siteName };

    const title = bundle.name || siteName;
    const rawDesc = bundle.description || '';
    const description = stripMarkdown(rawDesc).slice(0, 300) || `${title} — available at ${siteName}`;

    // Bundles don't have a single coverUrl — use the first book's cover if available
    let imageUrl = null;
    let imageType = 'image/jpeg';

    if (bundle.coverUrl) {
      if (bundle.coverUrl.startsWith('http://') || bundle.coverUrl.startsWith('https://')) {
        imageUrl = bundle.coverUrl;
      } else {
        imageUrl = `${origin}/api/bundles/${id}/cover`;
        if (bundle.coverUrl.startsWith('data:')) {
          const match = bundle.coverUrl.match(/data:([^;]+)/);
          if (match) imageType = match[1];
        }
      }
    } else if (bundle.bookSlugs?.length) {
      // Fall back to the first book's cover
      const firstBook = await redis.get(`mn_book:${bundle.bookSlugs[0]}`);
      if (firstBook?.coverUrl) {
        if (firstBook.coverUrl.startsWith('http://') || firstBook.coverUrl.startsWith('https://')) {
          imageUrl = firstBook.coverUrl;
        } else {
          imageUrl = `${origin}/api/books/${bundle.bookSlugs[0]}/cover`;
          if (firstBook.coverUrl.startsWith('data:')) {
            const match = firstBook.coverUrl.match(/data:([^;]+)/);
            if (match) imageType = match[1];
          }
        }
      }
    }

    const images = imageUrl
      ? [{ url: imageUrl, alt: title, type: imageType }]
      : [];

    return {
      metadataBase: new URL(origin),
      title: `${title} | ${siteName}`,
      description,
      openGraph: {
        title: `${title} | ${siteName}`,
        description,
        images,
        type: 'website',
        siteName,
      },
      twitter: {
        card: imageUrl ? 'summary_large_image' : 'summary',
        title: `${title} | ${siteName}`,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch {
    return { title: siteName };
  }
}

export default function BundlePage() {
  return <BundlePageClient />;
}
