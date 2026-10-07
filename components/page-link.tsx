'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

type PageLinkProps = ComponentProps<'a'> & { href: string };

export function PageLink({ href, children, ...props }: PageLinkProps) {
  if (!href.startsWith('/') || href.startsWith('//')) {
    return <a href={href} {...props}>{children}</a>;
  }

  // Preserve the existing document navigation and browser-local demo lifecycle.
  return <Link href={href} prefetch={false} {...props} onNavigate={event => {
    event.preventDefault();
    window.location.assign(href);
  }}>{children}</Link>;
}
