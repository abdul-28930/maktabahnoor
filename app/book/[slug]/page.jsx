import { notFound } from 'next/navigation';
import Link from 'next/link';
import redis from '@/lib/redis';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { IG_URL, IG_HANDLE } from '@/lib/constants';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  try {
    const book = await redis.get(`mn_book:${params.slug}`);
    if (!book) return { title: 'Maktabah An Noor' };
    return { title: `${book.title} | Maktabah An Noor`, description: book.description };
  } catch { return { title: 'Maktabah An Noor' }; }
}

export default async function BookPage({ params }) {
  let book;
  try { book = await redis.get(`mn_book:${params.slug}`); } catch { notFound(); }
  if (!book) notFound();

  return (
    <>
      <Navbar />
      <div className="book-detail-page">
        <Link href="/books" className="book-detail-back">← Back to all books</Link>

        <div className="book-detail-grid">
          {/* Cover */}
          <div className="book-detail-cover">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-2)', flexDirection: 'column', gap: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-s)" strokeWidth="1"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                <span style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 20, color: 'var(--border-s)' }}>مكتبة النور</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="book-detail-body">
            <div className="book-detail-cats">
              <span className="book-detail-cat">{book.category}</span>
              <span className="book-detail-cat">{book.language}</span>
              {book.tags?.map(t => <span key={t} className="book-detail-tag">{t}</span>)}
            </div>

            <h1 className="book-detail-title">{book.title}</h1>
            {book.titleAr && <div className="book-detail-title-ar">{book.titleAr}</div>}

            <div className="book-detail-author">
              By <span>{book.author}</span>
              {book.authorAr && <span style={{ fontFamily: "'Noto Naskh Arabic',serif", marginRight: 8, direction: 'rtl', display: 'inline-block' }}> · {book.authorAr}</span>}
            </div>

            <div className={`stock-badge ${book.inStock ? 'in' : 'out'}`}>
              <span className="stock-dot" />
              {book.inStock ? 'In Stock' : 'Out of Stock'}
            </div>

            {book.description && (
              <p className="book-detail-desc">{book.description}</p>
            )}

            <div className="book-specs">
              {book.binding && (
                <div className="spec-item"><div className="spec-label">Binding</div><div className="spec-val">{book.binding}</div></div>
              )}
              {book.volumes > 0 && (
                <div className="spec-item"><div className="spec-label">Volumes</div><div className="spec-val">{book.volumes === 1 ? 'Single Volume' : `${book.volumes} Volumes`}</div></div>
              )}
              {book.pages > 0 && (
                <div className="spec-item"><div className="spec-label">Pages</div><div className="spec-val">{book.pages}</div></div>
              )}
              <div className="spec-item"><div className="spec-label">Language</div><div className="spec-val">{book.language}</div></div>
              <div className="spec-item"><div className="spec-label">Category</div><div className="spec-val">{book.category}</div></div>
            </div>

            <div className="book-detail-cta">
              <a href={`${IG_URL}?text=Assalamualaikum, I am interested in ordering: ${encodeURIComponent(book.title)}`} target="_blank" rel="noreferrer" className="btn-green">
                Order via Instagram →
              </a>
              <a href={IG_URL} target="_blank" rel="noreferrer" className="btn-outline-green">
                {IG_HANDLE}
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
