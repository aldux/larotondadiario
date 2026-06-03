export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://larotondadiario.vercel.app';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
