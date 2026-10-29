'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

type PageLinkProps = ComponentProps<'a'> & { href: string };

export function PageLink({ href, children, ...props }: PageLinkProps) {
  if (!href.startsWith('/') || href.startsWith('//')) {
    return <a href={href} {...props}>{children}</a>;
  }

  // Account and admin navigation must retain the shared auth provider and layouts.
  const persistent = href === '/account' || href.startsWith('/account/') || href === '/admin' || href.startsWith('/admin/');
  // Preserve existing non-account flows, including query-driven donation navigation.
  return <Link href={href} prefetch={false} {...props} onNavigate={event => {
    if (persistent) return;
    event.preventDefault();
    window.location.assign(href);
  }}>{children}</Link>;
}
