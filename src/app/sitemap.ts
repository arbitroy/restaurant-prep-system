import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        '',
        '/dashboard',
        '/restaurants',
        '/items',
        '/sales',
        '/prep',
        '/reports',
    ];

    return routes.map((route) => ({
        url: `${siteConfig.siteUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
    }));
}