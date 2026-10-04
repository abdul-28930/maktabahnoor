import redis from '@/lib/redis';
import { headers } from 'next/headers';
import AccessoryPageClient from './AccessoryPageClient';

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
  const { slug } = await params;
  const siteName = 'Maktabah An Noor';
  const origin = getSiteOrigin();

  try {
    const all = await redis.get('mn_accessories') || [];
    const item = all.find(a => a.slug === slug || a.id === slug);
    if (!item) return { title: siteName };

    const title = item.name || siteName;
    const rawDesc = item.description || '';
    const description = stripMarkdown(rawDesc).slice(0, 300) || `${title} — available at ${siteName}`;

    let imageUrl = null;
    let imageType = 'image/jpeg';

    if (item.coverUrl) {
      if (item.coverUrl.startsWith('http://') || item.coverUrl.startsWith('https://')) {
        imageUrl = item.coverUrl;
      } else {
        imageUrl = `${origin}/api/accessories/${item.slug || item.id}/cover`;
        if (item.coverUrl.startsWith('data:')) {
          const match = item.coverUrl.match(/data:([^;]+)/);
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

export default function AccessoryPage() {
  return <AccessoryPageClient />;
}
