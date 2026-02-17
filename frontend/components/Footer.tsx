
import Link from 'next/link';
import { Facebook, Twitter, Instagram, MessageCircle } from 'lucide-react';

export function Footer() {
  const sections = [
    {
      title: 'About',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contacts' },
        { label: 'Careers', href: '/jobs' }
      ]
    },
    {
      title: 'Catalog',
      links: [
        { label: 'Anime', href: '/catalog' },
        { label: 'Ongoing', href: '/ongoing' },
        { label: 'Movies', href: '/movies' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'FAQ', href: '/faq' },
        { label: 'Terms', href: '/terms' },
        { label: 'API', href: '/api-docs' }
      ]
    }
  ];
  
  return (
    <footer className="bg-bg-secondary border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
             <Link href="/" className="text-2xl font-bold text-white mb-4 block">
              <span className="text-accent-primary">Kitsu</span>Enterprise
            </Link>
            <p className="text-text-muted mb-6 max-w-sm">
              The next generation anime streaming platform. High quality, fast updates, and a community that cares.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, MessageCircle].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-2 rounded-full bg-bg-tertiary hover:bg-accent-primary hover:text-white text-text-muted transition-all"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-text-secondary hover:text-accent-primary transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-border pt-8 text-center text-sm text-text-muted">
          © {new Date().getFullYear()} Kitsu Enterprise. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
