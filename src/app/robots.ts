import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/metadata';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/private/'],
        },
        sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
    };
}