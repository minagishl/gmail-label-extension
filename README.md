# Gmail Label Extension

Gmail Label Extension is a Chrome extension that automatically creates and applies Gmail labels based on custom rules.

## Features

- Automatically apply labels based on sender name, email address, subject, and message content
- Customizable label colors
- Support for multiple rules
- Import/Export functionality for rules
- Real-time email monitoring and automatic labeling

## Technology Stack

- React 19
- TypeScript
- Tailwind CSS
- Vite

## Development Setup

1. Install dependencies:

```bash
pnpm install
```

2. Start development server:

```bash
pnpm dev
```

3. Build for production:

```bash
pnpm build
```

## Installation

1. Run `pnpm build` to create the production build
2. Open `chrome://extensions` in Chrome browser
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dist` folder

## Usage

1. Open Gmail
2. Click the extension icon in the Chrome toolbar
3. Click "Manage Rules" to open the rules settings
4. Click "Add New Rule" to create a new rule

### Rule Configuration

Each rule can be configured with the following settings:

- **Label Name**: The name of the label to apply
- **Label Color**: Color for visual identification
- **Conditions**:
  - Sender Name
  - Email Address
  - Subject Contains
  - Content Contains

Note: At least one condition must be set.

### Rule Management

- **Edit**: Modify existing rules
- **Delete**: Remove unwanted rules
- **Import/Export**: Save and load rule settings as JSON files

## Technical Details

- Built with React and TypeScript for robust type safety
- Vite for fast development and optimized builds
- Tailwind CSS for utility-first styling
- Chrome Extension Manifest V3 compliant
- Content scripts for Gmail page monitoring
- Chrome Storage Sync API for rule synchronization
- MutationObserver for dynamic email list updates

## Requirements

- Node.js 20 or higher
- pnpm package manager

## License

Please see the [LICENSE](LICENSE) file for details.
