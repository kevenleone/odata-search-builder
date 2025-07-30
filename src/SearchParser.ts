import { SearchBuilder } from "./SearchBuilder";

export class SearchParser {
    static parse(filter: string): SearchBuilder {
        const searchBuilder = new SearchBuilder();
        const tokens = this.tokenize(filter);

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i] as string;

            if (token === "and" || token === "or") {
                searchBuilder[token]();

                continue;
            }

            if (token === "(") {
                searchBuilder.openGroup();

                continue;
            }

            if (token === ")") {
                searchBuilder.closeGroup();

                continue;
            }

            // Function calls like contains(field, "value")
            const funcMatch = token.match(/^(\w+)\(([^,]+),\s*(.+)\)$/);

            if (funcMatch) {
                const [, fn, field, rawVal] = funcMatch;
                const value = this.parseValue(rawVal as string);
                (searchBuilder as any)[fn as any](field, value);

                continue;
            }

            const field = token;
            const operator = tokens[++i];

            if (!operator) {
                throw new Error(
                    `Expected operator after field '${field}', but got nothing`
                );
            }

            if (operator === "in") {
                const openParen = tokens[++i];
                if (openParen !== "(") {
                    throw new Error(
                        `Expected '(' after 'in' for field '${field}'`
                    );
                }

                const values: any[] = [];

                while (tokens[++i] !== ")") {
                    if (tokens[i] === ",") continue;

                    values.push(this.parseValue(tokens[i] as string));
                }

                searchBuilder.in(field, values);

                continue;
            }

            const rawValue = tokens[++i];

            if (!rawValue) {
                throw new Error(
                    `Expected value after operator '${operator}' for field '${field}'`
                );
            }

            const value = this.parseValue(rawValue);

            if (["eq", "ne", "gt", "lt", "ge", "le"].includes(operator)) {
                searchBuilder[operator as keyof typeof searchBuilder](
                    field,
                    value
                );
                continue;
            }

            throw new Error(
                `Unsupported operator: ${operator} at token ${JSON.stringify(
                    tokens[i]
                )}`
            );
        }

        return searchBuilder;
    }

    private static parseInList(raw: string): any[] {
        const list = raw.trim().replace(/^\(/, "").replace(/\)$/, "");

        return list.split(",").map((token) => this.parseValue(token.trim()));
    }

    private static parseValue(token: string): any {
        if (/^['"]/.test(token)) {
            return token.slice(1, -1);
        }

        if (!isNaN(+token)) {
            return +token;
        }

        return token;
    }

    private static tokenize(input: string): string[] {
        const tokens: string[] = [];

        const regex =
            /\b(?:contains|startswith|endswith)\s*\(([^)]+)\)|\b(?:and|or|in|eq|ne|gt|ge|lt|le)\b|\(|\)|'[^']*'|[^\s()]+/g;

        let match: RegExpExecArray | null;

        while ((match = regex.exec(input)) !== null) {
            tokens.push(match[0]);
        }

        return tokens;
    }
}
