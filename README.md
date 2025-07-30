# OData Search Builder

A lightweight and flexible TypeScript library for building OData filter queries.

## Installation

```bash
npm install odata-search-builder
# or
yarn add odata-search-builder
# or
bun add odata-search-builder
```

## Usage

```typescript
import SearchBuilder from 'odata-search-builder';

// Create a new instance
const builder = new SearchBuilder();

// Build a simple query
const simpleQuery = builder
  .eq('name', 'Miguel')
  .and()
  .gt('age', 18)
  .build();

console.log(simpleQuery); // name eq 'Miguel' and age gt 18

// Build a more complex query with grouping
const complexQuery = new SearchBuilder()
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

console.log(complexQuery); // (firstName eq 'Debora' or firstName eq 'Miguel') and (age ge 30 and age le 18)

// Using the any operator for collections
const anyQuery = new SearchBuilder()
  .any('tags', { operator: 'eq', value: 'important' })
  .build();

console.log(anyQuery); // (tags/any(x:(x eq 'important'))

// Using static methods
const staticQuery = SearchBuilder.eq('name', 'Miguel');

console.log(staticQuery); // name eq 'Miguel'
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

## Types

```typescript
type Value = boolean | number | string | Date;

type Operators =
  | "contains"
  | "eq"
  | "ge"
  | "gt"
  | "lambda"
  | "le"
  | "lt"
  | "ne"
  | "startsWith";
```

## License

See [LICENSE.md](./LICENSE.md) for details.

## Author

Keven Leone <keven.santos.sz@gmail.com>

## Repository

[GitHub Repository](https://github.com/kevenleone/odata-search-builder)
