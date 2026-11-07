import type { Site } from '@/lib/content/types';
import { FacebookIcon, InstagramIcon, YoutubeIcon } from '@/components/icons/custom-icons';
import { Logo } from './logo';
import { FooterNav } from './footer-nav';

function Social({ href, label, children }: { href?: string; label: string; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="focus-ring flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-orange-500"
    >
      {children}
    </a>
  );
}

/** Dark-green site footer with brand, links, social icons and legal line. */
export function Footer({ site }: { site: Site }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-green-900 pb-24 text-white md:pb-0">
      <div className="container-x">
        <div className="flex flex-col items-center gap-6 py-8 lg:flex-row lg:justify-between lg:gap-8">
          <Logo src={site.logo} name={site.shortName} variant="dark" />
          <span aria-hidden="true" className="hidden h-10 w-px bg-white/30 lg:block" />
          <FooterNav />
          <span aria-hidden="true" className="hidden h-10 w-px bg-white/30 lg:block" />
          <div className="flex items-center gap-1">
            <Social href={site.social.youtube} label="YouTube">
              <YoutubeIcon size={24} />
            </Social>
            <Social href={site.social.facebook} label="Facebook">
              <FacebookIcon size={24} />
            </Social>
            <Social href={site.social.instagram} label="Instagram">
              <InstagramIcon size={24} />
            </Social>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/15 py-4 text-center text-sm text-white/90 md:flex-row md:text-left">
          <p>
            © {year} {site.name}. All Rights Reserved.
          </p>
          <p>{site.regNo}</p>
        </div>
      </div>
    </footer>
  );
}
