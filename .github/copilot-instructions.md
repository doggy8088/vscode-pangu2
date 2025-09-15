# VS Code Extension: 盤古之白 (Pangu Spacing)

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Project Overview

This is a TypeScript VS Code extension that automatically adds proper spacing between Chinese/Japanese/Korean (CJK) characters and Western text, numbers, and symbols. The extension is published to VS Code Marketplace and supports both standalone text processing and integrated markdown processing using the remark ecosystem.

## Working Effectively

### Repository Structure
```
vscode-pangu2/
├── .github/
│   ├── workflows/           - CI/CD pipeline (ci.yml, release.yml)
│   └── copilot-instructions.md - This file
├── .vscode/                 - VS Code project settings  
├── src/                     - TypeScript source code
├── tests/                   - Sample test files (not automated tests)
├── out/                     - Build output (generated)
├── node_modules/           - Dependencies (generated)
├── images/                 - Documentation images
├── package.json            - Project manifest and dependencies
├── tsconfig.json          - TypeScript configuration
├── tslint.json            - Linting configuration
├── README.md              - Project documentation
├── CHANGELOG.md           - Version history
├── PUBLISH.md             - Release instructions  
├── DEBUG.md               - Debugging notes
├── NOTES.txt              - Development notes
├── LICENSE                - MIT license
└── icon.png               - Extension icon
```

### Bootstrap and Build Commands
- Install dependencies: `npm ci` -- takes 2-3 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- Development build: `npm run esbuild` -- takes 0.3 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- Production build: `npm run vscode:prepublish` -- takes 0.3 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- Package extension: `npx -y @vscode/vsce package --baseImagesUrl https://raw.githubusercontent.com/doggy8088/vscode-pangu/main/ --allow-star-activation` -- takes 12 seconds. NEVER CANCEL. Set timeout to 60+ seconds.

### Lint and Quality Checks
- Run linting: `npx tslint src/*.ts` -- takes 0.6 seconds. Shows warnings but does not fail. Set timeout to 30+ seconds.
- TypeScript compilation: `npm run test-compile` -- WILL FAIL due to type definition conflicts but this is expected and non-blocking.

### Development Workflow  
- Start development build: `npm run esbuild-watch` -- runs continuously for development.
- The extension uses esbuild for fast bundling, not traditional TypeScript compilation.
- Build output goes to `out/main.js` (368KB with sourcemap, 160KB minified).

## Validation and Testing

### Manual Extension Testing Scenarios
Since this project has no automated tests, you MUST manually validate extension functionality:

1. **Create a test file** with mixed CJK and Western text:
   ```markdown
   這是中文text混合English的測試123和符號@#$
   ```

2. **Expected result after pangu processing**:
   ```markdown
   這是中文 text 混合 English 的測試 123 和符號 @#$
   ```

3. **Test scenarios to validate**:
   - Mixed Chinese and English text
   - Numbers adjacent to Chinese characters  
   - Symbols and punctuation spacing
   - Markdown formatting preservation (bold, italic, code blocks)
   - Special markdown syntax: `[[_TOC_]]`, `[[_TOSP_]]`, `[TOC]`
   - Loose formatting feature (`pangu2.enableLooseFormatting`)

### Key Test Cases
- Verify the extension commands work: `pangu2.add_space_selection` and `pangu2.add_space_whole`
- Test auto-save functionality with `pangu2.autoAddSpaceOnSave` setting
- Validate markdown processing doesn't break syntax
- Check CJK character detection works correctly

## Important Configuration Files

### Key Project Files
```
package.json          - Extension manifest and dependencies
tsconfig.json         - TypeScript configuration  
tslint.json          - Linting rules (warns but doesn't fail)
.vscode/launch.json  - Debug configuration for VS Code
.vscode/tasks.json   - Build task configuration
```

### Source Structure
```
src/
├── extension.ts              - Main extension entry point
├── Pangu.ts                 - Core CJK spacing algorithm  
├── remark-pangu.ts         - Remark plugin for markdown processing
└── remark-azure-devops-wiki.ts - Azure DevOps Wiki support
```

### Build Output
```
out/
└── main.js          - Bundled extension (368KB with sourcemap, 160KB minified)
```

## Common Issues and Workarounds

### Known TypeScript Issues
- `npm run test-compile` WILL FAIL with type definition conflicts - this is expected
- The extension builds successfully with esbuild despite TypeScript errors
- Use esbuild commands instead of TypeScript compilation for building

### TODO Items in Code
- remark escaping issues with `[[_TOC_]]`, `[[_TOSP_]]`, and `[TOC]` syntax
- Manual workarounds are implemented in `extension.ts` lines 182-201

### Dependencies and Vulnerabilities
- `npm audit` shows 2 vulnerabilities (1 low, 1 moderate) - these are in dev dependencies only
- Several deprecated packages in dependencies - this is expected for this project

## CI/CD Pipeline

### GitHub Actions Workflows
- **CI**: `.github/workflows/ci.yml` - runs on push/PR to main, tests building and packaging
- **Release**: `.github/workflows/release.yml` - auto-publishes to VS Code Marketplace on version tags

### Release Process
1. Update version in `package.json`
2. Create and push git tag: `git tag v0.9.4 && git push origin v0.9.4`  
3. GitHub Actions automatically builds and publishes to marketplace

## Development Environment

### Required Tools
- Node.js 20+ (currently using v20.19.5)
- npm 10+ (currently using v10.8.2)
- VS Code for extension development and testing

### VS Code Extension Development
- Use F5 in VS Code to launch Extension Development Host
- Test extension commands via Command Palette (F1)
- Debug output available in "盤古之白" output channel

## Important Notes

### Build Performance
- All build commands complete in under 15 seconds
- Dependencies install in 2-3 seconds  
- Extension packaging takes ~12 seconds
- No long-running build processes in this project

### Extension Functionality
- Supports multiple file types but optimized for Markdown and plain text
- Uses sophisticated regex patterns for CJK character detection
- Integrates with remark ecosystem for markdown AST processing
- Provides both selection-based and whole-document processing

### Validation Requirements  
- ALWAYS test extension functionality manually after code changes
- Verify both command palette and right-click context menu options work
- Test with various file types (`.md`, `.txt`, etc.)
- Validate auto-save functionality when `pangu2.autoAddSpaceOnSave` is enabled
- Test loose formatting feature with `pangu2.enableLooseFormatting`

## Frequent Command Reference

```bash
# Quick development cycle
npm ci && npm run esbuild

# Full build and package
npm run vscode:prepublish
npx -y @vscode/vsce package --baseImagesUrl https://raw.githubusercontent.com/doggy8088/vscode-pangu/main/ --allow-star-activation

# Development with watch
npm run esbuild-watch

# Lint check
npx tslint src/*.ts
```

Always ensure manual testing covers the core extension functionality before considering any changes complete.