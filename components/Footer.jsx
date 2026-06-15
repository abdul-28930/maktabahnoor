import Image from 'next/image';
import Link from 'next/link';
import { IG_URL, IG_HANDLE } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Image src="/logo.png" alt="Maktabah An Noor" width={52} height={52} className="footer-logo" />
          <p className="footer-tagline">&ldquo;Books That Illuminate The Heart&rdquo;</p>
        </div>
        <div className="footer-center">
          <div className="footer-ar">مكتبة النور</div>
          <p className="footer-copy">© {new Date().getFullYear()} Maktabah An Noor. All rights reserved.</p>
        </div>
        <div className="footer-links">
          <Link href="/"       className="footer-link">Home</Link>
          <Link href="/books"  className="footer-link">All Books</Link>
          <a href={IG_URL} target="_blank" rel="noreferrer" className="footer-link">{IG_HANDLE}</a>
        </div>
      </div>
    </footer>
  );
}
