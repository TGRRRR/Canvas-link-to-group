import { Plugin, TFile, Notice, WorkspaceLeaf, Menu, ItemView } from 'obsidian';

export default class CanvasLinkToGroupPlugin extends Plugin {

	async onload() {
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			const target = evt.target as HTMLElement;

			const link = target.closest('a');
			if (!link) return;

			const linkTextFromData = link.getAttribute('data-href');
			const linkTextFromContent = link.textContent;
			const linkText = linkTextFromData || linkTextFromContent;

			if (linkText && linkText.includes('.canvas#group:')) {
				// Find source path from the DOM element context for robust link resolution
				const sourceElement = target.closest('[data-source-path]');
				let sourcePath = '';
				if (sourceElement) {
					sourcePath = sourceElement.getAttribute('data-source-path') || '';
				} else {
					// Fallback to active file if source path is not in the DOM
					const activeFile = this.app.workspace.getActiveFile();
					if (activeFile) sourcePath = activeFile.path;
				}

				evt.preventDefault(); // Prevent Obsidian's default link handling.
				this.handleCanvasLink(linkText, sourcePath);
			}
		}, { capture: true });

		this.registerEvent(
			this.app.workspace.on('canvas:node-menu' as any, this.addCopyToClipboardMenuItem)
		);
	}

	onunload() {
		this.app.workspace.off('canvas:node-menu' as any, this.addCopyToClipboardMenuItem);
	}

	addCopyToClipboardMenuItem = (menu: Menu, node: any) => {
		if (node.unknownData?.type !== 'group') {
			return;
		}

		const activeView = this.app.workspace.getActiveViewOfType(ItemView);
		if (!activeView || activeView.getViewType() !== 'canvas') {
			return;
		}

		const canvasView = activeView as any;
		const canvasFile = canvasView.file;
		if (!canvasFile) {
			return;
		}

		menu.addItem((item) => {
			item
				.setTitle("Copy link to group")
				.setIcon("link")
				.onClick(() => {
					const canvasPath = canvasFile.name; // Use .name instead of .path
					const groupName = node.label;
					const linkText = `[[${canvasPath}#group:${groupName}]]`;
					navigator.clipboard.writeText(linkText);
					new Notice(`Copied link to group "${groupName}"`);
				});
		});
	}

	async handleCanvasLink(linkText: string, sourcePath: string) {
		const parts = linkText.split('#group:');
		if (parts.length < 2 || !parts[1]) {
			return;
		}

		const [canvasPath, groupNameEncoded] = parts;
		const groupName = decodeURIComponent(groupNameEncoded);

		// Use Obsidian's native link handling to open the canvas.
		// This is the most reliable way to ensure the correct file is opened.
		await this.app.workspace.openLinkText(canvasPath, sourcePath, false);

		// After opening, the correct canvas should be the active view.
		const activeView = this.app.workspace.getActiveViewOfType(ItemView);
		if (!activeView || activeView.getViewType() !== 'canvas') {
			new Notice("Could not jump to group: Active view is not a canvas.");
			return;
		}

		this.jumpToGroup(groupName, activeView.leaf);
	}

	jumpToGroup(groupName: string, leaf: WorkspaceLeaf) {
		const canvasView = leaf.view as any;
		
		let retries = 50; // 5 seconds timeout (50 * 100ms)
		const interval = setInterval(() => {
			retries--;
			const canvas = canvasView.canvas;

			if (!canvas || !canvas.nodes || retries <= 0) {
				clearInterval(interval);
				if (retries <= 0) {
					new Notice(`Group "${groupName}" not found in canvas (timed out).`);
				}
				return;
			}
			
			const groupNode = Array.from(canvas.nodes.values()).find(
				(node: any) => node.unknownData?.type === 'group' && node.label === groupName
			);

			if (groupNode) {
				clearInterval(interval);
				canvas.selectOnly(groupNode);
				canvas.zoomToSelection();
			}
		}, 100);
	}
}
