'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

const TAG_STYLES = {
  'New Arrival': 'badge-new',
  'Bestseller':  'badge-best',
  'Featured':    'badge-feat',
  'Recommended': 'badge-rec',
};

export default function BookCard({ book }) {
  const { addToCart, isInCart } = useCart();
  const topTag  = book.tags?.find(t => TAG_STYLES[t]);
  const inCart  = isInCart(book.slug);

  function handleAddToCart(e) {
    e.preventDefault();   // don't navigate to book page
    e.stopPropagation();
    addToCart(book);
  }

  return (
    <Link href={`/book/${book.slug}`} className="book-card">
      <div className="book-cover">
        {book.coverUrl && book.coverUrl !== '__base64__' ? (
          <img src={book.coverUrl} alt={book.title} loading="lazy" />
        ) : (
          <div className="book-cover-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
            <span>مكتبة النور</span>
          </div>
        )}
        {topTag && <div className="book-badges"><span className={`badge-tag ${TAG_STYLES[topTag]}`}>{topTag}</span></div>}
        {!book.inStock && (
          <div className="out-of-stock-overlay">
            <span className="out-of-stock-label">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="book-body">
        <div className="book-meta-top">
          <span className="book-category">{book.category}</span>
          <span className="book-lang">{book.language}</span>
        </div>
        <div className="book-title">{book.title}</div>
        <div className="book-author">{book.author}</div>
        <div className="book-details-row">
          {book.binding && <span className="book-detail-item">{book.binding}</span>}
          {book.volumes > 1 && <span className="book-detail-item">{book.volumes} vols</span>}
          {book.pages && <span className="book-detail-item">{book.pages} pp</span>}
        </div>

        {/* Add to Cart button */}
        {book.inStock !== false && (
          <button
            className={`book-add-to-cart${inCart ? ' book-add-to-cart--in' : ''}`}
            onClick={handleAddToCart}
            aria-label={inCart ? 'Already in cart' : `Add ${book.title} to cart`}
          >
            {inCart ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Added
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                Add to Cart
              </>
            )}
          </button>
        )}
      </div>
    </Link>
  );
}
