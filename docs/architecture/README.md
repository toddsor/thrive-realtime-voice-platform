# Architecture

The Thrive Realtime Voice Platform is built as a TypeScript monorepo with a modular architecture.

## Core Concepts

- [Design Principles](./design-principles.md) - Core architectural patterns and rules
- [Package Architecture](./packages.md) - Detailed package documentation and relationships
- [Multi-App Pattern](./multi-app-pattern.md) - Building multiple independent applications

## Key Design Decisions

1. **Monorepo Structure** - All packages in one repository for easier development
2. **Contract-Based Design** - Core interfaces in `@thrivereflections/realtime-contracts`
3. **Transport Abstraction** - Support for multiple transport protocols
4. **Independent Applications** - Each app can extend the base schema differently
