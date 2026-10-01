import redis from '@/lib/redis';
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

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const siteName = 'Maktabah An Noor';

  try {
    const book = await redis.get(`mn_book:${slug}`);
    if (!book) return { title: siteName };

    const title = book.title || siteName;
    const rawDesc = book.description || '';
    const description = stripMarkdown(rawDesc).slice(0, 300) || `${title} — available at ${siteName}`;

    // Only use coverUrl if it's a real URL (not a base64 data URL)
    const coverUrl = book.coverUrl && !book.coverUrl.startsWith('data:') ? book.coverUrl : null;
    const images = coverUrl ? [{ url: coverUrl, alt: title }] : [];

    return {
      title: `${title} | ${siteName}`,
      description,
      openGraph: {
        title,
        description,
        images,
        type: 'website',
        siteName,
      },
      twitter: {
        card: coverUrl ? 'summary_large_image' : 'summary',
        title,
        description,
        images: coverUrl ? [coverUrl] : [],
      },
    };
  } catch {
    return { title: siteName };
  }
}

export default function BookPage() {
  return <BookPageClient />;
}
