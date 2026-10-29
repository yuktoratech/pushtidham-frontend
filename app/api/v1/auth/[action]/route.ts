import {proxyAuth} from '../../../../../lib/auth-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request, context: {params: Promise<{action: string}>}) {
  const {action} = await context.params;
  return proxyAuth(request, action, process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_API_URL);
}

export {handle as GET, handle as POST, handle as PATCH};
