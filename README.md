# Astro Terminal Themes

Convert terminal theme configurations (Ghostty, Warp, iTerm2, etc.) into Tailwind CSS themes for your Astro website.

## Features

- 🎨 **Multiple Terminal Support**: Ghostty, Warp (more coming soon)
- 🔥 **Hot Reloading**: Automatically regenerate CSS when theme files change
- 🚀 **Tailwind 4 Ready**: Uses the new `@theme` directive syntax
- 🔧 **Modular Adapters**: Easy to extend with new terminal formats
- 📁 **Auto-Discovery**: Automatically finds themes in your themes directory
- 🎯 **Two Mapping Modes**: Direct ANSI colors or semantic color names

## Requirements

- **Node.js**: v22.0.0 or higher
- **Astro**: v5.0.0 or higher

## Installation

```bash
npm install astro-terminal-themes
```

## Setup

### 1. Add to Astro Config

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import terminalThemes from 'astro-terminal-themes';

export default defineConfig({
  integrations: [
    terminalThemes({
      themesDir: './themes',           // Where your theme files are stored
      outputFile: './src/styles/theme.css',  // Generated CSS output
      semanticMapping: false,          // Use semantic names (primary, accent) vs direct (red, blue)
      defaultTheme: 'my-theme'        // Default theme name (optional)
    })
  ]
});
```

### 2. Create Themes Directory

```bash
mkdir themes
```

### 3. Add Theme Files

**Ghostty Theme** (`themes/my-theme.conf`):
```conf
palette = 0=#22212C
palette = 1=#FF9580
palette = 2=#8AFF80
palette = 3=#FFFF80
palette = 4=#9580FF
palette = 5=#FF80BF
palette = 6=#80FFEA
palette = 7=#F8F8F2
palette = 8=#504C67
palette = 9=#FFAA99
palette = 10=#A2FF99
palette = 11=#FFFF99
palette = 12=#AA99FF
palette = 13=#FF99CC
palette = 14=#99FFEE
palette = 15=#FFFFFF
background = #22212C
foreground = #F8F8F2
cursor-color = #7970A9
selection-background = #454158
selection-foreground = #F8F8F2
```

**Warp Theme** (`themes/my-theme.yaml`):
```yaml
name: Custom Theme
accent: '#268bd2'
cursor: '#95D886'
background: '#002b36'
foreground: '#839496'
details: darker
terminal_colors:
  bright:
    black: '#002b36'
    blue: '#839496'
    cyan: '#93a1a1'
    green: '#586e75'
    magenta: '#6c71c4'
    red: '#cb4b16'
    white: '#fdf6e3'
    yellow: '#657b83'
  normal:
    black: '#073642'
    blue: '#268bd2'
    cyan: '#2aa198'
    green: '#859900'
    magenta: '#d33682'
    red: '#dc322f'
    white: '#eee8d5'
    yellow: '#b58900'
```

### 4. Import Generated CSS

Add the generated theme CSS to your main stylesheet:

```css
/* src/styles/global.css */
@import './theme.css';
@import 'tailwindcss';
```

Or import it in your Astro layout:

```astro
---
// src/layouts/Layout.astro
import '../styles/theme.css';
---
```

## Usage

### Direct Color Mapping (Default)

With `semanticMapping: false`, colors map directly to ANSI names:

```html
<div class="bg-background text-foreground">
  <h1 class="text-red">Error Message</h1>
  <p class="text-green">Success Message</p>
  <button class="bg-blue text-white">Primary Button</button>
  <div class="border-bright-black">Card with border</div>
</div>
```

Available colors:
- `background`, `foreground`
- `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`
- `bright-black`, `bright-red`, `bright-green`, `bright-yellow`, `bright-blue`, `bright-magenta`, `bright-cyan`, `bright-white`
- `cursor`, `selection` (if defined in theme)

### Semantic Color Mapping

With `semanticMapping: true`, colors map to semantic UI names:

```html
<div class="bg-background text-foreground">
  <h1 class="text-destructive">Error Message</h1>
  <p class="text-success">Success Message</p>
  <button class="bg-primary text-primary-foreground">Primary Button</button>
  <div class="border-border">Card with border</div>
</div>
```

Available semantic colors:
- `background`, `foreground`
- `primary`, `secondary`, `accent`, `destructive`
- `muted`, `border`, `input`, `ring`
- `success`, `warning`, `info`

## Theme Selection

### Environment Variable

Set the `THEME` environment variable to choose a theme:

```bash
THEME=my-dark-theme npm run dev
```

### Default Theme

Specify a default in your config:

```js
terminalThemes({
  defaultTheme: 'my-theme'  // Will use this if THEME env var not set
})
```

### Auto-Selection

If no theme is specified, the first theme found alphabetically will be used.

## Hot Reloading

During development (`astro dev`), the integration watches your themes directory for changes:

- **File modified**: Theme CSS regenerated
- **File added**: New theme becomes available
- **File deleted**: Theme CSS regenerated

## Extending with Custom Adapters

You can add support for additional terminal formats:

```js
// src/adapters/iterm-adapter.js
import { ThemeProcessor } from 'astro-terminal-themes';

class iTerm2Adapter {
  name = 'iterm2';
  extensions = ['.itermcolors'];

  parse(content) {
    // Parse iTunes plist format
    // Return ThemeColors object
  }
}

// In your astro config
const processor = new ThemeProcessor();
processor.registerAdapter(new iTerm2Adapter());
```

## API Reference

### Integration Options

```typescript
interface TerminalThemeIntegrationOptions {
  themesDir?: string;        // Default: './themes'
  outputFile?: string;       // Default: './src/styles/theme.css'
  defaultTheme?: string;     // Default: first theme found
  semanticMapping?: boolean; // Default: false
}
```

### ThemeColors Interface

```typescript
interface ThemeColors {
  background: string;
  foreground: string;
  cursor?: string;
  selection?: {
    background: string;
    foreground?: string;
  };
  colors: {
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
  };
}
```

## Supported Formats

### ✅ Currently Supported

- **Ghostty** (`.conf`, `.config`) - Full support
- **Warp** (`.yaml`, `.yml`) - Full support

### 🚧 Coming Soon

- **iTerm2** (`.itermcolors`)
- **VS Code** (`.json`)
- **Alacritty** (`.yml`, `.yaml`)
- **Kitty** (`.conf`)

## Examples

Check out the `examples/` directory for complete Astro project setups using various terminal themes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your terminal adapter in `src/adapters/`
4. Add tests and examples
5. Submit a pull request

## License

MIT