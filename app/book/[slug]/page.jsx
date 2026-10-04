import redis from '@/lib/redis';
import { headers } from 'next/headers';
import BookPageClient from './BookPageClient';

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
    const book = await redis.get(`mn_book:${slug}`);
    if (!book) return { title: siteName };

    const title = book.title || siteName;
    const rawDesc = book.description || '';
    const description = stripMarkdown(rawDesc).slice(0, 300) || `${title} — available at ${siteName}`;

    // Resolve book cover image:
    // If it's an external HTTP/HTTPS URL, use it directly.
    // If it's a base64 data URL or relative path, serve it via the /api/books/[slug]/cover endpoint
    let imageUrl = null;
    let imageType = 'image/jpeg';

    if (book.coverUrl) {
      if (book.coverUrl.startsWith('http://') || book.coverUrl.startsWith('https://')) {
        imageUrl = book.coverUrl;
      } else {
        imageUrl = `${origin}/api/books/${slug}/cover`;
        if (book.coverUrl.startsWith('data:')) {
          const match = book.coverUrl.match(/data:([^;]+)/);
          if (match) imageType = match[1];
        }
      }
    }

    const images = imageUrl
      ? [
          {
            url: imageUrl,
            alt: title,
            type: imageType,
          },
        ]
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

export default function BookPage() {
  return <BookPageClient />;
}
