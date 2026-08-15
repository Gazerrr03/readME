# Interactive buttons

Interactive buttons open a content container rather than a single flat page.
The shared interaction is:

```text
desktop launcher -> folder view -> content viewer -> back to folder
```

Desktop items use selection plus double-click; coarse-pointer devices use a
single tap. The shared lifecycle lives in `shared/folder-browser.js`, while
photos, albums, games, and books keep their content-specific adapters in their
own directories.
