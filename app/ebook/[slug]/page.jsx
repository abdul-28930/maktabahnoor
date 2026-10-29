import redis from '@/lib/redis';
import { headers } from 'next/headers';
import EbookPageClient from './EbookPageClient';

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
  } catch {
    // Fallback when headers are unavailable (e.g. static pre-render)
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const siteName = 'Maktabah An Noor';
  const origin = getSiteOrigin();

  try {
    const ebook = await redis.get(`mn_ebook:${slug}`);
    if (!ebook) return { title: siteName };

    const title = ebook.title || siteName;
    const rawDesc = ebook.description || '';
    const description = stripMarkdown(rawDesc).slice(0, 300) || `${title} — available at ${siteName}`;

    let imageUrl = null;
    let imageType = 'image/jpeg';

    if (ebook.coverUrl) {
      if (ebook.coverUrl.startsWith('http://') || ebook.coverUrl.startsWith('https://')) {
        imageUrl = ebook.coverUrl;
      } else {
        imageUrl = `${origin}/api/ebooks/${slug}/cover`;
        if (ebook.coverUrl.startsWith('data:')) {
          const match = ebook.coverUrl.match(/data:([^;]+)/);
          if (match) imageType = match[1];
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

export default function EbookPage() {
  return <EbookPageClient />;
}
