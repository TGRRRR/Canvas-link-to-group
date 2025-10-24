# Canvas Link to Group

This plugin enables you to create links to specific groups within Canvases and jump to them in 1 click!
![Usecase](<Use Example.gif>)

# Features

### Direct Linking to Groups
Jump directly to any group in a canvas from a link in your notes.

### Intelligent Link Handling
The plugin provides flexible navigation options:
 - **Left-click** a link to open the canvas in the current tab
 - **`Ctrl/Cmd + Click`** (or **Middle-click**) to open it in a new tab.
![Link Handling](<Features Example.gif>)

### Easy Link Creation
Create links effortlessly with multiple methods:
- **Context Menu**: **Right-click** any group and select "Copy link to group."
- **Command Palette**: Select a single group and use the "Copy link to selected group" command.
- **custom hotkey** for keyboard-driven workflows (Empty by default, assign to your liking (`CTRL + SHIFT + C` suggested))

### Notifications
The plugin provides helpful feedback to guide you:
- Notify if you try to copy a link without a group selected.
- Notify if you jump to a group name that is used multiple times in the same canvas.

# How to Use

### Creating a Link to a Group

There are two primary ways to create a link to a group:

##### 1. Context Menu (Right-Click)

This is the most direct method.

1.  Open a canvas.
2.  Right-click on the group you want to link to.
3.  Select **Copy link to group**.
4.  Paste the link (e.g., `[[MyCanvas.canvas#GroupName]]`) into any note.

##### 2. Command Palette

This method is ideal for keyboard-driven workflows.

1.  Open a canvas and select a single group.
2.  Open the command palette (`Ctrl/Cmd + P`).
3.  Search for "Copy link to selected group" and run the command.
4.  Paste the link into any note.

> **Pro Tip**: For even faster access, assign a custom hotkey to this command (e.g., `Ctrl/Cmd + Shift + C`) in Obsidian's `Settings` > `Hotkeys`.

### Using the Link

Once you have a link in a note (e.g., `[[MyProject.canvas#Design Phase]]`), you can click on it:

- **Left-click**: Opens `MyProject.canvas` in your current tab and jumps to the "Design Phase" group.
- **`Ctrl/Cmd + Click`** or **Middle-click**: Opens the canvas in a new tab and jumps to the group.

# Installation

### From Obsidian Community Plugins

obsidian://show-plugin?id=canvas-link-to-group

Or just type in search `Canvas Link to Group`

### Manual Installation

1.  Download the `.zip` file from the latest [GitHub release](https://github.com/quorafind/obsidian-canvas-link-to-group/releases/latest).
2.  Navigate to your Obsidian vault's plugins folder: `<YourVault>/.obsidian/plugins/`.
3.  Create a new folder and name it `canvas-link-to-group`.
4.  Extract the contents of the downloaded `.zip` file into this new folder.
5.  In Obsidian, go to **Settings** > **Community plugins**.
6.  Make sure "Restricted mode" is turned off. You should now see "Canvas Link to Group" in your list of installed plugins.
7.  Click the "Reload plugins" button and then toggle the switch to enable it.

# Attribution
Based on the [Obsidian Sample Plugin template](https://github.com/obsidianmd/obsidian-sample-plugin)
