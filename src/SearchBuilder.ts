/**
 * Options for the 'any' operator that applies a condition to elements in a collection
 * @example
 * // Find items where any tag equals 'important'
 * builder.any('tags', { operator: 'eq', value: 'important' })
 */
type AnyOptions = { operator: Operators; value: Value };

/**
 * Supported value types for OData filter conditions
 * @example
 * // Examples of valid values:
 * const boolValue: Value = true;
 * const numValue: Value = 42;
 * const strValue: Value = "example";
 * const dateValue: Value = new Date();
 */
export type Value = boolean | number | string | Date;

/**
 * Supported OData filter operators
 * @example
 * // Using different operators:
 * builder.eq('name', 'John'); // name eq 'John'
 * builder.gt('age', 18);      // age gt 18
 * builder.contains('description', 'important'); // contains(description, 'important')
 */
export type Operators =
    | "contains" // String contains substring
    | "eq" // Equal to
    | "ge" // Greater than or equal to
    | "gt" // Greater than
    | "lambda" // Lambda expression (for collections)
    | "le" // Less than or equal to
    | "lt" // Less than
    | "ne" // Not equal to
    | "startsWith"; // String starts with substring

/**
 * Formats a value according to OData syntax rules
 * - Strings are wrapped in single quotes with proper escaping
 * - Dates are converted to ISO strings
 * - Other values are converted to strings
 * @param value The value to format
 * @returns Formatted value string ready for OData query
 * @example
 * formatValue("John's data") // "'John''s data'" (note the escaped single quote)
 * formatValue(new Date("2023-01-01")) // "2023-01-01T00:00:00.000Z"
 * formatValue(42) // "42"
 */
function formatValue(value: Value): string {
    if (typeof value === "string") {
        return `'${value.replace(/'/g, "''")}'`;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    return String(value);
}

/**
 * A builder class for creating OData filter expressions with a fluent API
 *
 * @author Keven Leone
 * @example
 * // Basic usage:
 * const query = new SearchBuilder()
 *   .eq('name', 'John')
 *   .and()
 *   .gt('age', 18)
 *   .build();
 * // Result: "name eq 'John' and age gt 18"
 *
 * @example
 * // Complex query with grouping:
 * const query = new SearchBuilder()
 *   .openGroup()
 *     .eq('status', 'active')
 *     .or()
 *     .eq('status', 'pending')
 *   .closeGroup()
 *   .and()
 *   .gt('createdDate', new Date('2023-01-01'))
 *   .build();
 * // Result: "(status eq 'active' or status eq 'pending') and createdDate gt 2023-01-01T00:00:00.000Z"
 */
export class SearchBuilder {
    /**
     * Array of query parts that will be joined to create the final OData filter expression
     * @private
     */
    private queryParts: string[] = [];

    /**
     * Adds a condition to the query parts array
     * @param condition The condition string to add
     * @returns The current SearchBuilder instance for method chaining
     * @private
     */
    private add(condition: string) {
        this.queryParts.push(condition);

        return this;
    }

    /**
     * Creates a copy of the current SearchBuilder instance
     * @returns A new SearchBuilder instance with the same query parts
     * @example
     * const baseQuery = new SearchBuilder().eq('status', 'active');
     *
     * // Create two different queries from the base query
     * const userQuery = baseQuery.clone().and().eq('type', 'user');
     * const adminQuery = baseQuery.clone().and().eq('type', 'admin');
     */
    public clone(): SearchBuilder {
        const clone = new SearchBuilder();

        clone.queryParts = [...this.queryParts];

        return clone;
    }

    /**
     * Builds and returns the complete OData filter expression
     * @returns The OData filter expression as a string
     * @example
     * const filter = new SearchBuilder()
     *   .eq('name', 'John')
     *   .and()
     *   .gt('age', 18)
     *   .build();
     *
     * console.log(filter); // "name eq 'John' and age gt 18"
     *
     * // Use with OData endpoint
     * fetch(`https://api.example.com/users?$filter=${encodeURIComponent(filter)}`)
     */
    public build(): string {
        return this.queryParts.join(" ");
    }

    /**
     * Adds the 'and' logical operator to the query
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .eq('firstName', 'John')
     *   .and()
     *   .eq('lastName', 'Doe')
     *   .build();
     * // Result: "firstName eq 'John' and lastName eq 'Doe'"
     */
    public and() {
        return this.add("and");
    }

    /**
     * Adds the 'not' logical operator to the query
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .not()
     *   .eq('status', 'inactive')
     *   .build();
     * // Result: "not status eq 'inactive'"
     */
    public not() {
        return this.add("not");
    }

    /**
     * Adds the 'or' logical operator to the query
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .eq('status', 'active')
     *   .or()
     *   .eq('status', 'pending')
     *   .build();
     * // Result: "status eq 'active' or status eq 'pending'"
     */
    public or() {
        return this.add("or");
    }

    /**
     * Adds an opening parenthesis to the query for grouping conditions
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .openGroup()
     *     .eq('status', 'active')
     *     .or()
     *     .eq('status', 'pending')
     *   .closeGroup()
     *   .and()
     *   .gt('priority', 3)
     *   .build();
     * // Result: "(status eq 'active' or status eq 'pending') and priority gt 3"
     */
    public openGroup() {
        return this.add("(");
    }

    /**
     * Adds a closing parenthesis to the query for grouping conditions
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * // See example in openGroup()
     */
    public closeGroup() {
        return this.add(")");
    }

    /**
     * Applies a condition to any element in a collection
     * @param field The collection field name
     * @param options The operator and value to apply to collection elements
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .any('tags', { operator: 'eq', value: 'important' })
     *   .build();
     * // Result: "(tags/any(x:(x eq 'important')))"
     *
     * @example
     * // Find products where any category contains 'electronics'
     * const query = new SearchBuilder()
     *   .any('categories', { operator: 'contains', value: 'electronics' })
     *   .build();
     */
    public any(field: string, options: AnyOptions) {
        return SearchBuilder.any(field, options);
    }

    /**
     * Adds an equality condition to the query
     * @param field The field name
     * @param value The value to compare against
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .eq('name', 'John')
     *   .build();
     * // Result: "name eq 'John'"
     */
    public eq(field: string, value: Value) {
        return this.add(SearchBuilder.eq(field, value));
    }

    /**
     * Adds a not-equal condition to the query
     * @param field The field name
     * @param value The value to compare against
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .ne('status', 'inactive')
     *   .build();
     * // Result: "status ne 'inactive'"
     */
    public ne(field: string, value: Value) {
        return this.add(SearchBuilder.ne(field, value));
    }

    /**
     * Adds a greater-than condition to the query
     * @param field The field name
     * @param value The value to compare against
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .gt('age', 18)
     *   .build();
     * // Result: "age gt 18"
     *
     * @example
     * // Find items created after a specific date
     * const query = new SearchBuilder()
     *   .gt('createdDate', new Date('2023-01-01'))
     *   .build();
     */
    public gt(field: string, value: Value) {
        return this.add(SearchBuilder.gt(field, value));
    }

    /**
     * Adds a less-than condition to the query
     * @param field The field name
     * @param value The value to compare against
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .lt('price', 100)
     *   .build();
     * // Result: "price lt 100"
     */
    public lt(field: string, value: Value) {
        return this.add(SearchBuilder.lt(field, value));
    }

    /**
     * Adds a greater-than-or-equal condition to the query
     * @param field The field name
     * @param value The value to compare against
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .ge('rating', 4)
     *   .build();
     * // Result: "rating ge 4"
     */
    public ge(field: string, value: Value) {
        return this.add(SearchBuilder.ge(field, value));
    }

    /**
     * Adds a less-than-or-equal condition to the query
     * @param field The field name
     * @param value The value to compare against
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .le('price', 50)
     *   .build();
     * // Result: "price le 50"
     */
    public le(field: string, value: Value) {
        return this.add(SearchBuilder.le(field, value));
    }

    /**
     * Adds an 'in' condition to check if a field value is in a set of values
     * @param field The field name
     * @param values Array of values to check against
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .in('status', ['active', 'pending'])
     *   .build();
     * // Result: "status in ('active', 'pending')"
     *
     * @example
     * // Find users with specific IDs
     * const query = new SearchBuilder()
     *   .in('id', [1, 2, 3])
     *   .build();
     */
    public in(field: string, values: Value[]) {
        return this.add(SearchBuilder.in(field, values));
    }

    /**
     * Adds a 'contains' condition to check if a string field contains a substring
     * @param field The field name
     * @param value The substring to check for
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .contains('description', 'important')
     *   .build();
     * // Result: "contains(description, 'important')"
     */
    public contains(field: string, value: Value) {
        return this.add(SearchBuilder.contains(field, value));
    }

    /**
     * Adds a 'startswith' condition to check if a string field starts with a substring
     * @param field The field name
     * @param value The substring to check for
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .startswith('name', 'J')
     *   .build();
     * // Result: "startswith(name, 'J')"
     */
    public startswith(field: string, value: Value) {
        return this.add(SearchBuilder.startswith(field, value));
    }

    /**
     * Adds an 'endswith' condition to check if a string field ends with a substring
     * @param field The field name
     * @param value The substring to check for
     * @returns The current SearchBuilder instance for method chaining
     * @example
     * const query = new SearchBuilder()
     *   .endswith('email', 'example.com')
     *   .build();
     * // Result: "endswith(email, 'example.com')"
     */
    public endswith(field: string, value: Value) {
        return this.add(SearchBuilder.endswith(field, value));
    }

    // These methods return the condition string without adding it to query parts

    /**
     * Creates an 'any' condition string for a collection
     * @param field The collection field name
     * @param options The operator and value to apply to collection elements
     * @returns The condition string
     * @example
     * const condition = SearchBuilder.any('tags', { operator: 'eq', value: 'important' });
     * console.log(condition); // "(tags/any(x:(x eq 'important')))"
     */
    static any(field: string, options: AnyOptions) {
        const fn = SearchBuilder[
            options.operator as keyof typeof SearchBuilder
        ] as any;

        if (!fn) {
            throw new Error("Invalid operator");
        }

        return `(${field}/any(x:(${fn("x", options.value)}))`;
    }

    /**
     * Creates an equality condition string
     * @param field The field name
     * @param value The value to compare against
     * @returns The condition string
     * @example
     * const condition = SearchBuilder.eq('name', 'John');
     * console.log(condition); // "name eq 'John'"
     */
    static eq(field: string, value: Value) {
        return `${field} eq ${formatValue(value)}`;
    }

    /**
     * Creates a not-equal condition string
     * @param field The field name
     * @param value The value to compare against
     * @returns The condition string
     * @example
     * const condition = SearchBuilder.ne('status', 'inactive');
     * console.log(condition); // "status ne 'inactive'"
     */
    static ne(field: string, value: Value) {
        return `${field} ne ${formatValue(value)}`;
    }

    /**
     * Creates a greater-than condition string
     * @param field The field name
     * @param value The value to compare against
     * @returns The condition string
     * @example
     * const condition = SearchBuilder.gt('age', 18);
     * console.log(condition); // "age gt 18"
     */
    static gt(field: string, value: Value) {
        return `${field} gt ${formatValue(value)}`;
    }

    /**
     * Creates a less-than condition string
     * @param field The field name
     * @param value The value to compare against
     * @returns The condition string
     * @example
     * const condition = SearchBuilder.lt('price', 100);
     * console.log(condition); // "price lt 100"
     */
    static lt(field: string, value: Value) {
        return `${field} lt ${formatValue(value)}`;
    }

    /**
     * Creates a greater-than-or-equal condition string
     * @param field The field name
     * @param value The value to compare against
     * @returns The condition string
     * @example
     * const condition = SearchBuilder.ge('rating', 4);
     * console.log(condition); // "rating ge 4"
     */
    static ge(field: string, value: Value) {
        return `${field} ge ${formatValue(value)}`;
    }

    /**
     * Creates a less-than-or-equal condition string
     * @param field The field name
     * @param value The value to compare against
     * @returns The condition string
     * @example
     * const condition = SearchBuilder.le('price', 50);
     * console.log(condition); // "price le 50"
     */
    static le(field: string, value: Value) {
        return `${field} le ${formatValue(value)}`;
    }

    /**
     * Creates an 'in' condition string to check if a field value is in a set of values
     * @param field The field name
     * @param values Array of values to check against
     * @returns The condition string
     * @throws Error if values is not an array
     * @example
     * const condition = SearchBuilder.in('status', ['active', 'pending']);
     * console.log(condition); // "status in ('active', 'pending')"
     */
    static in(field: string, values: Value[]) {
        if (!Array.isArray(values)) {
            throw new Error(`'in' requires array`);
        }

        return `${field} in (${values.map(formatValue).join(", ")})`;
    }

    /**
     * Creates a 'contains' condition string to check if a string field contains a substring
     * @param field The field name
     * @param value The substring to check for
     * @returns The condition string
     * @example
     * const condition = SearchBuilder.contains('description', 'important');
     * console.log(condition); // "contains(description, 'important')"
     */
    static contains(field: string, value: Value) {
        return `contains(${field}, ${formatValue(value)})`;
    }

    /**
     * Creates a 'startswith' condition string to check if a string field starts with a substring
     * @param field The field name
     * @param value The substring to check for
     * @returns The condition string
     * @example
     * const condition = SearchBuilder.startswith('name', 'J');
     * console.log(condition); // "startswith(name, 'J')"
     */
    static startswith(field: string, value: Value) {
        return `startswith(${field}, ${formatValue(value)})`;
    }

    /**
     * Creates an 'endswith' condition string to check if a string field ends with a substring
     * @param field The field name
     * @param value The substring to check for
     * @returns The condition string
     * @example
     * const condition = SearchBuilder.endswith('email', 'example.com');
     * console.log(condition); // "endswith(email, 'example.com')"
     */
    static endswith(field: string, value: Value) {
        return `endswith(${field}, ${formatValue(value)})`;
    }
}
