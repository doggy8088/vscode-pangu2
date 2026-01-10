# LaTeX Support Implementation Summary

## Issue Addressed

**Issue**: [是否有 LaTeX 适配计划？](https://github.com/doggy8088/vscode-pangu2/issues/32)

The extension was incorrectly adding spaces between LaTeX commands and their arguments, breaking LaTeX syntax.

### Examples from Issue

**Example 1: Citation Commands**
```latex
// Before formatting
自监督学习通过设计代理任务，如掩码建模~\cite{Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）

// After formatting (BROKEN in v1.3.3)
自监督学习通过设计代理任务，如掩码建模~ \cite {Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）

// After formatting (FIXED in v1.3.4)
自监督学习通过设计代理任务，如掩码建模~\cite{Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）
```

**Example 2: Environment Commands**
```latex
// Before formatting
\begin{figure}[htbp]
    \centering
    \includegraphics[width=0.78\linewidth]{figures/chap2.7-inside-vit.png}
    \caption{视觉自注意力编码器内部结构}
    \label{fig:2.7-inside-vit}
\end{figure}

// After formatting (BROKEN in v1.3.3)
\begin {figure}[htbp]
    \centering
    \includegraphics [width=0.78\linewidth]{figures/chap2.7-inside-vit.png}
    \caption {视觉自注意力编码器内部结构}
    \label {fig:2.7-inside-vit}
\end {figure}

// After formatting (FIXED in v1.3.4)
\begin{figure}[htbp]
    \centering
    \includegraphics[width=0.78\linewidth]{figures/chap2.7-inside-vit.png}
    \caption{视觉自注意力编码器内部结构}
    \label{fig:2.7-inside-vit}
\end{figure}
```

## Implementation Details

### Files Modified

1. **src/Pangu.ts**
   - Added `LATEX_COMMAND` regex pattern
   - Added `latexMode` boolean property
   - Updated `spacing()` method signature to accept options
   - Implemented LaTeX command protection/restoration logic

2. **src/extension.ts**
   - Added detection for `latex` and `tex` language IDs
   - Automatically enables LaTeX mode for LaTeX files

3. **package.json**
   - Bumped version to 1.3.4

4. **README.md**
   - Added LaTeX support feature description

5. **CHANGELOG.md**
   - Documented version 1.3.4 changes

6. **LATEX_SUPPORT.md** (new)
   - Comprehensive documentation for LaTeX support

### Technical Approach

#### 1. LaTeX Command Pattern
```javascript
const LATEX_COMMAND = /\\[a-zA-Z]+(?:\*)?(?:\[[^\]]*\])*(?:\{[^}]*\})*/g;
```

This pattern matches:
- Basic commands: `\command`
- Commands with arguments: `\command{arg}`
- Commands with optional arguments: `\command[opt]{arg}`
- Multiple arguments: `\command[opt1][opt2]{arg1}{arg2}`
- Star variants: `\command*{arg}`

#### 2. Protection Mechanism

**Step 1: Protect LaTeX Commands**
```javascript
const matchLatexCommands = [];
if (isLatexMode) {
  newText = newText.replace(LATEX_COMMAND, (match) => {
    const latexIndex = matchLatexCommands.length;
    matchLatexCommands.push(match);
    return `〔LATEX${latexIndex}〕`;
  });
}
```

**Step 2: Apply Spacing Rules**
The protected commands are replaced with placeholders, so spacing rules don't affect them.

**Step 3: Restore LaTeX Commands**
```javascript
if (isLatexMode && matchLatexCommands.length > 0) {
  newText = newText.replace(/〔LATEX(\d+)〕/g, (match, latexIndex) => {
    const idx = parseInt(latexIndex);
    if (idx < matchLatexCommands.length && matchLatexCommands[idx] !== undefined) {
      return matchLatexCommands[idx];
    }
    return match;
  });
}
```

#### 3. Unique Placeholder Format

Uses `〔LATEX{n}〕` (CJK corner brackets) to:
- Avoid conflicts with URL placeholders `{n}`
- Prevent placeholder from being affected by spacing rules
- Enable separate restoration logic

### Code Quality

- ✅ All 11 test cases pass
- ✅ Production build successful (169KB minified)
- ✅ No linting errors
- ✅ No TypeScript compilation errors
- ✅ Backward compatible
- ✅ Minimal code changes

## Testing

### Test Coverage

Created comprehensive test suite with 11 test cases:

1. ✅ Issue Example 1: LaTeX cite with tilde
2. ✅ Issue Example 1: Multiple LaTeX cite commands
3. ✅ Issue Example 2: LaTeX begin command
4. ✅ Issue Example 2: LaTeX includegraphics
5. ✅ Issue Example 2: LaTeX caption with CJK
6. ✅ Issue Example 2: LaTeX label
7. ✅ LaTeX with Chinese text spacing
8. ✅ Without LaTeX mode (spacing enabled)
9. ✅ With LaTeX mode (spacing disabled for commands)
10. ✅ Complex LaTeX with multiple commands
11. ✅ LaTeX with URL - both protected

### Test Files

- `tests/test-latex-protection.mjs` - Automated unit tests
- `tests/test-latex-comprehensive.tex` - Real-world examples
- `tests/test-latex-issue.tex` - Issue examples

## Usage

### Automatic Detection

The extension automatically detects LaTeX files:
- `.tex` files
- `.latex` files

No configuration needed - just open a LaTeX file and use the extension commands.

### Manual Formatting

1. Open a LaTeX file
2. Select text or use whole document
3. Right-click → "Pangu: 加入盤古之白 (選取範圍)" or "(整份文件)"

### Auto-Save

Enable in settings:
```json
{
  "pangu2.autoAddSpaceOnSave": true,
  "pangu2.autoAddSpaceOnSaveFileExtensions": [".txt", ".md", ".tex"]
}
```

## Backward Compatibility

- ✅ No changes to Markdown processing
- ✅ No changes to plain text processing
- ✅ URL protection unchanged
- ✅ All existing features preserved
- ✅ LaTeX mode is opt-in (only for `.tex`/`.latex` files)

## Documentation

- `LATEX_SUPPORT.md` - Comprehensive LaTeX support documentation
- `README.md` - Updated with LaTeX feature highlights
- `CHANGELOG.md` - Version 1.3.4 changes

## Future Enhancements

Possible improvements for future versions:
1. Support for custom LaTeX command patterns via configuration
2. Better handling of deeply nested braces
3. Protection for LaTeX comments
4. Support for more specialized LaTeX packages

## Conclusion

The LaTeX support feature successfully addresses the reported issue and provides a robust solution for formatting LaTeX documents with mixed CJK and Western text. The implementation is minimal, well-tested, and backward compatible.
