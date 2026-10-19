// Checks the code examples in docs/.
//
// - ts, tsx, js: every block must parse.
// - ts, tsx: every `// good` part (plus the lines before the first marker) must type-check
//   under the recommended tsconfig. Names the example never declares are ignored, so only
//   errors in what the example actually shows are reported.
// - jsonc: every part must be a single valid JSONC value.
//
// Run: pnpm check
// The repo builds with TS 7, which has no stable JS API until 7.1, so this script uses
// the TS 6 API from @typescript/typescript6 (see docs/typescript/appendix.md).

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from '@typescript/typescript6';

interface Part { kind: 'shared' | 'bad' | 'good'; start: number; end: number }
interface Block { file: string; lang: string; line: number; lines: readonly string[]; parts: readonly Part[] }
interface Problem { file: string; line: number; message: string }

const ROOT = join(import.meta.dirname, '..');
const MARKER = /^\/\/ (bad|good|better)\b/;
const CHECKED_LANGS = new Set(['ts', 'tsx', 'js', 'jsonc']);

// Diagnostics caused by the example leaning on names it never declares, or by
// deliberately incomplete bodies. Everything else is reported.
const IGNORED_CODES = new Set([
  1108, // return outside a function (switch/try fragments)
  2300, // duplicate identifier (alternatives shown side by side)
  2304, // cannot find name
  2307, // cannot find module
  2664, // augmenting a package that is not installed
  2355, // declared return type, empty body
  2391, // overload without implementation
  2393, // duplicate function implementation (alternatives)
  2451, // redeclared block-scoped variable (alternatives)
  2503, // cannot find namespace
  2552, // cannot find name, did you mean
  2580, // needs @types/node
  2582, // needs test-runner types
  2591, // needs @types/node
  2593, // needs test-runner types
  4112, // override on a class whose base is undeclared
  7026, // JSX without React types
  18004, // shorthand property for an undeclared value
]);

// A line commented `// error` or `// syntax error` shows an error on purpose.
const EXPECTED_ERROR = /\/\/ (syntax )?error\b/;

const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2024,
  lib: ['lib.es2024.d.ts', 'lib.dom.d.ts'],
  module: ts.ModuleKind.Preserve,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  moduleDetection: ts.ModuleDetectionKind.Force,
  jsx: ts.JsxEmit.Preserve,
  strict: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  noImplicitOverride: true,
  noFallthroughCasesInSwitch: true,
  verbatimModuleSyntax: true,
  erasableSyntaxOnly: true,
  allowImportingTsExtensions: true,
  noEmit: true,
  skipLibCheck: true,
  types: [],
};

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

function splitParts(lines: readonly string[]): Part[] {
  const parts: Part[] = [{ kind: 'shared', start: 0, end: lines.length }];
  lines.forEach((text, i) => {
    const match = MARKER.exec(text);
    if (!match) return;
    const previous = parts.at(-1);
    if (previous) previous.end = i;
    parts.push({ kind: match[1] === 'bad' ? 'bad' : 'good', start: i, end: lines.length });
  });
  return parts;
}

function extractBlocks(file: string): Block[] {
  const blocks: Block[] = [];
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  let open: { lang: string; line: number; body: string[] } | undefined;
  lines.forEach((text, i) => {
    if (open === undefined) {
      const fence = /^```(\w+)/.exec(text);
      if (fence?.[1] !== undefined) open = { lang: fence[1], line: i + 2, body: [] };
    } else if (text.startsWith('```')) {
      if (CHECKED_LANGS.has(open.lang)) {
        blocks.push({ file, lang: open.lang, line: open.line, lines: open.body, parts: splitParts(open.body) });
      }
      open = undefined;
    } else {
      open.body.push(text);
    }
  });
  return blocks;
}

// Keeps the chosen parts and blanks every other line, so line numbers still match the block.
function keepParts(block: Block, keep: readonly Part[]): string {
  return block.lines
    .map((text, i) => (keep.some((p) => i >= p.start && i < p.end) ? text : ''))
    .join('\n');
}

function relativeFile(file: string): string {
  return relative(ROOT, file).replaceAll('\\', '/');
}

function lineOf(diagnostic: ts.Diagnostic): number {
  return diagnostic.file && diagnostic.start !== undefined
    ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line
    : 0;
}

function isExpected(block: Block, diagnostic: ts.Diagnostic): boolean {
  return EXPECTED_ERROR.test(block.lines[lineOf(diagnostic)] ?? '');
}

// An implicit-any parameter on an inline callback only means the receiver
// (`items` in `items.map((i) => ...)`, or a JSX element without React types)
// is undeclared in the example.
function isCallbackParameter(diagnostic: ts.Diagnostic): boolean {
  const { file, start } = diagnostic;
  if (diagnostic.code !== 7006 || !file || start === undefined) return false;
  let found = false;
  function visit(node: ts.Node): void {
    if (found || start === undefined || start < node.getStart(file) || start >= node.getEnd()) return;
    if (ts.isParameter(node) && node.getStart(file) === start) {
      const fn = node.parent;
      found = (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))
        && (ts.isCallExpression(fn.parent) || ts.isJsxExpression(fn.parent));
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return found;
}

function checkSyntax(block: Block): Problem[] {
  const fileName = block.lang === 'tsx' ? 'example.tsx' : 'example.ts';
  const { diagnostics = [] } = ts.transpileModule(block.lines.join('\n'), {
    fileName,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve },
  });
  return diagnostics.filter((d) => !isExpected(block, d)).map((d) => toProblem(block, d));
}

function checkJsonc(block: Block): Problem[] {
  const shared = block.parts.filter((p) => p.kind === 'shared');
  const others = block.parts.filter((p) => p.kind !== 'shared');
  const candidates = others.length === 0 ? [shared] : others.map((p) => [...shared, p]);
  return candidates.flatMap((keep) => {
    const text = keepParts(block, keep);
    const withoutComments = text.replace(/^\s*\/\/.*$/gm, '').trim();
    if (withoutComments === '') return [];
    const { error } = ts.parseConfigFileTextToJson('example.jsonc', text);
    return error ? [toProblem(block, error)] : [];
  });
}

function toProblem(block: Block, diagnostic: ts.Diagnostic): Problem {
  return {
    file: relativeFile(block.file),
    line: block.line + lineOf(diagnostic),
    message: `TS${String(diagnostic.code)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`,
  };
}

function checkTypes(blocks: readonly Block[]): Problem[] {
  const virtual = new Map<string, Block>();
  const sources = new Map<string, string>();
  blocks.filter((b) => b.lang === 'ts' || b.lang === 'tsx').forEach((block, n) => {
    const shared = block.parts.filter((p) => p.kind === 'shared');
    const goods = block.parts.filter((p) => p.kind === 'good');
    const candidates = goods.length === 0 ? [shared] : goods.map((g) => [...shared, g]);
    candidates.forEach((keep, m) => {
      const name = `/virtual/${String(n)}-${String(m)}.${block.lang}`;
      virtual.set(name, block);
      sources.set(name, keepParts(block, keep));
    });
  });

  const host = ts.createCompilerHost(COMPILER_OPTIONS);
  const readReal = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, ...rest) => {
    const text = sources.get(fileName);
    return text === undefined
      ? readReal(fileName, languageVersion, ...rest)
      : ts.createSourceFile(fileName, text, languageVersion, true);
  };
  const fileExists = host.fileExists.bind(host);
  host.fileExists = (fileName) => sources.has(fileName) || fileExists(fileName);

  const program = ts.createProgram([...sources.keys()], COMPILER_OPTIONS, host);
  return ts.getPreEmitDiagnostics(program)
    .filter((d) => !IGNORED_CODES.has(d.code) && !isCallbackParameter(d))
    .flatMap((d) => {
      const block = d.file ? virtual.get(d.file.fileName) : undefined;
      return block && !isExpected(block, d) ? [toProblem(block, d)] : [];
    });
}

function main(): void {
  const blocks = markdownFiles(join(ROOT, 'docs')).flatMap(extractBlocks);
  const problems = [
    ...blocks.filter((b) => b.lang !== 'jsonc').flatMap(checkSyntax),
    ...blocks.filter((b) => b.lang === 'jsonc').flatMap(checkJsonc),
    ...checkTypes(blocks),
  ].toSorted((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  for (const p of problems) console.log(`${p.file}:${String(p.line)}  ${p.message}`);
  console.log(`\n${String(blocks.length)} code blocks checked, ${String(problems.length)} problems.`);
  if (problems.length > 0) process.exitCode = 1;
}

main();
