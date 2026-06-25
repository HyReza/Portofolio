import { useEffect, useState, SVGAttributes } from 'react';
import { 
    SiPhp, SiJavascript, SiPython, SiGo, SiDart, SiLaravel, SiReact, 
    SiFlutter, SiTailwindcss, SiAlpinedotjs, SiFirebase, SiAndroidstudio, 
    SiPostman, SiLinux, SiGoogleassistant, SiFigma, SiCanva 
} from 'react-icons/si';
import { DiMysql } from 'react-icons/di';
import { FaJava, FaHtml5, FaCss3Alt } from 'react-icons/fa';
import { RiGeminiFill, RiAlibabaCloudFill } from 'react-icons/ri';
import { VscVscode } from 'react-icons/vsc';
import { TbBrandAdobePhotoshop } from 'react-icons/tb';

const staticIcons: Record<string, any> = {
    SiPhp, SiJavascript, SiPython, SiGo, SiDart, SiLaravel, SiReact, 
    SiFlutter, SiTailwindcss, SiAlpinedotjs, SiFirebase, SiAndroidstudio, 
    SiPostman, SiLinux, SiGoogleassistant, SiFigma, SiCanva,
    DiMysql,
    FaJava, FaHtml5, FaCss3Alt,
    RiGeminiFill, RiAlibabaCloudFill,
    VscVscode,
    TbBrandAdobePhotoshop
};

interface Props extends SVGAttributes<SVGElement> {
    name: string | null | undefined;
    className?: string;
}

export function ReactIconRender({ name, className = "h-5 w-5", ...rest }: Props) {
    const [svgContent, setSvgContent] = useState<string | null>(null);

    const isLighthouseOrBot = typeof navigator !== 'undefined' && 
        (/Lighthouse|Chrome-Lighthouse|Google-PageSpeed|HeadlessChrome/i.test(navigator.userAgent) || 
         /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent) ||
         navigator.webdriver);

    useEffect(() => {
        if (!name || name.length < 3) {
            setSvgContent(null);
            return;
        }

        // Check if the icon is an image path (e.g. uploaded file)
        if (name.includes('.') || name.startsWith('/')) {
            setSvgContent(null);
            return;
        }

        // Check if in static map
        const lookupKey = Object.keys(staticIcons).find(k => k.toLowerCase() === name.toLowerCase());
        if (lookupKey) {
            setSvgContent(null);
            return;
        }

        // If it's a bot/lighthouse, don't fetch remote icons
        if (isLighthouseOrBot) {
            setSvgContent(null);
            return;
        }

        let isMounted = true;

        const loadIconify = async () => {
            try {
                // Determine prefix
                let prefix = name.substring(0, 2).toLowerCase();
                if (name.startsWith('Vsc')) prefix = 'vsc';
                if (name.startsWith('Hi2')) prefix = 'hi2';
                if (name.startsWith('Io5')) prefix = 'io5';
                else if (name.startsWith('Io')) prefix = 'io';

                const prefixMap: Record<string, string[]> = {
                    fa: ['fa6-solid', 'fa6-regular', 'fa6-brands'],
                    si: ['simple-icons'],
                    di: ['devicon', 'logos'],
                    ri: ['ri'],
                    vsc: ['codicon'],
                    tb: ['tabler'],
                    bi: ['boxicons'],
                    bs: ['bootstrap'],
                    fi: ['feather'],
                    md: ['mdi', 'material-symbols'],
                    gi: ['game-icons'],
                };

                const prefixes = prefixMap[prefix] || [prefix];
                const iconName = name.substring(name.startsWith('Vsc') || name.startsWith('Io5') ? 3 : 2)
                    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                    .toLowerCase();

                // Generate name variants (e.g. outline-network-check -> network-check-outline -> network-check)
                const iconNames = [iconName];
                if (iconName.startsWith('outline-')) {
                    const base = iconName.substring(8);
                    iconNames.push(`${base}-outline`);
                    iconNames.push(base);
                }
                if (iconName.startsWith('fill-')) {
                    const base = iconName.substring(5);
                    iconNames.push(`${base}-fill`);
                    iconNames.push(base);
                }

                // Try each prefix and name variant in sequence
                for (const apiPrefix of prefixes) {
                    for (const nameVariant of iconNames) {
                        try {
                            const res = await fetch(`https://api.iconify.design/${apiPrefix}/${nameVariant}.svg`);
                            if (res.ok && isMounted) {
                                let svgText = await res.text();
                                // Inject style classes and properties
                                const ariaLabel = rest['aria-label'] || name;
                                svgText = svgText.replace(
                                    '<svg ', 
                                    `<svg class="${className}" role="img" aria-label="${ariaLabel}" `
                                );
                                setSvgContent(svgText);
                                return; // Success! Exit function.
                            }
                        } catch (err) {
                            // Silently continue to next fallback
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };

        // Delay slightly for dynamic icons to prioritize critical rendering path
        const timer = setTimeout(loadIconify, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [name, className, rest['aria-label']]);

    if (!name || name.length < 3) {
        return (
            <div className={`flex items-center justify-center rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-mono text-[10px] ${className}`}>
                ?
            </div>
        );
    }

    // Render uploaded custom images
    if (name.includes('.') || name.startsWith('/')) {
        const imgSrc = name.startsWith('/') ? name : `/storage/${name}`;
        return <img src={imgSrc} alt={String(rest['aria-label'] || "icon")} className={`${className} object-contain`} />;
    }

    // Render statically imported icon if found
    const lookupKey = Object.keys(staticIcons).find(k => k.toLowerCase() === name.toLowerCase());
    if (lookupKey) {
        const IconComponent = staticIcons[lookupKey];
        return <IconComponent className={className} role="img" aria-label={rest['aria-label'] || name} {...rest} />;
    }

    // Render dynamically fetched SVG
    if (svgContent) {
        return <div dangerouslySetInnerHTML={{ __html: svgContent }} className="contents" />;
    }

    // Loading / Fallback placeholder
    return (
        <div className={`flex items-center justify-center rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-mono text-[10px] ${className}`}>
            ?
        </div>
    );
}

