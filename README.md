# Gmail Label Extension

Gmail Label Extension is a Chrome extension that automatically creates and applies Gmail labels based on custom rules.

## Features

- Automatically apply labels based on sender name, email address, subject, and message content
- Customizable label colors
- Support for multiple rules
- Import/Export functionality for rules
- Real-time email monitoring and automatic labeling

## Installation

1. Clone or download this repository
2. Open `chrome://extensions` in Chrome browser
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the downloaded folder

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

- Compliant with Manifest V3
- Content scripts for Gmail page monitoring
- Chrome Storage Sync API for rule synchronization
- MutationObserver for dynamic email list updates

## License

Please see the [LICENSE](LICENSE) file for details.
