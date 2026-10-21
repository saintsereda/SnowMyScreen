import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
process.chdir(root);
const result = await build({
  entryPoints: ['src/weather-switch.jsx', 'src/mobile-menu.js'], outdir: 'js',
  bundle: true, minify: true, write: false, metafile: true, format: 'iife', platform: 'browser',
  target: ['es2020'], jsx: 'automatic', legalComments: 'linked',
  define: { 'process.env.NODE_ENV': '"production"' }
});
const outputs = {};
const digest = data => createHash('sha256').update(data).digest('hex');
for (const file of result.outputFiles) {
  const basename = path.basename(file.path);
  const relative = basename.startsWith('weather-switch.css') ? path.join('css', basename) : path.relative(root, file.path);
  await mkdir(path.dirname(relative), { recursive: true });
  await writeFile(relative, file.contents);
  outputs[relative] = digest(file.contents);
}
// Keep upstream licenses (or the publisher's license notice) with the runtime.
const packages = new Set(Object.keys(result.metafile.inputs)
  .map(file => file.match(/^node_modules\/((?:@[^/]+\/)?[^/]+)\//)?.[1]).filter(Boolean));
await mkdir('licenses/vendor', { recursive: true });
for (const name of [...packages].sort()) {
  const directory = path.join('node_modules', name);
  const license = (await readdir(directory)).find(file => /^licen[cs]e(?:\.(?:md|txt))?$/i.test(file));
  let contents;
  if (license) contents = await readFile(path.join(directory, license));
  else if (name === 'gsap') {
    // GSAP publishes its standard-license link and copyright in the README.
    const notice = (await readFile(path.join(directory, 'README.md'), 'utf8')).split('### License\n')[1];
    if (!notice) throw new Error('Missing GSAP license notice');
    contents = Buffer.from(notice);
  } else throw new Error(`Missing license for bundled package ${name}`);
  const relative = `licenses/vendor/${name.replaceAll('/', '-').replaceAll('@', '')}.txt`;
  await writeFile(relative, contents);
  outputs[relative] = digest(contents);
}
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(path.join(directory, entry.name)) : path.join(directory, entry.name)));
  return nested.flat();
}
const sources = {};
const inputs = [...await files('src'), 'package.json', 'package-lock.json', 'scripts/build_ui.mjs', 'licenses/react-bits.md'];
for (const file of inputs.sort()) sources[file] = digest(await readFile(file));
await writeFile('content/ui-build.json', JSON.stringify({ sources, outputs }, null, 2) + '\n');
console.log(`Built website UI: ${Object.keys(outputs).join(', ')}.`);
