# Obsidian Canvas Link to Group

This plugin for Obsidian allows you to create direct links to groups within a canvas, and when you click them, the canvas will automatically open and pan to that specific group.

## How to Use

### Linking to a Group

1.  **Create a Canvas**: Make a new canvas in Obsidian.
2.  **Create Groups**: Inside the canvas, create one or more groups and give them unique names (e.g., "My Ideas", "Project Steps").
3.  **Create a Link**: In any markdown note, create a link with the following format:
    
    `[[YourCanvasName.canvas#group:YourGroupName]]`
    
    For example:
    
    `[[ProjectPlan.canvas#group:Phase 1]]`
    
4.  **Click the Link**: Click the link in your note. The plugin will open the `ProjectPlan.canvas` and automatically navigate to the "Phase 1" group.

### Copying a Link to a Group

1.  Open a canvas.
2.  Right-click on the group you want to link to.
3.  Select "Copy link to group" from the context menu.
4.  The link will be copied to your clipboard, ready to be pasted into any note.

## Installation

Once this plugin is available in the community plugin browser, you will be able to install it from there. For now, you can install it manually:

1.  Download the `main.js`, `manifest.json`, and `styles.css` files from the latest release.
2.  In your Obsidian vault, go to `Settings` > `Community plugins`.
3.  Make sure "Restricted mode" is off.
4.  Open the plugins folder by clicking the small folder icon.
5.  Create a new folder named `canvas-link-to-group`.
6.  Copy the downloaded files into this new folder.
7.  Go back to the Community Plugins settings page and click the "Reload plugins" button.
8.  Enable the "Canvas Link to Group" plugin.
