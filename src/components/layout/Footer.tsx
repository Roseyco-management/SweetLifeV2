'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail } from 'lucide-react';
import { PUBLIC_BUSINESS_FACTS } from '@/lib/businessFacts';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-stone-200 pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Image
                src="/SweetLifeLogoWeb3.png"
                alt="Sweet Life Logo"
                width={160}
                height={64}
                className="h-16 w-auto"
              />
            </div>
            <p className="mb-4">
              A unique South Korean-style café offering creative and indulgent foods made fresh to order.
            </p>
            <div className="text-sm text-stone-400">
              {PUBLIC_BUSINESS_FACTS.footer.socialProfiles}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-primary transition-colors">Menu</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/sushi" className="hover:text-primary transition-colors">Sushi</Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-primary transition-colors">Bookings</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin size={18} className="mt-0.5 mr-3 text-primary flex-shrink-0" />
                <a
                  href="https://maps.google.com/?q=12+Monaghan+St,+Newry+BT35+6AA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  12 Monaghan St, Newry BT35 6AA
                </a>
              </li>
              <li className="flex items-start">
                <Phone size={18} className="mt-0.5 mr-3 text-primary flex-shrink-0" />
                <span>{PUBLIC_BUSINESS_FACTS.footer.phone}</span>
              </li>
              <li className="flex items-start">
                <Mail size={18} className="mt-0.5 mr-3 text-primary flex-shrink-0" />
                <a
                  href="mailto:info@sweetlife.cafe"
                  className="hover:text-primary transition-colors"
                >
                  info@sweetlife.cafe
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Opening Hours</h3>
            <div className="bg-stone-800 px-3 py-2 rounded-lg border border-stone-700 text-center">
              <p className="text-stone-300">{PUBLIC_BUSINESS_FACTS.footer.hours}</p>
              <p className="mt-2 text-sm text-stone-400">Please check with the café before travelling.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-700 mt-12 pt-8 text-center text-stone-400">
          <p>&copy; {currentYear} Sweet Life Ireland. All rights reserved.</p>
          {/* Subtle hidden blog button */}
          <Link
            href="/blog"
            className="fixed bottom-4 left-4 opacity-30 hover:opacity-80 transition-opacity z-50"
            style={{ pointerEvents: 'auto' }}
            aria-label="SweetLife Blog"
          >
            {/* Book icon SVG */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20"/><path d="M6.5 7v10"/><rect x="2" y="2" width="20" height="20" rx="2.5"/></svg>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
