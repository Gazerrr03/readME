import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultContentDocument } from '../../scripts/content/default-document.js';
import {
  createContentExport,
  importContentDocument,
} from '../../scripts/writing/import-export.js';

test('invalid import does not mutate the current document', () => {
  const current = createDefaultContentDocument();
  assert.throws(() => importContentDocument('{"schemaVersion":99}', current), /导入文件无效/);
  assert.equal(current.fields['ui.site.title'].values['zh-CN'], '凌晨两点，不存在的频率');
});

test('valid import returns a clone without mutating its input', () => {
  const current = createDefaultContentDocument();
  const incoming = createDefaultContentDocument();
  incoming.fields['ui.site.title'].values['zh-CN'] = '导入标题';
  const imported = importContentDocument(JSON.stringify(incoming), current);
  imported.fields['ui.site.title'].values['zh-CN'] = '继续修改';
  assert.equal(incoming.fields['ui.site.title'].values['zh-CN'], '导入标题');
  assert.equal(current.fields['ui.site.title'].values['zh-CN'], '凌晨两点，不存在的频率');
});

test('export keeps old translations and reports unresolved fields', () => {
  const defaults = createDefaultContentDocument();
  const document = structuredClone(defaults);
  document.fields['ui.site.title'].values['zh-CN'] = '新中文标题';
  const result = createContentExport(document, [{
    jobId: 'title:1',
    fieldId: 'ui.site.title',
    status: 'waiting-manual',
    errorCategory: 'offline',
    updatedAt: 1,
  }], defaults, () => 2);
  const exported = JSON.parse(result.contentJson);
  const report = JSON.parse(result.reportJson);
  assert.equal(exported.fields['ui.site.title'].values.en, defaults.fields['ui.site.title'].values.en);
  assert.equal(exported.fields['ui.site.title'].values.ja, defaults.fields['ui.site.title'].values.ja);
  assert.equal(result.unresolvedCount, 1);
  assert.deepEqual(report.unresolved.map(({ fieldId }) => fieldId), ['ui.site.title']);
});
