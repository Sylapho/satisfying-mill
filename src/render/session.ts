import { bundle } from '@remotion/bundler';
import { openBrowser } from '@remotion/renderer';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';

const sourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? sourceFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return groups.flat().sort();
};
const computeCodeHash = async (): Promise<string> => {
  const hash = createHash('sha256');
  for (const file of [...await sourceFiles(path.resolve('src')), path.resolve('pnpm-lock.yaml')]) {
    hash.update(path.relative(process.cwd(), file).replaceAll('\\', '/'));
    hash.update(await readFile(file));
  }
  return hash.digest('hex');
};

export const createRenderSession = async () => {
  const root = path.resolve('generated/bundles');
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, 'render-'));
  const codeHash = await computeCodeHash();
  let previous = -1;
  console.log('Bundling Remotion…');
  try {
    const serveUrl = await bundle({ entryPoint: path.resolve('src/remotion/index.ts'), outDir: directory,
      onProgress: (progress) => { const step = Math.floor(progress / 25); if (step > previous) { previous = step; console.log(`Bundle ${Math.round(progress)}%`); } },
    });
    const browser = await openBrowser('chrome', {
      browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || null,
      logLevel: 'warn',
    });
    return {
      serveUrl, browser, codeHash,
      close: async () => {
        await browser.close({ silent: true });
        if (path.dirname(directory) !== root) throw new Error('Refusing to remove bundle outside the cache directory.');
        await rm(directory, { recursive: true, force: true });
      },
    };
  } catch (error) {
    if (path.dirname(directory) === root) await rm(directory, { recursive: true, force: true });
    throw error;
  }
};
export type RenderSession = Awaited<ReturnType<typeof createRenderSession>>;
