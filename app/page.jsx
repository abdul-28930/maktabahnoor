import HomeClient from '@/components/HomeClient';
import redis from '@/lib/redis';

export const revalidate = 60; // ISR — revalidate every 60 seconds

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
    featuredBooks = sorted.filter(b => b.tags?.includes('Featured')).slice(0, 4);
    newArrivals   = sorted.filter(b => b.tags?.includes('New Arrival')).slice(0, 4);
  } catch (e) {
    console.error('Homepage data fetch error:', e);
  }
  return <HomeClient featuredBooks={featuredBooks} newArrivals={newArrivals} />;
}
