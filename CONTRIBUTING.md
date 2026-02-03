# Contributing to opentui-gameboy

Thank you for your interest in contributing to `opentui-gameboy`. We welcome contributions that improve performance, add features, or fix bugs while maintaining our high standards for code quality and type safety.

## Standards and Guidelines

### 1. Type Safety
- **Strict Typing:** We enforce strict TypeScript rules. Do not use `any`. Use `unknown` or define specific interfaces/types for all data structures.
- **Type Checking:** Ensure your changes pass `bun run check` (tsc) before submitting.

### 2. Code Quality
- **Linting:** We use ESLint and Prettier to maintain a consistent code style. Your code must pass `bun run lint`.
- **Idiomatic Code:** Follow the established patterns in the codebase. Keep logic modular and separated (e.g., emulation vs. UI logic).

### 3. Testing
- **Coverage:** We aim for 100% unit test coverage for all files in the `src/` directory.
- **Framework:** Use Bun's native test runner (`bun test`).
- **Regression:** Ensure all existing tests pass before submitting a Pull Request.

## Development Workflow

### Setup

Requires [Bun](https://bun.sh/) installed on your system.

```bash
git clone https://github.com/user/opentui-gameboy.git
cd opentui-gameboy
bun install
```

### Branching

- Create a feature or bugfix branch from `main`.
- Use descriptive branch names: `feat/description` or `fix/description`.

### Essential Commands

- `bun run lint`: Run ESLint and Prettier checks.
- `bun run check`: Run TypeScript type checks.
- `bun run test`: Run the test suite.
- `bun run build`: Build the project and generate type declarations.
- `bun run preflight`: Run all the above commands to ensure release readiness.

## Pull Request Process

1. **Open an Issue:** For significant changes, please open an issue first to discuss the proposed implementation.
2. **Atomic Commits:** Keep commits focused and atomic.
3. **Documentation:** Update `README.md` if your changes introduce new features or change existing behavior.
4. **Verification:** Ensure `bun run preflight` passes locally before pushing your changes.

## Architecture Overview

- `src/emulator/`: Emulation engine logic (wrapping `serverboy`).
- `src/ui/`: Terminal rendering and UI components using `@opentui/core`.
- `src/utils/`: Shared utilities for color conversion and logging.
- `examples/`: Usage examples and demo ROMs.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
