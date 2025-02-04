import { Metadata } from 'next';

interface PageMetadata extends Metadata {
    robots?: string;
    category?: string;
}

export const siteConfig = {
    title: 'Restaurant Prep System',
    description: 'Modern restaurant preparation management system',
    defaultLocale: 'en',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://restaurant-prep-system.onrender.com',
    twitterHandle: '@restaurantprep',
} as const;

export const getDefaultMetadata = (path: string = ''): PageMetadata => ({
    metadataBase: new URL(siteConfig.siteUrl),
    title: {
        default: siteConfig.title,
        template: `%s | ${siteConfig.title}`
    },
    description: siteConfig.description,
    robots: 'index, follow',
    alternates: {
        canonical: `${siteConfig.siteUrl}${path}`
    },
    openGraph: {
        type: 'website',
        locale: siteConfig.defaultLocale,
        url: `${siteConfig.siteUrl}${path}`,
        title: siteConfig.title,
        description: siteConfig.description,
        siteName: siteConfig.title,
    },
    twitter: {
        card: 'summary_large_image',
        title: siteConfig.title,
        description: siteConfig.description,
        creator: siteConfig.twitterHandle
    }
});

export const getPageMetadata = (
    title: string,
    description?: string,
    path?: string,
    options: Partial<PageMetadata> = {}
): PageMetadata => ({
    ...getDefaultMetadata(path),
    title: title,
    description: description || siteConfig.description,
    openGraph: {
        ...getDefaultMetadata().openGraph,
        title: title,
        description: description || siteConfig.description,
        url: path ? `${siteConfig.siteUrl}${path}` : siteConfig.siteUrl
    },
    twitter: {
        ...getDefaultMetadata().twitter,
        title: title,
        description: description || siteConfig.description
    },
    ...options
});