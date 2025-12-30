# Development Tools Setup Guide

This project uses modern development tools to maintain code quality and automate workflows.

## 🛠️ Tools Overview

### 1. Prettier - Code Formatting

Automatically formats code to maintain consistent style across the project.

**Configuration:** `.prettierrc.json`

#### Usage:

```bash
# Format all files
npm run format

# Check if files are formatted
npm run format:check
```

### 2. ESLint - Code Linting

Identifies and fixes code quality issues and potential bugs.

**Configuration:** `eslint.config.js`

#### Usage:

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### 3. Commitlint - Commit Message Validation

Enforces conventional commit message format for better changelog generation.

**Configuration:** `commitlint.config.js`

#### Commit Message Format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, white-space)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes (maintenance tasks)
- `revert`: Revert a previous commit

#### Examples:

```bash
git commit -m "feat: add export to Excel functionality"
git commit -m "fix: resolve drag and drop issue on mobile"
git commit -m "docs: update installation instructions"
git commit -m "chore: update dependencies"
```

### 4. Husky - Git Hooks

Automatically runs checks before commits and pushes.

**Hooks configured:**

- **pre-commit**: Runs lint-staged (formats and lints staged files)
- **commit-msg**: Validates commit message format

### 5. Lint-Staged

Runs linters and formatters only on staged files for faster processing.

**Configuration:** In `package.json` under `lint-staged`

### 6. Standard-Version - Automated Versioning & Changelog

Automatically generates changelogs and manages semantic versioning based on commit messages.

**Configuration:** `.versionrc.json`

#### Usage:

**Automatic version bump (based on commits):**

```bash
npm run release
```

**Specific version bumps:**

```bash
# Patch release (1.2.0 → 1.2.1)
npm run release:patch

# Minor release (1.2.0 → 1.3.0)
npm run release:minor

# Major release (1.2.0 → 2.0.0)
npm run release:major
```

This will:

1. Analyze commit messages since last release
2. Bump version in `package.json`
3. Generate/update `CHANGELOG.md`
4. Create a git commit with the version bump
5. Create a git tag

**After running release command:**

```bash
# Push changes and tags
git push --follow-tags origin main
```

## 🔄 Workflow

### Daily Development

1. Make changes to code
2. Stage files: `git add .`
3. Commit with conventional format: `git commit -m "feat: your feature"`
   - Husky will automatically format and lint staged files
   - Commit message will be validated
4. Push changes: `git push`

### Creating a Release

1. Ensure all changes are committed
2. Run release command:
   ```bash
   npm run release        # Auto-detect version bump
   # or
   npm run release:patch  # For bug fixes
   npm run release:minor  # For new features
   npm run release:major  # For breaking changes
   ```
3. Review generated `CHANGELOG.md`
4. Push with tags:
   ```bash
   git push --follow-tags origin main
   ```
5. GitHub Actions will automatically publish to npm (if configured)

## 📋 Available Scripts

```bash
# Linting
npm run lint          # Check for linting errors
npm run lint:fix      # Fix linting errors automatically

# Formatting
npm run format        # Format all files
npm run format:check  # Check if files need formatting

# Testing (includes linting and formatting checks)
npm run test

# Versioning & Changelog
npm run release         # Auto version bump + changelog
npm run release:patch   # Patch version (1.0.0 → 1.0.1)
npm run release:minor   # Minor version (1.0.0 → 1.1.0)
npm run release:major   # Major version (1.0.0 → 2.0.0)
```

## 🚨 Common Issues

### Commit Message Rejected

**Error:** "commit message does not follow conventional format"

**Solution:** Use the correct format:

```bash
git commit -m "type: description"
# Example: git commit -m "fix: resolve issue with task sorting"
```

### Pre-commit Hook Fails

**Error:** Linting or formatting errors

**Solution:**

1. Fix errors manually or run: `npm run lint:fix`
2. Format code: `npm run format`
3. Stage fixed files: `git add .`
4. Try commit again

### Husky Not Working

**Solution:** Reinstall hooks

```bash
npm run prepare
```

## 🎯 Best Practices

1. **Write meaningful commit messages** that describe what and why
2. **Keep commits atomic** - one logical change per commit
3. **Run tests locally** before pushing: `npm run test`
4. **Use appropriate commit types** for automatic version bumping
5. **Review generated CHANGELOG** before publishing releases

## 📚 References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Standard Version](https://github.com/conventional-changelog/standard-version)
