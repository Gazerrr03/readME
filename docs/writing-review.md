# 本地内容审校模式

`/writing/` 是仅用于本地审核站点文案的工作区。中文是唯一可直接编辑的源语言；英文和日文由同源翻译 API 生成，并保持只读。

## 使用流程

1. 启动本地静态服务器并打开 `/writing/`。
2. 通过左侧分组或搜索找到字段，编辑中文内容。
3. 在右侧真实站点预览中检查文案，同时继续使用窗口、拖动、键盘导航和语言切换等正常交互。
4. 查看“翻译任务”状态。首次 API 失败会保留旧译文并记录任务；重新打开路由或网络恢复时会自动重试一次。
5. 自动重试再次失败后，使用“重试失败项”手动处理任务。
6. 点击“导出 JSON”得到 `portfolio-content.json`。存在未解决任务时，还会下载 `portfolio-content-unresolved.json`；主文件仍可发布，并沿用此前有效的英文和日文。
7. 检查未解决报告，将确认后的主文件替换为 `content/content.json`。
8. 重新加载 `/`，验证已发布文案和站点交互。

草稿与翻译任务保存在浏览器 IndexedDB 的 `portfolio-writing` 数据库中。“重置草稿”只清除本地审校数据，不修改已发布 JSON。若 IndexedDB 不可用，页面会提示当前内容只能在本次会话中保存。

## 翻译 API

本地服务需要实现同源 `POST /api/translate`。浏览器不会保存 API 密钥、提示词或模型配置；这些内容由服务端管理。

请求格式：

```json
{
  "sourceLocale": "zh-CN",
  "targetLocales": ["en", "ja"],
  "items": [
    {
      "id": "ui.site.title",
      "text": "凌晨两点，不存在的频率",
      "kind": "shortText",
      "preserveTokens": []
    }
  ]
}
```

成功响应格式：

```json
{
  "translations": [
    {
      "id": "ui.site.title",
      "values": {
        "en": "Two A.M., A Frequency That Does Not Exist",
        "ja": "午前二時、存在しない周波数"
      }
    }
  ]
}
```

非 2xx、超时、空译文、缺少目标语言、无效响应或丢失 `preserveTokens` 都会转为可恢复任务。响应晚于新的中文修订时会被丢弃，不能覆盖较新的内容。
