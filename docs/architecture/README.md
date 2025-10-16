# Architecture

The Thrive Realtime Voice Platform is built as a TypeScript monorepo with a modular architecture.

## Core Concepts

- [Architecture Overview](./overview.md) - High-level system design
- [Package Structure](./packages.md) - How packages are organized
- [Data Flow](./data-flow.md) - How data moves through the system
- [Multi-App Pattern](./multi-app-pattern.md) - Building multiple applications

## Key Design Decisions

1. **Monorepo Structure** - All packages in one repository for easier development
2. **Contract-Based Design** - Core interfaces in `@thrive/realtime-contracts`
3. **Transport Abstraction** - Support for multiple transport protocols
4. **Independent Applications** - Each app can extend the base schema differently
