export const toPosix = (p: string) => p.replace(/\\/g, '/');

export function dirname(p: string) {
  const posix = toPosix(p);
  const idx = posix.lastIndexOf('/');
  if (idx === -1) return '';
  if (idx === 0) return '/';
  return posix.slice(0, idx);
}

export function basename(p: string, ext?: string): string {
  const posix = toPosix(p);
  const name = posix.split('/').pop() || '';
  return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name;
}

export function extname(p: string): string {
  const name = toPosix(p).split('/').pop() || '';
  const lastDot = name.lastIndexOf('.');
  return lastDot > 0 ? name.slice(lastDot) : '';
}

export function relative(from: string, to: string): string {
  const fromParts = toPosix(from).split('/').filter(Boolean);
  const toParts = toPosix(to).split('/').filter(Boolean);
  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
    i++;
  }
  const ups = fromParts.length - i;
  const downs = toParts.slice(i);
  const parts = Array(ups).fill('..').concat(downs);
  return parts.join('/') || '';
}

export function join(a: string, b: string) {
  const aa = toPosix(a).replace(/\/+$/, '');
  const bb = toPosix(b).replace(/^\/+/, '');
  return (aa ? `${aa}/` : '/') + bb;
}

export function normalize(path: string): string {
  const parts = toPosix(path).split('/');
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (out.length) out.pop();
      continue;
    }
    out.push(part);
  }
  return `/${out.join('/')}`;
}

export const CANDIDATE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
