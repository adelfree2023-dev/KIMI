import { z } from 'zod';

/**
 * Zod schema for template.config.json
 */
export const TemplateConfigSchema = z.object({
    $schema: z.string().optional(),
    name: z.string().regex(/^[a-z0-9-]+$/, 'Template name must be kebab-case'),
    displayName: z.string().min(1).max(100),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (x.y.z)'),
    description: z.string().max(500),
    category: z.enum(['fashion', 'tech', 'food', 'general']),
    tags: z.array(z.string()).optional(),

    author: z.object({
        name: z.string(),
        email: z.string().email(),
    }),

    preview: z.object({
        image: z.string(),
        demoUrl: z.string().url().optional(),
    }),

    features: z.object({
        pages: z.object({
            home: z.boolean(),
            productListing: z.boolean(),
            productDetails: z.boolean(),
            cart: z.boolean(),
            checkout: z.boolean(),
            account: z.boolean().optional(),
            orders: z.boolean().optional(),
            wishlist: z.boolean().optional(),
            search: z.boolean().optional(),
            blog: z.boolean().optional(),
            compare: z.boolean().optional(),
        }),
        widgets: z.object({
            megaMenu: z.boolean().optional(),
            quickView: z.boolean().optional(),
            newsletterPopup: z.boolean().optional(),
            cookieConsent: z.boolean().optional(),
            whatsappFloat: z.boolean().optional(),
            smartFilters: z.boolean().optional(),
        }).optional(),
        integrations: z.object({
            stripe: z.boolean().optional(),
            codPayment: z.boolean().optional(),
            googleAnalytics: z.boolean().optional(),
            facebookPixel: z.boolean().optional(),
        }).optional(),
    }),

    requirements: z.object({
        apexVersion: z.string(),
        node: z.string().optional(),
        packages: z.record(z.string()).optional(),
    }),

    locales: z.array(z.string()),
    rtlSupport: z.boolean(),

    customization: z.object({
        fonts: z.array(z.string()).optional(),
        colorSchemes: z.array(z.string()).optional(),
        layouts: z.array(z.string()).optional(),
    }).optional(),
});

/**
 * TypeScript type inferred from TemplateConfigSchema
 */
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
