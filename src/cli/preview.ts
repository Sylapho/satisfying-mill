import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { writeJson } from '../engine/files';
import type { CompositionProps } from '../remotion/props';

export const preview = async (generatorId: string, props: CompositionProps, port: number, noOpen: boolean): Promise<void> => {
  const filename = path.resolve('generated/previews', `${generatorId}.json`);
  // Studio edits must recompute audio from the current configuration.
  await writeJson(filename, { ...props, audioSrc: null, generatorId });
  const require = createRequire(import.meta.url);
  const cli = path.join(path.dirname(require.resolve('@remotion/cli/package.json')), 'remotion-cli.js');
  console.log(`Preview ${generatorId}: http://localhost:${port}\nProps: ${filename}\nPress Ctrl+C to stop.`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [cli, 'studio', path.resolve('src/remotion/index.ts'), '--force-new', `--props=${filename}`, `--port=${port}`, ...(noOpen ? ['--no-open'] : [])], { stdio: 'inherit', windowsHide: true });
    const stop = () => { child.kill('SIGINT'); };
    process.once('SIGINT', stop);
    child.once('error', (error) => { process.removeListener('SIGINT', stop); reject(error); });
    child.once('exit', (code, signal) => {
      process.removeListener('SIGINT', stop);
      if (code === 0 || signal === 'SIGINT') resolve(); else reject(new Error(`Remotion Studio exited with code ${code}.`));
    });
  });
};
