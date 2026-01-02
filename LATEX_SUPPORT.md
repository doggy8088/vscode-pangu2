# LaTeX Support Documentation

## Overview

Starting from version 1.3.4, 盤古之白 (Pangu Spacing) extension now supports LaTeX files (`.tex` and `.latex`) with automatic protection of LaTeX commands.

## Problem

When formatting LaTeX documents with mixed Chinese and English text, the extension would incorrectly add spaces between LaTeX commands and their arguments, breaking the LaTeX syntax.

### Example Issues (Before Fix)

**Issue 1: Citation commands**
```latex
// Before formatting
自监督学习通过设计代理任务，如掩码建模~\cite{Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）

// After formatting (BROKEN)
自监督学习通过设计代理任务，如掩码建模~ \cite {Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）
```

**Issue 2: Environment and other commands**
```latex
// Before formatting
\begin{figure}[htbp]
    \centering
    \includegraphics[width=0.78\linewidth]{figures/chap2.7-inside-vit.png}
    \caption{视觉自注意力编码器内部结构}
    \label{fig:2.7-inside-vit}
\end{figure}

// After formatting (BROKEN)
\begin {figure}[htbp]
    \centering
    \includegraphics [width=0.78\linewidth]{figures/chap2.7-inside-vit.png}
    \caption {视觉自注意力编码器内部结构}
    \label {fig:2.7-inside-vit}
\end {figure}
```

## Solution

The extension now automatically detects LaTeX files and protects LaTeX commands during the spacing process.

### After Fix

**Issue 1: Citation commands (FIXED)**
```latex
// Before formatting
自监督学习通过设计代理任务，如掩码建模~\cite{Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）

// After formatting (CORRECT)
自监督学习通过设计代理任务，如掩码建模~\cite{Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）
```

**Issue 2: Environment and other commands (FIXED)**
```latex
// Before formatting
\begin{figure}[htbp]
    \centering
    \includegraphics[width=0.78\linewidth]{figures/chap2.7-inside-vit.png}
    \caption{视觉自注意力编码器内部结构}
    \label{fig:2.7-inside-vit}
\end{figure}

// After formatting (CORRECT)
\begin{figure}[htbp]
    \centering
    \includegraphics[width=0.78\linewidth]{figures/chap2.7-inside-vit.png}
    \caption{视觉自注意力编码器内部结构}
    \label{fig:2.7-inside-vit}
\end{figure}
```

## Features

### Automatic Detection

The extension automatically detects LaTeX files based on the file language ID:
- `latex` - LaTeX files
- `tex` - TeX files

### Protected Commands

The following LaTeX command patterns are protected:
- Basic commands: `\command`
- Commands with arguments: `\command{arg}`
- Commands with optional arguments: `\command[opt]{arg}`
- Commands with multiple arguments: `\command[opt1][opt2]{arg1}{arg2}`
- Commands with star variants: `\command*{arg}`

### Examples of Protected Commands

- Citations: `\cite{ref}`, `\citep{ref}`, `\citet{ref}`
- Text formatting: `\textbf{text}`, `\textit{text}`, `\emph{text}`
- Environments: `\begin{env}`, `\end{env}`
- Graphics: `\includegraphics[options]{file}`
- References: `\ref{label}`, `\label{name}`
- Sections: `\section{title}`, `\subsection{title}`
- Math: `\frac{num}{den}`, `\sqrt{x}`, `\sum_{i=1}^{n}`
- And many more...

## Usage

### Manual Formatting

1. Open a LaTeX file (`.tex` or `.latex`)
2. Select text or use the whole document
3. Use one of the following commands:
   - Right-click → "Pangu: 加入盤古之白 (選取範圍)"
   - Right-click → "Pangu: 加入盤古之白 (整份文件)"
   - Command Palette (F1) → "Pangu: 加入盤古之白 (選取範圍)"
   - Command Palette (F1) → "Pangu: 加入盤古之白 (整份文件)"

### Auto-Save Formatting

To enable automatic formatting on save for LaTeX files:

1. Open VS Code Settings (File → Preferences → Settings)
2. Search for "pangu"
3. Enable "Auto Add Space On Save"
4. Add `.tex` to "Auto Add Space On Save File Extensions"

Example configuration in `settings.json`:
```json
{
  "pangu2.autoAddSpaceOnSave": true,
  "pangu2.autoAddSpaceOnSaveFileExtensions": [
    ".txt",
    ".md",
    ".tex"
  ]
}
```

## Technical Details

### Implementation

The LaTeX support is implemented using a protection mechanism:

1. **Detection**: LaTeX commands are detected using regex pattern: `\\[a-zA-Z]+(?:\*)?(?:\[[^\]]*\])*(?:\{[^}]*\})*`
2. **Protection**: Matched commands are replaced with unique placeholders: `〔LATEX0〕`, `〔LATEX1〕`, etc.
3. **Processing**: The text is processed with normal Pangu spacing rules
4. **Restoration**: Protected LaTeX commands are restored to their original form

This ensures that:
- LaTeX commands remain intact
- Spacing is still correctly applied between Chinese and English text
- No spaces are added within LaTeX command syntax

### Placeholder Format

LaTeX commands use a special placeholder format `〔LATEX{n}〕` (using CJK corner brackets) to:
- Avoid conflicts with URL placeholders `{n}`
- Prevent the placeholder itself from being affected by spacing rules
- Ensure unique identification during restoration

## Testing

Comprehensive test suites are included in the `tests/` directory:

- `test-latex-protection.mjs` - Unit tests for LaTeX command protection
- `test-latex-comprehensive.tex` - Real-world LaTeX document examples
- `test-latex-issue.tex` - Test cases from the original issue report

## Known Limitations

1. **Nested braces**: Deeply nested braces in LaTeX commands might not be fully protected
2. **Custom commands**: User-defined LaTeX commands are protected if they follow standard naming conventions
3. **Comments**: LaTeX comments are not specially handled

## Feedback

If you encounter any issues with LaTeX support, please report them on the GitHub repository:
https://github.com/doggy8088/vscode-pangu2/issues

Include:
- The LaTeX code that causes issues
- Expected behavior
- Actual behavior
- VS Code version and extension version
