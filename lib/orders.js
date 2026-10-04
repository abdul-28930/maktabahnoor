import redis from '@/lib/redis';

const MAX_ORDERS = 500;

export async function logOrder({ orderRef, items, total, delivery = {}, coupon = null, userId = null, username = null }) {
  const now = new Date().toISOString();
  const record = {
    orderRef,
    items,
    total,
    // Full delivery details
    name:    delivery.name    || '',
    phone:   delivery.phone   || '',
    address: delivery.address || '',
    city:    delivery.city    || '',
    state:   delivery.state   || '',
    country: delivery.country || '',
    pincode: delivery.pincode || '',
    // Coupon (if any)
    coupon: coupon || null,
    // User info
    userId:   userId   || null,
    username: username || null,
    createdAt: now,
    fulfilled: false,
  };
  await redis.hset('mn_orders', { [orderRef]: record });
  const index = await redis.get('mn_orders_index') || [];
  index.unshift(orderRef);
  if (index.length > MAX_ORDERS) index.length = MAX_ORDERS;
  await redis.set('mn_orders_index', index);
}
