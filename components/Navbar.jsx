import Link from 'next/link';
import Image from 'next/image';

export default function Navbar({ active = '' }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <Image src="/logo.png" alt="Maktabah An Noor" width={48} height={48} style={{ height: 48, width: 'auto' }} />
          <div className="nav-logo-text">
            <div className="nav-logo-en">Maktabah An Noor</div>
            <span className="nav-logo-tag">Books That Illuminate The Heart</span>
          </div>
        </Link>
        <div className="nav-links">
          <Link href="/"      className={`nav-link${active === 'home'  ? ' active' : ''}`}>Home</Link>
          <Link href="/books" className={`nav-link${active === 'books' ? ' active' : ''}`}>All Books</Link>
        </div>
        <Link href="/books" className="nav-cta">Browse Collection →</Link>
      </div>
    </nav>
  );
}
