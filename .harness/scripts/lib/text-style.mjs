import path from 'node:path';

const textNames = new Set(['.editorconfig', '.gitattributes', '.gitignore', '.gitmodules', 'CODEOWNERS', 'Makefile', 'makefile', 'GNUmakefile']);
// Godot formats (.tscn, .tres, .gdshader, project.godot, .cfg, .import, .uid) are text the engine writes as UTF-8 with LF.
const textExtensions = /\.(?:md|html?|css|json|[cm]?js|jsx|tsx?|ya?ml|go|gd|gdshader|tscn|tres|godot|cfg|import|uid|php|cs|pyi?|rs|[sS][qQ][lL]|toml|mk)$/;

export function isStyleTarget(file) {
  return textNames.has(path.basename(file)) || textExtensions.test(file);
}

// Git writes .gitmodules with tab indentation, and the Godot editor indents GDScript,
// shaders and scenes with tabs, so keep those native formats.
export function allowsTabs(file) {
  return /\.(?:go|gd|gdshader|tscn|tres|mk)$/.test(file) || ['Makefile', 'makefile', 'GNUmakefile', '.gitmodules'].includes(path.basename(file));
}

// Source code files in which ZWJ / ZWNJ must also be written as escapes. Document
// and data formats keep them, since emoji sequences and some scripts need them.
const codeExtensions = /\.(?:[cm]?js|jsx|tsx?|go|gd|php|cs|pyi?|rs|[sS][qQ][lL])$/;

export function isCodeFile(file) {
  return codeExtensions.test(file);
}

export function isJoinerControl(codePoint) {
  return codePoint === 0x200c || codePoint === 0x200d;
}

// Bidirectional controls can make code display differently from how it is parsed
// (Trojan Source, CVE-2021-42574). Write them as escapes instead of literal characters.
export function isBidiControl(codePoint) {
  return codePoint === 0x061c || codePoint === 0x200e || codePoint === 0x200f
    || (codePoint >= 0x202a && codePoint <= 0x202e) || (codePoint >= 0x2066 && codePoint <= 0x2069);
}

// Invisible characters with no legitimate literal use in these files. ZWJ and ZWNJ are
// allowed outside code files because emoji sequences and some scripts need them.
export function isHiddenCharacter(codePoint) {
  return codePoint === 0x200b || codePoint === 0x2060 || codePoint === 0xfeff;
}

function findInvisible(text, code) {
  let line = 1;
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (char === '\n') line += 1;
    else if (isBidiControl(codePoint)) return { line, codePoint, kind: 'bidirectional control' };
    else if (isHiddenCharacter(codePoint)) return { line, codePoint, kind: 'invisible character' };
    else if (code && isJoinerControl(codePoint)) return { line, codePoint, kind: 'joiner control in code' };
  }
  return null;
}

export function checkTextStyle(bytes, file) {
  const errors = [];
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) errors.push('UTF-8 BOM is not allowed');
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    errors.push('invalid UTF-8');
    return errors;
  }
  if (text.includes('\0')) errors.push('NUL is not allowed in these text files');
  if (text.includes('\r')) errors.push('use LF line endings');
  if (text.length && !text.endsWith('\n')) errors.push('final newline required');
  if (/[ \t]+$/m.test(text)) errors.push('trailing whitespace is not allowed');
  if (!allowsTabs(file) && text.includes('\t')) errors.push('use spaces instead of literal tabs');
  const hidden = findInvisible(text, isCodeFile(file));
  if (hidden) {
    const hex = hidden.codePoint.toString(16).toUpperCase().padStart(4, '0');
    errors.push(`line ${hidden.line}: ${hidden.kind} U+${hex} is not allowed; write it as an escape`);
  }
  return errors;
}
