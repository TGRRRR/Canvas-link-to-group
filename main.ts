import { Plugin, TFile, Notice, WorkspaceLeaf, Menu, ItemView, EditorSuggest, Editor, EditorPosition, EditorSuggestContext, EditorSuggestTriggerInfo, App, EventRef } from 'obsidian';

declare const activeDocument: Document;

interface CanvasNodeData {
	type: string;
	label?: string;
}

export default class CanvasLinkToGroupPlugin extends Plugin {

	onload() {
		this.registerDomEvent(activeDocument, 'mousedown', (evt: MouseEvent) => {
			if (evt.button !== 0 && evt.button !== 1) return;

			const target = evt.target as HTMLElement;
			const linkEl = target.closest('.cm-hmd-internal-link, .internal-link, a[data-href]');
			if (!linkEl) return;

			const linkText = linkEl.getAttribute('data-href') || linkEl.textContent;
			if (!linkText) return;

			const isAliasedLink = linkEl.classList.contains('cm-link-alias') || linkEl.parentElement?.classList.contains('cm-link-alias');

			if (isAliasedLink) {
				const currentFile = this.app.workspace.getActiveFile();
				if (!currentFile) return;

				const fileCache = this.app.metadataCache.getFileCache(currentFile);
				const links = fileCache?.links || [];

				for (const linkCache of links) {
					const displayText = linkCache.displayText || linkCache.link;
					if (displayText === linkText && linkCache.link.includes('.canvas#')) {
						evt.preventDefault();
						evt.stopImmediatePropagation();

						const sourcePath = this.getSourcePath(target);
						const openInNewTab = evt.button === 1 || evt.ctrlKey || evt.metaKey;
						void this.handleCanvasLink(linkCache.link, sourcePath, openInNewTab);
						break;
					}
				}
			} else if (linkText.includes('.canvas#')) {
				evt.preventDefault();
				evt.stopImmediatePropagation();

				const sourcePath = this.getSourcePath(target);
				const openInNewTab = evt.button === 1 || evt.ctrlKey || evt.metaKey;
				void this.handleCanvasLink(linkText, sourcePath, openInNewTab);
			}
		}, { capture: true });

	// Canvas events are not typed in the Obsidian API
	const workspace = this.app.workspace as unknown as {
		on(name: 'canvas:node-menu', callback: (menu: Menu, node: CanvasNode) => void): EventRef;
	};
	this.registerEvent(
		workspace.on('canvas:node-menu', this.addCopyToClipboardMenuItem)
	);

		this.addCommand({
			id: 'copy-canvas-group-link',
			name: 'Copy link to selected group',
			checkCallback: (checking: boolean) => {
				const activeView = this.app.workspace.getActiveViewOfType(ItemView);
				if (activeView?.getViewType() !== 'canvas') {
					return false;
				}

				if (checking) {
					return true;
				}

				const canvasView = activeView as CanvasView;
				const selection = canvasView.canvas?.selection;

				if (!selection || selection.size !== 1) {
					new Notice("Please select a single group to copy its link.");
					return;
				}

				const selectedNode = selection.values().next().value as CanvasNode | undefined;
				if (selectedNode?.unknownData?.type !== 'group') {
					new Notice("The selected item is not a group.");
					return;
				}

				const canvasPath = canvasView.file.name;
				const groupName = selectedNode.label;
				const linkText = `[[${canvasPath}#${groupName}]]`;
				void navigator.clipboard.writeText(linkText);
				new Notice(`Copied link to group "${groupName}"`);
			}
		});

		this.registerEditorSuggest(new GroupSuggest(this.app));
	}

	addCopyToClipboardMenuItem = (menu: Menu, node: CanvasNode) => {
		if (node.unknownData?.type !== 'group') {
			return;
		}

		const activeView = this.app.workspace.getActiveViewOfType(ItemView);
		if (!activeView || activeView.getViewType() !== 'canvas') return;
		const canvasFile = (activeView as CanvasView).file;
		if (!canvasFile) return;

		menu.addItem((item) => {
			item
				.setTitle("Copy link to group")
				.setIcon("link")
				.onClick(() => {
					const canvasPath = canvasFile.name;
					const groupName = node.label;
					const linkText = `[[${canvasPath}#${groupName}]]`;
					void navigator.clipboard.writeText(linkText);
					new Notice(`Copied link to group "${groupName}"`);
				});
		});
	}

	private getSourcePath(target: HTMLElement): string {
		const sourceElement = target.closest('[data-source-path]');
		if (sourceElement) {
			return sourceElement.getAttribute('data-source-path') || '';
		}
		const activeFile = this.app.workspace.getActiveFile();
		return activeFile ? activeFile.path : '';
	}

	async handleCanvasLink(linkText: string, sourcePath: string, newLeaf: boolean) {
		const parts = linkText.split('#');
		if (parts.length < 2) {
			return;
		}

		const [canvasPath, groupName] = parts;

		await this.app.workspace.openLinkText(canvasPath, sourcePath, newLeaf);

		const activeView = this.app.workspace.getActiveViewOfType(ItemView);
		if (activeView) {
			this.jumpToGroup(groupName, activeView.leaf);
		}
	}

	jumpToGroup(groupName: string, leaf: WorkspaceLeaf) {
		const canvasView = leaf.view as CanvasView;

		let retries = 50;
		const intervalId = window.setInterval(() => {
			retries--;
			const canvas = canvasView.canvas;

			if (!canvas || !canvas.nodes || retries <= 0) {
				window.clearInterval(intervalId);
				return;
			}

			const groupNodes = Array.from(canvas.nodes.values()).filter(
				(node: CanvasNode) => node.unknownData?.type === 'group' && node.label === groupName
			);

			if (groupNodes.length > 0) {
				window.clearInterval(intervalId);

				if (groupNodes.length > 1) {
					new Notice(`Found ${groupNodes.length} groups named "${groupName}". Jumping to the first one.`);
				}

				const groupNode = groupNodes[0];
				canvas.selectOnly(groupNode);
				canvas.zoomToSelection();
			}
		}, 100);

		this.registerInterval(intervalId);
	}
}

interface CanvasNode {
	unknownData?: {
		type: string;
	};
	label?: string;
}

interface Canvas {
	selection: Set<CanvasNode>;
	nodes: Map<string, CanvasNode>;
	selectOnly(node: CanvasNode): void;
	zoomToSelection(): void;
}

interface CanvasView extends ItemView {
	canvas: Canvas;
	file: TFile;
}

class GroupSuggest extends EditorSuggest<string> {
	app: App;

	constructor(app: App) {
		super(app);
		this.app = app;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line);
		const sub = line.substring(0, cursor.ch);
		const match = sub.match(/\[\[([^\]]+\.canvas)#([\w\s]*)$/);
		if (match) {
			return {
				end: cursor,
				start: {
					line: cursor.line,
					ch: sub.lastIndexOf(match[2]),
				},
				query: match[2],
			};
		}
		return null;
	}

	async getSuggestions(context: EditorSuggestContext): Promise<string[]> {
		const fileLinkMatch = context.editor
			.getLine(context.start.line)
			.substring(0, context.start.ch)
			.match(/\[\[([^\]]+\.canvas)#$/);

		if (!fileLinkMatch) return [];

		const canvasPath = fileLinkMatch[1];
		const sourcePath = context.file?.path || "";
		const canvasFile = this.app.metadataCache.getFirstLinkpathDest(canvasPath, sourcePath);

		if (!canvasFile) return [];

		try {
			const fileContent = await this.app.vault.cachedRead(canvasFile);
			const canvasData = JSON.parse(fileContent) as { nodes?: CanvasNodeData[] };

			if (!canvasData.nodes || !Array.isArray(canvasData.nodes)) return [];

			return canvasData.nodes
				.filter((node) => node.type === 'group' && node.label)
				.map((node) => node.label as string)
				.filter((label) =>
					label.toLowerCase().includes(context.query.toLowerCase())
				);
		} catch (e) {
			console.error('Canvas Link to Group: Error reading or parsing canvas file for suggestions.', e);
			return [];
		}
	}

	renderSuggestion(suggestion: string, el: HTMLElement): void {
		el.setText(suggestion);
	}

	selectSuggestion(suggestion: string, _evt: MouseEvent | KeyboardEvent): void {
		if (!this.context) return;

		const activeEditor = this.context.editor;
		activeEditor.replaceRange(suggestion, this.context.start, this.context.end);
	}
}
