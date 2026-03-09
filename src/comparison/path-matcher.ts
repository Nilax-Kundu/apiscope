/**
 * Path matcher for templated OpenAPI paths
 * Supports basic regex-based matching for paths like /users/{id}
 */

interface PathRegex {
    template: string;
    regex: RegExp;
}

export class PathMatcher {
    private patterns: PathRegex[] = [];

    constructor(templates: string[]) {
        for (const template of templates) {
            // Convert /users/{id} -> /^\/users\/[^/]+$/
            const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = escaped.replace(/\\{[^/]+\\}/g, '[^/]+');
            this.patterns.push({
                template,
                regex: new RegExp(`^${pattern}$`)
            });
        }

        // Sort by specificity:
        // 1. Static segment count (descending)
        // 2. Parameter segment count (ascending)
        // 3. Length (descending)
        this.patterns.sort((a, b) => {
            const aSegs = a.template.split('/').filter(Boolean);
            const bSegs = b.template.split('/').filter(Boolean);

            const aStatic = aSegs.filter(s => !s.startsWith('{')).length;
            const bStatic = bSegs.filter(s => !s.startsWith('{')).length;
            if (aStatic !== bStatic) return bStatic - aStatic;

            const aParam = aSegs.filter(s => s.startsWith('{')).length;
            const bParam = bSegs.filter(s => s.startsWith('{')).length;
            if (aParam !== bParam) return aParam - bParam;

            return b.template.length - a.template.length;
        });
    }

    /**
     * Finds the best matching template for a raw path
     * Returns the template path if matched, otherwise undefined
     */
    match(rawPath: string): string | undefined {
        for (const { template, regex } of this.patterns) {
            if (regex.test(rawPath)) {
                return template;
            }
        }
        return undefined;
    }
}
