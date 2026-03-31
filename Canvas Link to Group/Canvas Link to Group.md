# Investigation - Aliased link issue
- Link DOM for normal links: `<span class="cm-hmd-internal-link"><a ...>Perfume.canvas#Group</a></span>`.
- For aliased links: `<span class="cm-hmd-internal-link cm-link-alias"><a ...>AliasText</a></span>`.
- Obsidian does **not** store the actual link target in the DOM (`data-href`, `aria-label`, etc. = null).
- The true target is available only through `app.metadataCache.getFileCache(file).links`.
- Each `linkCache` object has:
	- `link` → actual link target (`Perfume.canvas#Group`)
	- `displayText` → alias (`AliasText`)
# Implemented fix
1. Detect if parent span has `cm-link-alias`.
2. On click, get active file’s metadata cache.
3. Iterate `fileCache.links`; find where `displayText === clickedText`.
4. Use `linkCache.link` in `handleCanvasLink()`.
5. Works for both normal and aliased links.
# Optional optimization paths discussed
- **DOM position (posAtDOM):** good for editor mode only; unusable on mobile → rejected.
- **Raw markdown parsing:** possible fallback but heavier.
- **Final choice:** metadata‑cache lookup (fast, works everywhere).
# Additional improvement
- Clean redundant duplicate handler block.
- Aliased and regular link logic merged.
# Auto‑update Feature (QoL idea)
Goal: when a group name in a canvas file changes, automatically update all Markdown links pointing to it.
Explored methods:
1. `vault.on('modify')` → detect `.canvas` edits **(preferred)**
	- Read previous canvas JSON (cached).
	- Compare old vs new `nodes` by ID → if `label` changed → record rename.
	- For each `{canvasName, oldName, newName}` → iterate `vault.getMarkdownFiles()`.
	- Replace `[[canvas.canvas#oldName]]` with `[[canvas.canvas#newName]]`, preserving aliases.
	- Use `vault.process()` for safe atomic writes.
	- Notify user via `new Notice()`.
2. Other ideas (manual command, modal prompt, `Canvas API` hook) deemed less stable or too manual.
Main hurdles:
- Need to cache old canvas state between modifications.
- Regex edge cases for group names.
- Avoid infinite loops and performance overhead.
- TypeScript typing problems (`renames` array mis‑typed) → to be fixed later.
# Final plugin state
- Version **0.0.6** released.
- Fix for aliased links successfully published; linked to [GitHub Issue #3](https://github.com/TGRRRR/Canvas-link-to-group/issues/3).
- Auto‑update feature design drafted but postponed due to TS errors.
**Result:**
Plugin now correctly resolves aliased canvas links; auto‑update logic concept validated for future version.