'use client';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BookCard from '@/components/BookCard';
import { CATEGORIES, LANGUAGES, TAGS } from '@/lib/constants';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BooksContent() {
  const searchParams = useSearchParams();
  const [books, setBooks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [selCat, setSelCat]   = useState(searchParams.get('category') || '');
  const [selLang, setSelLang] = useState(searchParams.get('language') || '');
  const [selTag, setSelTag]   = useState(searchParams.get('tag') || '');
  const [selStock, setSelStock] = useState('');

  useEffect(() => {
    fetch('/api/books')
      .then(r => r.json())
      .then(d => { setBooks(d.books || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return books.filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.titleAr?.includes(q);
      const matchCat    = !selCat  || b.category === selCat;
      const matchLang   = !selLang || b.language === selLang;
      const matchTag    = !selTag  || b.tags?.includes(selTag);
      const matchStock  = !selStock || (selStock === 'in' ? b.inStock : !b.inStock);
      return matchSearch && matchCat && matchLang && matchTag && matchStock;
    });
  }, [books, search, selCat, selLang, selTag, selStock]);

  function clearFilters() { setSelCat(''); setSelLang(''); setSelTag(''); setSelStock(''); setSearch(''); }
  const hasFilters = selCat || selLang || selTag || selStock || search;

  return (
    <>
      <div className="books-page-header">
        <div className="books-page-header-inner">
          <h1 className="page-title">All Books</h1>
          <p className="page-sub">Browse our complete collection of Islamic books.</p>
        </div>
      </div>

      <div className="books-layout">
        {/* Sidebar */}
        <aside className="filter-sidebar">
          {hasFilters && <button className="filter-clear" onClick={clearFilters}>✕ Clear all filters</button>}

          <div className="filter-section" style={{ marginTop: hasFilters ? 20 : 0 }}>
            <div className="filter-title">Category</div>
            <div className="filter-options">
              {CATEGORIES.map(c => (
                <label key={c} className={`filter-opt${selCat === c ? ' active' : ''}`}>
                  <input type="radio" name="cat" checked={selCat === c} onChange={() => setSelCat(selCat === c ? '' : c)} />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <hr className="filter-divider" />

          <div className="filter-section">
            <div className="filter-title">Language</div>
            <div className="filter-options">
              {LANGUAGES.map(l => (
                <label key={l} className={`filter-opt${selLang === l ? ' active' : ''}`}>
                  <input type="radio" name="lang" checked={selLang === l} onChange={() => setSelLang(selLang === l ? '' : l)} />
                  {l}
                </label>
              ))}
            </div>
          </div>

          <hr className="filter-divider" />

          <div className="filter-section">
            <div className="filter-title">Tags</div>
            <div className="filter-options">
              {TAGS.map(t => (
                <label key={t} className={`filter-opt${selTag === t ? ' active' : ''}`}>
                  <input type="radio" name="tag" checked={selTag === t} onChange={() => setSelTag(selTag === t ? '' : t)} />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <hr className="filter-divider" />

          <div className="filter-section">
            <div className="filter-title">Availability</div>
            <div className="filter-options">
              <label className={`filter-opt${selStock === 'in' ? ' active' : ''}`}>
                <input type="radio" name="stock" checked={selStock === 'in'} onChange={() => setSelStock(selStock === 'in' ? '' : 'in')} />
                In Stock
              </label>
              <label className={`filter-opt${selStock === 'out' ? ' active' : ''}`}>
                <input type="radio" name="stock" checked={selStock === 'out'} onChange={() => setSelStock(selStock === 'out' ? '' : 'out')} />
                Out of Stock
              </label>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="books-main">
          <div className="books-toolbar">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input className="search-input" type="text" placeholder="Search by title or author…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="results-count">{filtered.length} book{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="no-results">Loading books…</div>
          ) : filtered.length > 0 ? (
            <div className="books-grid-main">
              {filtered.map(b => <BookCard key={b.slug} book={b} />)}
            </div>
          ) : (
            <div className="no-results">No books found. <button onClick={clearFilters} style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}>Clear filters</button></div>
          )}
        </main>
      </div>
    </>
  );
}

export default function BooksPage() {
  return (
    <>
      <Navbar active="books" />
      <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>}>
        <BooksContent />
      </Suspense>
      <Footer />
    </>
  );
}
