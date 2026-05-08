import { Head } from '@inertiajs/react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AboutHero } from '@/components/about/AboutHero';
import { AboutSkills } from '@/components/about/AboutSkills';
import { AboutEducation } from '@/components/about/AboutEducation';
import { AboutCareer } from '@/components/about/AboutCareer';
import { AboutOrganizations } from '@/components/about/AboutOrganizations';
import { AboutAchievements } from '@/components/about/AboutAchievements';

interface Profile { key: string; value_id: string | null; value_en: string | null; }
interface Education { id: number; institution: string; institution_en: string | null; degree: string | null; degree_en: string | null; field: string | null; field_en: string | null; gpa: string | null; start_date: string; end_date: string | null; description_id: string | null; description_en: string | null; activities_id: string | null; activities_en: string | null; logo: string | null; type: string; }
interface Career { id: number; company: string; company_en: string | null; position_id: string | null; position_en: string | null; start_date: string; end_date: string | null; description_en: string | null; description_id: string | null; logo: string | null; is_current: boolean; children: Career[]; }
interface Skill { id: number; name_id: string; name_en: string; icon: string | null; description_id?: string | null; description_en?: string | null; }
interface SkillCategory { id: number; name_en: string; name_id: string; skills: Skill[]; }
interface Achievement { id: number; title_en: string; title_id: string; description_en: string | null; description_id: string | null; date: string | null; type: string; }
interface Organization { id: number; name: string; name_en: string | null; role: string; role_en: string | null; start_date: string; end_date: string | null; description_id: string | null; description_en: string | null; logo: string | null; is_current: boolean; }
interface Props { profiles: Record<string, Profile>; educations: Education[]; careers: Career[]; skillCategories: SkillCategory[]; achievements: Achievement[]; organizations: Organization[]; }

export default function About({ profiles, educations, careers, skillCategories, achievements, organizations }: Props) {
    const { lang, t } = useApp();
    const pv = (key: string) => lang === 'id' ? (profiles[key]?.value_id || profiles[key]?.value_en || '') : (profiles[key]?.value_en || profiles[key]?.value_id || '');

    const pageTitle = pv('about_page_title') || t('About Me', 'Tentang Saya');

    // JSON-LD Schema
    const skillsSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Skills & Expertise",
        "description": "Technical and non-technical professional skills.",
        "itemListElement": skillCategories.flatMap((cat, cIdx) =>
            cat.skills.map((s, sIdx) => ({
                "@type": "ListItem",
                "position": cIdx * 100 + sIdx + 1,
                "item": { "@type": "DefinedTerm", "name": s.name_en || s.name_id, "inDefinedTermSet": cat.name_en || cat.name_id }
            }))
        )
    };

    return (
        <PublicLayout>
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={pv('about_page_bio') || pv('bio') || ''} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(skillsSchema) }} />
            </Head>

            <AboutHero profiles={profiles} />
            <AboutSkills skillCategories={skillCategories} />
            <AboutEducation educations={educations} />
            <AboutCareer careers={careers} />
            <AboutOrganizations organizations={organizations} />
            <AboutAchievements achievements={achievements} />
        </PublicLayout>
    );
}
