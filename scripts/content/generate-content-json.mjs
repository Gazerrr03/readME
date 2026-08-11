import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeContentDocument } from './content-document.js';
import { createDefaultContentDocument } from './default-document.js';

const outputUrl = new URL('../../content/content.json', import.meta.url);
await mkdir(dirname(fileURLToPath(outputUrl)), { recursive: true });
await writeFile(outputUrl, serializeContentDocument(createDefaultContentDocument()), 'utf8');
