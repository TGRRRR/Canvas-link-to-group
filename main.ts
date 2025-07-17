import { Plugin, TFile, Notice, WorkspaceLeaf } from 'obsidian';

export default class CanvasLinkToGroupPlugin extends Plugin {

	async onload() {
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			const target = evt.target as HTMLElement;

			// The user might click on an element inside the link, so we look for the closest ancestor `a` tag.
			const link = target.closest('a');
			if (!link) return;

			// In Live Preview/Reading mode, the link destination is in the 'data-href' attribute.
			// In Source Mode, it is the text content of the link itself.
			// We check for data-href first, and fall back to textContent.
			const linkTextFromData = link.getAttribute('data-href');
			const linkTextFromContent = link.textContent;
			const linkText = linkTextFromData || linkTextFromContent;

			if (linkText && linkText.includes('.canvas#group:')) {
				evt.preventDefault(); // Prevent Obsidian's default link handling.
				this.handleCanvasLink(linkText);
			}
		}, { capture: true });
	}

	onunload() {

	}

	async handleCanvasLink(linkText: string) {
		const [canvasPath, groupNameEncoded] = linkText.split('#group:');
		const groupName = decodeURIComponent(groupNameEncoded);
		const canvasFile = this.app.vault.getAbstractFileByPath(canvasPath);

		if (!(canvasFile instanceof TFile)) {
			new Notice(`Canvas file not found: ${canvasPath}`);
			return;
		}

		let leaf: WorkspaceLeaf | undefined = this.app.workspace.getLeavesOfType('canvas').find(l => {
			const view = (l.view as any);
			return view.file === canvasFile;
		});

		if (leaf) {
			this.app.workspace.setActiveLeaf(leaf, { focus: true });
		} else {
			leaf = this.app.workspace.getLeaf(true);
			await leaf.openFile(canvasFile);
		}

		this.jumpToGroup(groupName, leaf);
	}

	jumpToGroup(groupName: string, leaf: WorkspaceLeaf) {
		const canvasView = leaf.view as any;
		
		// The canvas data is not always immediately available, so we wait for it.
		// We use an interval to check until the canvas is ready.
		const interval = setInterval(() => {
			// The `canvas` object is the key to interacting with the canvas.
			const canvas = canvasView.canvas;
			if (!canvas) return;
			
			// `canvas.nodes` holds all the nodes in the canvas.
			// We check if it's populated before trying to find our group.
			if (canvas.nodes && canvas.nodes.size > 0) {
				clearInterval(interval); // Stop checking once we have the nodes.

				const groupNode = Array.from(canvas.nodes.values()).find(
					(node: any) => node.unknownData?.type === 'group' && node.label === groupName
				);

				if (groupNode) {
					// These are the correct, documented methods to focus on a node.
					canvas.selectOnly(groupNode);
					canvas.zoomToSelection();
				} else {
					new Notice(`Group "${groupName}" not found in the canvas.`);
				}
			}
		}, 100); // Check every 100ms.

		// Failsafe to stop the interval after a while if the canvas never loads.
		setTimeout(() => {
			clearInterval(interval);
		}, 5000);
	}
}
