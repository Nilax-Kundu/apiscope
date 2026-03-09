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
            // 1. Escape special regex characters (minimal for paths)
            // 2. Replace {param} with [^/]+
            const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = escaped.replace(/\\{[^/]+\\}/g, '[^/]+');
            this.patterns.push({
                template,
                regex: new RegExp(`^${pattern}$`)
            });
        }
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
