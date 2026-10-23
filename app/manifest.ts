import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pushtidham Haveli USA', short_name: 'Pushtidham',
    description: 'Support daily seva, general donations and Utsav offerings at Pushtidham Haveli USA.',
    start_url: '/', scope: '/', display: 'standalone', lang: 'en',
    theme_color: '#092f23', background_color: '#fbf5e9',
    icons: [
      { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/pwa/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/pwa/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
