import { Link } from 'react-router-dom';

export function LogoMark({ className = 'size-10' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="dlm-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e7c77b" />
          <stop offset="1" stopColor="#c9a14a" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#0f1d42" />
      <path d="M32 11l17 6.5v12.5c0 10.5-7.3 18.8-17 22.5-9.7-3.7-17-12-17-22.5V17.5z" fill="url(#dlm-gold)" />
      <path d="M24.5 32.5l5.5 5.5 10-11" stroke="#0f1d42" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Brand lock-up. `tone="light"` for use on navy backgrounds. */
export function Logo({ to = '/', tone = 'dark' }) {
  const light = tone === 'light';
  return (
    <Link to={to} className="flex items-center gap-3 no-underline">
      <LogoMark className="size-10 shadow-sm rounded-[10px]" />
      <span className={`font-serif text-[1.15rem] font-semibold leading-tight ${light ? 'text-white' : 'text-navy-900'}`}>
        Digital Legacy
        <span className={`block font-sans text-[0.7rem] font-bold uppercase tracking-[0.2em] ${light ? 'text-gold' : 'text-gold-dark'}`}>
          Manager
        </span>
      </span>
    </Link>
  );
}
