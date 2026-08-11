import { createContentExport, importContentDocument } from './import-export.js';

const GROUPS = [
  ['articles', '文章'],
  ['projects', '项目'],
  ['about', '关于'],
  ['contact', '联系方式'],
  ['photos', '照片'],
  ['albums', '唱片'],
  ['advanced.interface', '界面文案'],
  ['advanced.accessibility', '辅助标签'],
];

const STATUS_LABELS = {
  pending: '等待翻译',
  translating: '正在翻译',
  'waiting-recovery': '等待自动重试',
  'waiting-manual': '等待手动重试',
  complete: '翻译完成',
  superseded: '已被新版本替代',
};

function element(document, tagName, attributes = {}, text = '') {
  const node = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
  node.textContent = text;
  return node;
}

function createScheduler(delay, callback) {
  const timers = new Map();
  return (key) => {
    clearTimeout(timers.get(key));
    timers.set(key, setTimeout(() => {
      timers.delete(key);
      callback(key);
    }, delay));
  };
}

function downloadText(document, filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const anchor = element(document, 'a', { href: url, download: filename });
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function latestJobsByField(jobs) {
  const latest = new Map();
  jobs.forEach((job) => {
    const previous = latest.get(job.fieldId);
    if (!previous || (job.updatedAt ?? 0) >= (previous.updatedAt ?? 0)) latest.set(job.fieldId, job);
  });
  return latest;
}

export function createWritingReviewApp({
  root,
  contentStore,
  defaults,
  storage,
  queue,
  channel = { publish() {} },
  confirmAction = (message) => root.ownerDocument.defaultView.confirm(message),
  download = (filename, text) => downloadText(root.ownerDocument, filename, text),
}) {
  const document = root.ownerDocument;
  let currentGroup = 'articles';
  let selectedFieldId = Object.keys(contentStore.document.fields)
    .find((id) => contentStore.document.fields[id].group === currentGroup);
  let jobs = queue.jobs();
  const fieldNodes = new Map();

  const header = element(document, 'header', { 'data-review-header': '' });
  const identity = element(document, 'div', { 'data-review-identity': '' });
  identity.append(
    element(document, 'span', { 'data-review-route': '' }, '/writing'),
    element(document, 'h1', {}, '本地内容审校'),
  );
  const status = element(document, 'div', { 'data-review-status': '' });
  const saveStatus = element(document, 'span', {
    'data-save-status': '', role: 'status', 'aria-live': 'polite',
  }, '已载入');
  const queueStatus = element(document, 'span', { 'data-queue-summary': '' });
  status.append(saveStatus, queueStatus);

  const actions = element(document, 'div', { 'data-review-actions': '' });
  const importButton = element(document, 'button', { type: 'button', 'data-import': '' }, '导入 JSON');
  const exportButton = element(document, 'button', { type: 'button', 'data-export': '' }, '导出 JSON');
  const retryButton = element(document, 'button', { type: 'button', 'data-retry-all': '' }, '重试失败项');
  const resetButton = element(document, 'button', { type: 'button', 'data-reset': '' }, '重置草稿');
  const fileInput = element(document, 'input', {
    type: 'file', accept: 'application/json,.json', 'data-import-file': '', hidden: '',
  });
  actions.append(importButton, exportButton, retryButton, resetButton, fileInput);
  header.append(identity, status, actions);

  const tabs = element(document, 'div', { role: 'tablist', 'data-review-tabs': '', 'aria-label': '工作区视图' });
  const editorTab = element(document, 'button', {
    type: 'button', role: 'tab', 'aria-selected': 'true', 'data-pane-tab': 'editor',
  }, '编辑');
  const previewTab = element(document, 'button', {
    type: 'button', role: 'tab', 'aria-selected': 'false', 'data-pane-tab': 'preview',
  }, '预览');
  tabs.append(editorTab, previewTab);

  const workspace = element(document, 'div', { 'data-review-workspace': '' });
  const sidebar = element(document, 'nav', { 'data-review-sidebar': '', 'aria-label': '内容分组' });
  const groupList = element(document, 'div', { 'data-group-list': '' });
  const searchLabel = element(document, 'label', { 'data-field-search-label': '' }, '搜索字段');
  const search = element(document, 'input', {
    type: 'search', 'data-field-search': '', placeholder: '标题、正文或字段 ID',
  });
  searchLabel.append(search);
  const fieldList = element(document, 'div', { 'data-field-list': '', 'aria-label': '字段列表' });
  const taskPanel = element(document, 'section', { 'data-task-panel': '', 'aria-label': '翻译任务' });
  taskPanel.append(element(document, 'h2', {}, '翻译任务'), element(document, 'div', { 'data-task-list': '' }));
  sidebar.append(groupList, searchLabel, fieldList, taskPanel);

  const editorPanel = element(document, 'section', { 'data-editor-panel': '', 'data-pane': 'editor' });
  const previewPanel = element(document, 'section', { 'data-preview-panel': '', 'data-pane': 'preview' });
  const previewHeader = element(document, 'header', { 'data-preview-header': '' });
  previewHeader.append(
    element(document, 'div', {}, '真实站点预览'),
    element(document, 'button', {
      type: 'button', 'data-preview-reload': '', 'aria-label': '重新载入预览', title: '重新载入预览',
    }, '↻'),
  );
  const preview = element(document, 'iframe', {
    src: '/?skipBoot=1', title: '站点交互预览', 'data-review-preview': '',
  });
  previewPanel.append(previewHeader, preview);
  workspace.append(sidebar, editorPanel, previewPanel);
  root.dataset.activePane = 'editor';
  root.replaceChildren(header, tabs, workspace);

  const fields = () => contentStore.document.fields;
  const filteredFields = () => {
    const query = search.value.trim().toLocaleLowerCase('zh-CN');
    return Object.entries(fields())
      .filter(([, field]) => query ? (
        field.label.toLocaleLowerCase('zh-CN').includes(query)
        || Object.values(field.values).some((value) => value.toLocaleLowerCase('zh-CN').includes(query))
      ) : field.group === currentGroup)
      .sort(([, left], [, right]) => left.order - right.order);
  };

  const renderGroups = () => {
    const counts = Object.values(fields()).reduce((result, field) => {
      result[field.group] = (result[field.group] ?? 0) + 1;
      return result;
    }, {});
    groupList.replaceChildren(...GROUPS.map(([id, label], index) => {
      const button = element(document, 'button', {
        type: 'button', 'data-group': id,
        'data-active': String(id === currentGroup),
      });
      button.append(
        element(document, 'span', {}, label),
        element(document, 'span', { 'aria-label': `${counts[id] ?? 0} 个字段` }, String(counts[id] ?? 0)),
      );
      if (index === 6) button.dataset.advancedStart = '';
      return button;
    }));
  };

  const renderFieldList = () => {
    const matches = filteredFields();
    fieldList.replaceChildren(...matches.map(([id, field]) => {
      const button = element(document, 'button', {
        type: 'button', 'data-field-nav': id,
        'data-active': String(id === selectedFieldId), title: id,
      });
      button.append(element(document, 'span', {}, field.label), element(document, 'code', {}, id));
      return button;
    }));
    if (!matches.length) fieldList.append(element(document, 'p', { 'data-empty-fields': '' }, '没有匹配字段'));
  };

  const validationMessage = (field, value) => {
    if (!value.trim()) return '中文内容不能为空';
    const missing = field.preserveTokens.filter((token) => !value.includes(token));
    return missing.length ? `必须保留：${missing.join('、')}` : '';
  };

  const updateCurrentFieldState = () => {
    const nodes = fieldNodes.get(selectedFieldId);
    if (!nodes) return;
    const field = fields()[selectedFieldId];
    nodes.en.value = field.values.en;
    nodes.ja.value = field.values.ja;
    const job = latestJobsByField(jobs).get(selectedFieldId);
    nodes.translationStatus.textContent = job ? STATUS_LABELS[job.status] : '尚未修改';
    nodes.translationStatus.dataset.status = job?.status ?? 'idle';
  };

  const scheduleTranslation = createScheduler(800, (fieldId) => {
    void queue.enqueue(fieldId);
  });

  const renderEditor = () => {
    fieldNodes.clear();
    const field = fields()[selectedFieldId];
    if (!field) {
      editorPanel.replaceChildren(element(document, 'p', { 'data-empty-editor': '' }, '请选择一个字段'));
      return;
    }
    const container = element(document, 'div', { 'data-field-id': selectedFieldId });
    const crumb = element(document, 'p', { 'data-editor-crumb': '' }, `${field.group} / ${selectedFieldId}`);
    const heading = element(document, 'h2', {}, field.label);
    const sourceLabel = element(document, 'label', {}, '中文原稿');
    const source = element(document, field.kind === 'longText' ? 'textarea' : 'input', {
      'data-source-input': '', 'aria-describedby': 'field-validation field-translation-status',
    });
    source.value = field.values['zh-CN'];
    sourceLabel.append(source);
    const validation = element(document, 'p', { id: 'field-validation', 'data-field-validation': '' });
    const translationStatus = element(document, 'p', {
      id: 'field-translation-status', 'data-field-translation-status': '', role: 'status', 'aria-live': 'polite',
    });

    const generated = element(document, 'section', { 'data-generated-locales': '' });
    generated.append(element(document, 'h3', {}, 'LLM 生成译文'));
    const enLabel = element(document, 'label', {}, 'English');
    const en = element(document, 'textarea', { readonly: '', 'data-locale-value': 'en' });
    en.value = field.values.en;
    enLabel.append(en);
    const jaLabel = element(document, 'label', {}, '日本語');
    const ja = element(document, 'textarea', { readonly: '', 'data-locale-value': 'ja' });
    ja.value = field.values.ja;
    jaLabel.append(ja);
    generated.append(enLabel, jaLabel);
    container.append(crumb, heading, sourceLabel, validation, translationStatus, generated);
    editorPanel.replaceChildren(container);
    fieldNodes.set(selectedFieldId, { source, en, ja, validation, translationStatus });
    updateCurrentFieldState();

    source.addEventListener('input', () => {
      const current = fields()[selectedFieldId];
      const error = validationMessage(current, source.value);
      validation.textContent = error;
      source.setAttribute('aria-invalid', String(Boolean(error)));
      if (error) {
        saveStatus.textContent = '存在无效字段';
        return;
      }
      const next = contentStore.document;
      next.fields[selectedFieldId].values['zh-CN'] = source.value;
      contentStore.replace(next);
      saveStatus.textContent = '正在保存';
      channel.publish(next);
      void storage.saveDraft(next).then(() => { saveStatus.textContent = '已保存'; });
      scheduleTranslation(selectedFieldId);
    });
  };

  const renderTasks = () => {
    const currentJobs = [...latestJobsByField(jobs).values()]
      .filter((job) => !['complete', 'superseded'].includes(job.status))
      .sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
    queueStatus.textContent = `待处理 ${currentJobs.length}`;
    retryButton.disabled = !currentJobs.some((job) => job.status === 'waiting-manual');
    const list = taskPanel.querySelector('[data-task-list]');
    list.replaceChildren(...currentJobs.slice(0, 8).map((job) => {
      const row = element(document, 'div', { 'data-task': job.jobId });
      row.append(
        element(document, 'code', {}, job.fieldId),
        element(document, 'span', { 'data-task-status': '' }, STATUS_LABELS[job.status]),
      );
      if (job.status === 'waiting-manual') {
        const retry = element(document, 'button', {
          type: 'button', 'data-retry-job': job.jobId, 'aria-label': `重试 ${job.fieldId}`,
        }, '重试');
        row.append(retry);
      }
      return row;
    }));
    if (!currentJobs.length) list.append(element(document, 'p', {}, '没有待处理任务'));
  };

  const selectGroup = (group) => {
    currentGroup = group;
    search.value = '';
    selectedFieldId = Object.keys(fields()).find((id) => fields()[id].group === group);
    renderGroups();
    renderFieldList();
    renderEditor();
  };

  groupList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-group]');
    if (button) selectGroup(button.dataset.group);
  });
  fieldList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-field-nav]');
    if (!button) return;
    selectedFieldId = button.dataset.fieldNav;
    renderFieldList();
    renderEditor();
  });
  search.addEventListener('input', () => renderFieldList());

  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pane-tab]');
    if (!button) return;
    root.dataset.activePane = button.dataset.paneTab;
    tabs.querySelectorAll('[role="tab"]').forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab === button));
    });
  });
  previewHeader.querySelector('[data-preview-reload]').addEventListener('click', () => {
    preview.src = preview.src;
  });
  importButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const [file] = fileInput.files;
    if (!file) return;
    try {
      const imported = importContentDocument(await file.text(), contentStore.document);
      contentStore.replace(imported);
      await storage.saveDraft(imported);
      channel.publish(imported);
      saveStatus.textContent = '导入完成';
      renderGroups();
      renderFieldList();
      renderEditor();
    } catch (error) {
      saveStatus.textContent = error.message;
    } finally {
      fileInput.value = '';
    }
  });
  exportButton.addEventListener('click', () => {
    const result = createContentExport(contentStore.document, jobs, defaults);
    download('portfolio-content.json', result.contentJson);
    if (result.unresolvedCount) download('portfolio-content-unresolved.json', result.reportJson);
    saveStatus.textContent = result.unresolvedCount
      ? `已导出，${result.unresolvedCount} 项沿用旧译文`
      : '已导出完整三语内容';
  });
  retryButton.addEventListener('click', () => { void queue.retryAll(); });
  taskPanel.addEventListener('click', (event) => {
    const retry = event.target.closest('[data-retry-job]');
    if (retry) void queue.retry(retry.dataset.retryJob);
  });
  resetButton.addEventListener('click', async () => {
    if (!confirmAction('清除本地草稿和翻译任务？已发布 JSON 不会改变。')) return;
    await storage.clear();
    contentStore.replace(defaults);
    jobs = [];
    saveStatus.textContent = '已重置本地草稿';
    renderGroups();
    renderFieldList();
    renderEditor();
    renderTasks();
  });

  queue.subscribe((nextJobs) => {
    jobs = nextJobs;
    renderTasks();
    updateCurrentFieldState();
  });
  renderGroups();
  renderFieldList();
  renderEditor();
  renderTasks();
  if (!storage.persistent) saveStatus.textContent = '本地持久化不可用，本次内容仅保存在当前页面';
  return { element: root, renderEditor };
}
