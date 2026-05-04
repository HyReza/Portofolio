import { Head, usePage } from '@inertiajs/react';
import { useApp } from '@/hooks/useApp';

interface SeoMeta {
    meta_title_id?: string | null;
    meta_title_en?: string | null;
    meta_description_id?: string | null;
    meta_description_en?: string | null;
    og_image?: string | null;
    schema_markup?: Record<string, any> | null;
}

interface Props {
    title: string;
    description?: string;
    keywords?: string;
    author?: string;
    url?: string;
    type?: string;
    image?: string | null;
    seoMeta?: SeoMeta | null;
    schemaMarkup?: Record<string, any> | null;
}

export function SeoHead({ title, description, keywords, author, url, type, image, seoMeta, schemaMarkup }: Props) {
    const { lang } = useApp();
    const { props } = usePage<{ siteProfile?: Record<string, { value_id: string | null; value_en: string | null }> }>();
    const sp = props.siteProfile || {};
    const pv = (key: string) => lang === 'id' ? (sp[key]?.value_id || sp[key]?.value_en || '') : (sp[key]?.value_en || sp[key]?.value_id || '');

    const profileName = pv('name') || 'Reza Edi Saputra';

    const finalTitle = (lang === 'id' ? seoMeta?.meta_title_id : seoMeta?.meta_title_en) || title;
    const finalDescription = (lang === 'id' ? seoMeta?.meta_description_id : seoMeta?.meta_description_en) || description || '';
    const finalImage = seoMeta?.og_image ? `/storage/${seoMeta.og_image}` : (image || '/assets/img/og-default.jpg');
    
    // Fallback to provided props or common defaults
    const finalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const finalType = type || 'website';
    const finalAuthor = author || pv('meta_author') || profileName;
    const siteName = pv('meta_site_title') || `${profileName} Portfolio`;

    const finalSchema = schemaMarkup || seoMeta?.schema_markup;

    return (
        <Head>
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            {keywords && <meta name="keywords" content={keywords} />}
            <meta name="author" content={finalAuthor} />
            <link rel="canonical" href={finalUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={finalType} />
            <meta property="og:url" content={finalUrl} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={finalImage} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={finalUrl} />
            <meta property="twitter:title" content={finalTitle} />
            <meta property="twitter:description" content={finalDescription} />
            <meta property="twitter:image" content={finalImage} />

            {/* JSON-LD Schema */}
            {finalSchema && (
                <script type="application/ld+json">
                    {JSON.stringify(finalSchema)}
                </script>
            )}
        </Head>
    );
}

