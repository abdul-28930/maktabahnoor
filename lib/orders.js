import redis from '@/lib/redis';

const MAX_ORDERS = 500;

export async function logOrder({ orderRef, items, total, pincode, userId = null, username = null, phone = null, whatsapp = null }) {
  const now = new Date().toISOString();
  const record = {
    orderRef,
    items,
    total,
    pincode: pincode || '',
    userId: userId || null,
    username: username || null,
    phone: phone || null,
    whatsapp: whatsapp || null,
    createdAt: now,
    fulfilled: false,
  };
  await redis.hset('mn_orders', { [orderRef]: record });
  const index = await redis.get('mn_orders_index') || [];
  index.unshift(orderRef);
  if (index.length > MAX_ORDERS) index.length = MAX_ORDERS;
  await redis.set('mn_orders_index', index);
}
