import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(repoRoot, '_wiki_pages');
const destRoot = path.join(repoRoot, 'knowledge/work/wellbore-insights/large-object-display');
const basePrefix = 'Large-Object-Display';
const pathPrefix =
  '/WBI Core/WBI Computation & Data Visualization/2 - 3D Visualization/Project Design/Large Object Display';

function toKebab(name) {
  return name
    .replace(/\.md$/i, '')
    .replace(/%2D/gi, '-')
    .replace(/\+/g, '-')
    .replace(/&/g, 'and')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function relFromGitItem(gitItemPath, isParentPage) {
  const marker = `/${basePrefix}.md`;
  if (gitItemPath.endsWith(marker) || gitItemPath.endsWith(`/${basePrefix}`)) {
    return { dir: '', file: 'README.md' };
  }

  const folderPrefix = `${basePrefix}/`;
  const idx = gitItemPath.indexOf(folderPrefix);
  if (idx === -1) {
    throw new Error(`Unexpected gitItemPath: ${gitItemPath}`);
  }

  const rel = gitItemPath.slice(idx + folderPrefix.length);
  const segments = rel.split('/');
  const fileSegment = segments.pop() ?? '';
  const dirParts = segments.map(toKebab);
  const stem = toKebab(fileSegment);

  if (isParentPage) {
    return { dir: [...dirParts, stem].filter(Boolean).join('/'), file: 'README.md' };
  }

  return { dir: dirParts.join('/'), file: `${stem}.md` };
}

function titleFromPath(pagePath) {
  const parts = pagePath.split('/').filter(Boolean);
  return parts.at(-1) ?? 'Large Object Display';
}

function normalizeContent(content, title, remoteUrl) {
  let body = (content ?? '').trim();
  if (body === '[[_TOSP_]]' || body === '') {
    body = '_Index page — see child documents in this folder._';
  }

  return [
    `# ${title}`,
    '',
    `> Imported from [WellboreInsights ADO Wiki](${remoteUrl}) on 2026-06-26.`,
    '',
    body,
    '',
  ].join('\n');
}

const pages = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    const raw = fs.readFileSync(path.join(srcDir, f), 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw).page;
  })
  .sort((a, b) => a.path.localeCompare(b.path));

const written = [];
for (const page of pages) {
  const { dir, file } = relFromGitItem(page.gitItemPath, Boolean(page.isParentPage));
  const outDir = path.join(destRoot, dir);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, file);
  const title = titleFromPath(page.path);
  fs.writeFileSync(outFile, normalizeContent(page.content, title, page.remoteUrl), 'utf8');
  written.push({ outFile, title });
}

let readme = [
  '# Large Object Display',
  '',
  '> WellboreInsights wiki import — 3D large object rendering design docs.',
  '',
  '## Source',
  '',
  '- [ADO Wiki root](https://dev.azure.com/slb1-swt/WellboreInsights/_wiki/wikis/WellboreInsights.wiki/42203/Large-Object-Display)',
  '',
  '## Pages',
  '',
].join('\n');

for (const w of written) {
  const rel = path.relative(destRoot, w.outFile).replace(/\\/g, '/');
  if (rel === 'README.md') {
    continue;
  }

  const link = rel.endsWith('README.md') ? `./${rel.replace(/README\.md$/, '')}` : `./${rel}`;
  readme += `- [${w.title}](${link})\n`;
}

readme += [
  '',
  '## Notes',
  '',
  '- ADO wiki attachment images (`/.attachments/...`) are not included in this export.',
  '',
].join('\n');

fs.writeFileSync(path.join(destRoot, 'README.md'), readme, 'utf8');

console.log(
  written.map((w) => path.relative(repoRoot, w.outFile).replace(/\\/g, '/')).join('\n'),
);
