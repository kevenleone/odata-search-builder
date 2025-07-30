import { SearchBuilder } from "./SearchBuilder";

/**
 * SearchParser class provides functionality to parse OData filter expressions into SearchBuilder instances.
 * This allows converting existing OData filter strings into SearchBuilder objects for manipulation.
 *
 * @example
 * // Parse a simple filter
 * const searchBuilder = SearchParser.parse("name eq 'John' and age gt 30");
 *
 * console.log(searchBuilder.build()); // name eq 'John' and age gt 30
 *
 * // Parse a complex filter with grouping
 * const complexBuilder = SearchParser.parse("(firstName eq 'John' or firstName eq 'Jane') and age ge 25");
 * // Now you can continue building on top of the parsed expression
 * complexBuilder.and().contains('department', 'Sales').build();
 *
 * @author Keven Leone
 */
export class SearchParser {
    /**
     * Parses an OData filter expression into a SearchBuilder instance.
     * This method converts a string OData filter query into a SearchBuilder object
     * that can be further modified or executed.
     *
     * Supports parsing of:
     * - Comparison operators (eq, ne, gt, ge, lt, le)
     * - Logical operators (and, or, not)
     * - Grouping with parentheses
     * - String functions (contains, startswith, endswith)
     * - The 'in' operator
     *
     * @param filter - The OData filter expression to parse (e.g., "name eq 'John' and age gt 18")
     * @returns A SearchBuilder instance representing the parsed filter
     * @throws Error if the filter syntax is invalid or contains unsupported operations
     *
     * @example
     * // Parse a simple filter
     * const builder = SearchParser.parse("name eq 'John' and age gt 18");
     * console.log(builder.build()); // "name eq 'John' and age gt 18"
     *
     * @example
     * // Parse a complex filter with grouping and functions
     * const builder = SearchParser.parse("(status eq 'active' or status eq 'pending') and contains(name, 'Smith')");
     * console.log(builder.build()); // "(status eq 'active' or status eq 'pending') and contains(name, 'Smith')"
     *
     * @example
     * // Parse a filter and then modify it
     * const builder = SearchParser.parse("category eq 'books'");
     * builder.and().gt('price', 10);
     * console.log(builder.build()); // "category eq 'books' and price gt 10"
     *
     * @example
     * // Parse a filter with the 'in' operator
     * const builder = SearchParser.parse("status in ('active', 'pending', 'review')");
     * console.log(builder.build()); // "status in ('active', 'pending', 'review')"
     */
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
