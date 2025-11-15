import { Plugin, TFile, Notice, WorkspaceLeaf, Menu, ItemView, EditorSuggest, Editor, EditorPosition, EditorSuggestContext, EditorSuggestTriggerInfo, App } from 'obsidian';

export default class CanvasLinkToGroupPlugin extends Plugin {

	async onload() {
		// HANDLES CLICKING ON A LINK
		this.registerDomEvent(document, 'mousedown', (evt: MouseEvent) => {
			// Only handle left-clicks and middle-clicks
			if (evt.button !== 0 && evt.button !== 1) return;

			const target = evt.target as HTMLElement;
			const link = target.closest('a');
			if (!link) return;

			const linkTextFromData = link.getAttribute('data-href');
			const linkTextFromContent = link.textContent;
			const linkText = linkTextFromData || linkTextFromContent;
			
			// Check if this is an aliased link
			const isAliasedLink = link.parentElement?.classList.contains('cm-link-alias');
			
			if (isAliasedLink && linkText) {
				// For aliased links, we need to look up the actual link from the metadata cache
				const currentFile = this.app.workspace.getActiveFile();
				if (!currentFile) return;
				
				const fileCache = this.app.metadataCache.getFileCache(currentFile);
				const links = fileCache?.links || [];
				
				// Find the link where this text is the displayText
				for (const linkCache of links) {
					const displayText = linkCache.displayText || linkCache.link;
					if (displayText === linkText && linkCache.link.includes('.canvas#')) {
						// Found it! Use the actual link
						evt.preventDefault();
						evt.stopImmediatePropagation();
						
						const sourceElement = target.closest('[data-source-path]');
						let sourcePath = '';
						if (sourceElement) {
							sourcePath = sourceElement.getAttribute('data-source-path') || '';
						} else {
							const activeFile = this.app.workspace.getActiveFile();
							if (activeFile) sourcePath = activeFile.path;
						}
						
						const openInNewTab = evt.button === 1 || evt.ctrlKey || evt.metaKey;
						this.handleCanvasLink(linkCache.link, sourcePath, openInNewTab);
						break;
					}
				}
			} else if (linkText && linkText.includes('.canvas#')) {
				// Regular link - use existing logic
				evt.preventDefault();
				evt.stopImmediatePropagation();
				
				const sourceElement = target.closest('[data-source-path]');
				let sourcePath = '';
				if (sourceElement) {
					sourcePath = sourceElement.getAttribute('data-source-path') || '';
				} else {
					const activeFile = this.app.workspace.getActiveFile();
					if (activeFile) sourcePath = activeFile.path;
				}
				
				const openInNewTab = evt.button === 1 || evt.ctrlKey || evt.metaKey;
				this.handleCanvasLink(linkText, sourcePath, openInNewTab);
			}
			

			// Use the new, simplified link format
			if (linkText && linkText.includes('.canvas#')) {
				// Prevent Obsidian's default navigation and stop other listeners.
				evt.preventDefault();
				evt.stopImmediatePropagation();
				
				const sourceElement = target.closest('[data-source-path]');
				let sourcePath = '';
				if (sourceElement) {
					sourcePath = sourceElement.getAttribute('data-source-path') || '';
				} else {
					const activeFile = this.app.workspace.getActiveFile();
					if (activeFile) sourcePath = activeFile.path;
				}

				const openInNewTab = evt.button === 1 || evt.ctrlKey || evt.metaKey;
				this.handleCanvasLink(linkText, sourcePath, openInNewTab);
			}
		}, { capture: true });

		// ADDS RIGHT-CLICK CONTEXT MENU ITEM
		this.registerEvent(
			this.app.workspace.on('canvas:node-menu' as any, this.addCopyToClipboardMenuItem)
		);

		// ADDS COMMAND PALETTE COMMAND
		this.addCommand({
			id: 'copy-canvas-group-link',
			name: 'Copy link to selected group',
			checkCallback: (checking: boolean) => {
				const activeView = this.app.workspace.getActiveViewOfType(ItemView);
				if (activeView?.getViewType() !== 'canvas') {
					return false; // Command is not available if not in a canvas
				}

				// If checking, we just confirmed it's a canvas, so the command should be available.
				if (checking) {
					return true;
				}

				// If not checking, we are executing the command.
				const canvasView = activeView as any;
				const selection = canvasView.canvas?.selection;

				if (!selection || selection.size !== 1) {
					new Notice("Please select a single group to copy its link.");
					return;
				}

				const selectedNode = selection.values().next().value;
				if (selectedNode?.unknownData?.type !== 'group') {
					new Notice("The selected item is not a group.");
					return;
				}

				// All checks passed, perform the action
				const canvasPath = canvasView.file.name;
				const groupName = selectedNode.label;
				const linkText = `[[${canvasPath}#${groupName}]]`;
				navigator.clipboard.writeText(linkText);
				new Notice(`Copied link to group "${groupName}"`);
			}
		});

		// REGISTER THE GROUP AUTOCOMPLETE SUGGESTER
		this.registerEditorSuggest(new GroupSuggest(this.app));
	}

	// CONTEXT MENU HANDLER
	addCopyToClipboardMenuItem = (menu: Menu, node: any) => {
		if (node.unknownData?.type !== 'group') {
			return;
		}

		const activeView = this.app.workspace.getActiveViewOfType(ItemView);
		if (!activeView || activeView.getViewType() !== 'canvas') return;
		const canvasFile = (activeView as any).file;
		if (!canvasFile) return;

		menu.addItem((item) => {
			item
				.setTitle("Copy link to group")
				.setIcon("link")
				.onClick(() => {
					const canvasPath = canvasFile.name;
					const groupName = node.label;
					// Use the new, simplified link format
					const linkText = `[[${canvasPath}#${groupName}]]`;
					navigator.clipboard.writeText(linkText);
					new Notice(`Copied link to group "${groupName}"`);
				});
		});
	}

	// LINK CLICK HANDLER - UPDATED VERSION
	async handleCanvasLink(linkText: string, sourcePath: string, newLeaf: boolean) {
		// Use the new, simplified link format
		const parts = linkText.split('#');
		if (parts.length < 2 || !parts) {
			return;
		}

		const [canvasPath, groupName] = parts;

		await this.app.workspace.openLinkText(canvasPath, sourcePath, newLeaf);
		
		const activeView = this.app.workspace.getActiveViewOfType(ItemView);
		if (activeView) {
			this.jumpToGroup(groupName, activeView.leaf);
		}       
	}


	// JUMP TO GROUP LOGIC
	jumpToGroup(groupName: string, leaf: WorkspaceLeaf) {
		const canvasView = leaf.view as any;
		
		let retries = 50; // 5 seconds timeout
		const interval = setInterval(() => {
			retries--;
			const canvas = canvasView.canvas;

			if (!canvas || !canvas.nodes || retries <= 0) {
				clearInterval(interval);
				return;
			}
			
			const groupNodes = Array.from(canvas.nodes.values()).filter(
				(node: any) => node.unknownData?.type === 'group' && node.label === groupName
			);

			if (groupNodes.length > 0) {
				clearInterval(interval);

				if (groupNodes.length > 1) {
					new Notice(`Found ${groupNodes.length} groups named "${groupName}". Jumping to the first one.`);
				}

				const groupNode = groupNodes[0];
				canvas.selectOnly(groupNode);
				canvas.zoomToSelection();
			}
		}, 100);
	}
}

class GroupSuggest extends EditorSuggest<string> {
	app: App;

	constructor(app: App) {
		super(app);
		this.app = app;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line);
		const sub = line.substring(0, cursor.ch);
		// Regex to trigger on [[CanvasFile.canvas#...
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
		// Use getFirstLinkpathDest which is reliable in this context
		const canvasFile = this.app.metadataCache.getFirstLinkpathDest(canvasPath, sourcePath);

		if (!canvasFile) return [];

		try {
			const fileContent = await this.app.vault.cachedRead(canvasFile);
			const canvasData = JSON.parse(fileContent);

			if (!canvasData.nodes || !Array.isArray(canvasData.nodes)) return [];

			// Filter for groups, map to their labels, and then filter by the user's query
			return canvasData.nodes
				.filter((node: any) => node.type === 'group' && node.label)
				.map((node: any) => node.label)
				.filter((label: string) =>
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

	selectSuggestion(suggestion: string, evt: MouseEvent | KeyboardEvent): void {
		if (!this.context) return;
		
		const activeEditor = this.context.editor;
		activeEditor.replaceRange(suggestion, this.context.start, this.context.end);
	}
}
