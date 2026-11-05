// Paths that weaken the Harness or CI when changed. Shared by Level 5 and the guard.
// AI tool settings, Git hooks and hook managers are included because changing them can turn the guard
// off or add commands that run on their own.
export const defaultProtectedPaths = [
  '.harness/', '.github/', 'AGENTS.md', 'CLAUDE.md',
  '.claude/', '.codex/', '.cursor/', '.gemini/', '.kiro/', '.mcp.json',
  '.git/hooks/', '.git/config', '.husky/', 'lefthook.yml', '.lefthook.yml', '.pre-commit-config.yaml',
  '.vscode/tasks.json',
];

// Matches a repository-relative POSIX path. An entry ending in "/" covers the whole directory.
export function matchesProtectedPath(relative, entries) {
  return entries.some((entry) => (entry.endsWith('/')
    ? relative === entry.slice(0, -1) || relative.startsWith(entry)
    : relative === entry));
}
