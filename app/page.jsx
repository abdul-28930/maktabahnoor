import HomeClient from '@/components/HomeClient';
import redis from '@/lib/redis';

export const revalidate = 60; // ISR — revalidate every 60 seconds

async function getHeroSlides() {
  try {
    const all = await redis.get('mn_hero_slides') || [];
    const active = all.filter(s => s.active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Resolve "feature a book" slides against the live book record, so the
    // slide always shows the book's current cover/title/price even if it
    // changes after the slide was set up — and drops the slide cleanly if
    // the book was later deleted or hidden.
    const resolved = await Promise.all(active.map(async (s) => {
      if (s.mode !== 'book') return s;
      const book = await redis.get(`mn_book:${s.bookSlug}`);
      if (!book || book.visible === false) return null;
      return {
        ...s,
        imageUrl: s.imageUrl || book.coverUrl || '',
        title:    s.title    || book.title    || '',
        subtitle: s.subtitle || book.description || '',
        ctaLabel: s.ctaLabel || 'Shop Now',
        ctaUrl:   s.ctaUrl   || `/book/${book.slug}`,
        book,
      };
    }));
    return resolved.filter(Boolean);
  } catch (e) {
    console.error('Hero slides fetch error:', e);
    return [];
  }
}

export default async function HomePage() {
  let featuredBooks = [], newArrivals = [];
  try {
    const meta = await redis.get('mn_books_meta') || [];
    const visible = meta.filter(b => b.visible !== false);
    // Out-of-stock books sink to the bottom, newest-first within each group,
    // so the homepage doesn't spotlight something a visitor can't buy.
    const sorted = [...visible].sort((a, b) => {
      const aOut = a.inStock === false ? 1 : 0;
      const bOut = b.inStock === false ? 1 : 0;
      if (aOut !== bOut) return aOut - bOut;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Admin can hand-pick which books appear in each section (and in what
    // order) from the admin panel. If they haven't set any picks yet, fall
    // back to the original tag-based auto-selection so the homepage never
    // looks empty on a fresh setup.
    const picks = await redis.get('mn_homepage_picks') || { featured: [], newArrivals: [] };
    const bySlug = Object.fromEntries(visible.map(b => [b.slug, b]));

    featuredBooks = picks.featured?.length
      ? picks.featured.map(slug => bySlug[slug]).filter(Boolean).slice(0, 4)
      : sorted.filter(b => b.tags?.includes('Featured')).slice(0, 4);

    newArrivals = picks.newArrivals?.length
      ? picks.newArrivals.map(slug => bySlug[slug]).filter(Boolean).slice(0, 4)
      : sorted.filter(b => b.tags?.includes('New Arrival')).slice(0, 4);
  } catch (e) {
    console.error('Homepage data fetch error:', e);
  }
  const heroSlides = await getHeroSlides();
  return <HomeClient featuredBooks={featuredBooks} newArrivals={newArrivals} heroSlides={heroSlides} />;
}
