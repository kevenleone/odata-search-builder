# OData Search Builder

A lightweight and flexible TypeScript library for building and parsing OData filter queries. This library provides both a fluent API for constructing OData filter expressions and a powerful parser for converting existing OData filter strings into SearchBuilder instances that can be further modified or executed.

## Installation

```bash
npm install odata-search-builder
# or
yarn add odata-search-builder
# or
bun add odata-search-builder
```

## Usage

### Building OData Queries

```typescript
import { SearchBuilder } from 'odata-search-builder';

// Create a new instance
const searchBuilder = new SearchBuilder();

// Build a simple query
const filter = searchBuilder
  .eq('name', 'Miguel')
  .and()
  .gt('age', 18)
  .build();

console.log(filter); // name eq 'Miguel' and age gt 18

// Build a more complex query with grouping
const complexFilter = new SearchBuilder()
  .openGroup()
    .eq('firstName', 'Debora')
    .or()
    .eq('firstName', 'Miguel')
  .closeGroup()
  .and()
  .openGroup()
    .ge('age', 30)
    .and()
    .le('age', 18)
  .closeGroup()
  .build();

console.log(complexFilter); // (firstName eq 'Debora' or firstName eq 'Miguel') and (age ge 30 and age le 18)

// Using the any operator for collections
const anyQuery = new SearchBuilder()
  .any('tags', { operator: 'eq', value: 'important' })
  .build();

console.log(anyQuery); // (tags/any(x:(x eq 'important'))
```

### Parsing OData Queries

You can also parse existing OData filter strings into SearchBuilder instances:

```typescript
import { SearchParser } from 'odata-search-builder';

// Parse a simple filter
const searchBuilder = SearchParser.parse("name eq 'John' and age gt 30");
console.log(searchBuilder.build()); // name eq 'John' and age gt 30

// Parse and then modify a filter
const parsedBuilder = SearchParser.parse("name eq 'John'");
parsedBuilder.and().contains('department', 'Sales');
console.log(parsedBuilder.build()); // name eq 'John' and contains(department, 'Sales')

// Parse a complex filter with grouping
const complexBuilder = SearchParser.parse("(firstName eq 'John' or firstName eq 'Jane') and age ge 25");
// Add more conditions to the parsed builder
complexBuilder.and().in('status', ['Active', 'Pending']);
console.log(complexBuilder.build()); 
// (firstName eq 'John' or firstName eq 'Jane') and age ge 25 and status in ('Active','Pending')
```

#### Query Building

- `build()`: Builds and returns the OData filter query string.
- `clone()`: Creates a copy of the current SearchBuilder instance.
- `and()`: Adds the 'and' operator to the query.
- `or()`: Adds the 'or' operator to the query.
- `not()`: Adds the 'not' operator to the query.
- `openGroup()`: Adds an opening parenthesis to the query.
- `closeGroup()`: Adds a closing parenthesis to the query.

#### Comparison Operators

- `eq(field: string, value: Value)`: Equality operator (==).
- `ne(field: string, value: Value)`: Inequality operator (!=).
- `gt(field: string, value: Value)`: Greater than operator (>).
- `lt(field: string, value: Value)`: Less than operator (<).
- `ge(field: string, value: Value)`: Greater than or equal operator (>=).
- `le(field: string, value: Value)`: Less than or equal operator (<=).
- `in(field: string, values: Value[])`: Checks if the field value is in the provided array.

#### String Functions

- `contains(field: string, value: Value)`: Checks if the field contains the specified value.
- `startswith(field: string, value: Value)`: Checks if the field starts with the specified value.
- `endswith(field: string, value: Value)`: Checks if the field ends with the specified value.

#### Collection Functions

- `any(field: string, options: { operator: Operators; value: Value })`: Applies the specified operator to any element in a collection.

### Static Methods

All comparison operators and string functions are also available as static methods:

```typescript
SearchBuilder.eq('name', 'Miguel'); // Returns: "name eq 'Miguel'"
```

### SearchParser

The `SearchParser` class provides powerful functionality to parse OData filter expressions into SearchBuilder instances, allowing you to convert existing OData filter strings into modifiable SearchBuilder objects. This is particularly useful when working with existing OData systems or when you need to parse user-provided filter strings.

#### Examples

```typescript
// Parse a simple filter
const searchBuilder = SearchParser.parse("name eq 'John' and age gt 30");
console.log(searchBuilder.build()); // name eq 'John' and age gt 30

// Parse a complex filter with grouping and logical operators
const complexBuilder = SearchParser.parse("(firstName eq 'John' or firstName eq 'Jane') and not (age lt 25)");
console.log(complexBuilder.build()); // (firstName eq 'John' or firstName eq 'Jane') and not (age lt 25)
```

## License

See [LICENSE.md](./LICENSE.md) for details.
