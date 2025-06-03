// src/index.ts
import type { AstroIntegration } from "astro";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chokidar from "chokidar";

export interface TerminalThemeIntegrationOptions {
  themesDir?: string;
  outputFile?: string;
  defaultTheme?: string;
  semanticMapping?: boolean;
}

// Base adapter interface
export interface ThemeAdapter {
  name: string;
  extensions: string[];
  parse(content: string): ThemeColors;
}

// Standardized color interface
export interface ThemeColors {
  background: string;
  foreground: string;
  cursor?: string;
  selection?: {
    background: string;
    foreground?: string;
  };
  // ANSI colors (0-15)
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

// Ghostty theme adapter
export class GhosttyAdapter implements ThemeAdapter {
  name = "ghostty";
  extensions = [".conf", ".config"];

  parse(content: string): ThemeColors {
    const lines = content.split("\n");
    const config: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          // Remove quotes and backticks
          config[key.trim()] = value.replace(/^[`"']|[`"']$/g, "");
        }
      }
    }

    // Parse palette colors (0-15)
    const paletteColors: string[] = new Array(16);
    for (let i = 0; i < 16; i++) {
      // Look for "palette = ${i}=#color" format
      const paletteKey = Object.keys(config).find(key => key === 'palette' && config[key].startsWith(`${i}=`));
      if (paletteKey) {
        const colorValue = config[paletteKey].split('=')[1];
        if (colorValue) {
          paletteColors[i] = this.normalizeColor(colorValue);
        }
      }
    }

    // Ensure we have all 16 colors with fallbacks
    const defaultPalette = [
      "#000000",
      "#800000",
      "#008000",
      "#808000",
      "#000080",
      "#800080",
      "#008080",
      "#c0c0c0",
      "#808080",
      "#ff0000",
      "#00ff00",
      "#ffff00",
      "#0000ff",
      "#ff00ff",
      "#00ffff",
      "#ffffff",
    ];

    for (let i = 0; i < 16; i++) {
      if (!paletteColors[i]) {
        paletteColors[i] = defaultPalette[i];
      }
    }

    return {
      background: this.normalizeColor(config.background || "#000000"),
      foreground: this.normalizeColor(config.foreground || "#ffffff"),
      cursor: config["cursor-color"]
        ? this.normalizeColor(config["cursor-color"])
        : undefined,
      selection: {
        background: this.normalizeColor(
          config["selection-background"] || paletteColors[8]
        ),
        foreground: config["selection-foreground"]
          ? this.normalizeColor(config["selection-foreground"])
          : undefined,
      },
      colors: {
        black: paletteColors[0],
        red: paletteColors[1],
        green: paletteColors[2],
        yellow: paletteColors[3],
        blue: paletteColors[4],
        magenta: paletteColors[5],
        cyan: paletteColors[6],
        white: paletteColors[7],
        brightBlack: paletteColors[8],
        brightRed: paletteColors[9],
        brightGreen: paletteColors[10],
        brightYellow: paletteColors[11],
        brightBlue: paletteColors[12],
        brightMagenta: paletteColors[13],
        brightCyan: paletteColors[14],
        brightWhite: paletteColors[15],
      },
    };
  }

  private normalizeColor(color: string): string {
    // Remove # if present, add it back
    return color.startsWith("#") ? color : `#${color}`;
  }
}

// Warp theme adapter
export class WarpAdapter implements ThemeAdapter {
  name = "warp";
  extensions = [".yaml", ".yml"];

  parse(content: string): ThemeColors {
    // Simple YAML parser for Warp themes
    const lines = content.split("\n");
    const config: any = {};
    let currentSection: any = config;
    let currentKey = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const indent = line.length - line.trimStart().length;

      if (trimmed.includes(":")) {
        const [key, ...valueParts] = trimmed.split(":");
        const value = valueParts.join(":").trim();

        if (value) {
          // Key-value pair
          currentSection[key.trim()] = value.replace(/^['"]|['"]$/g, "");
        } else {
          // Section header
          currentKey = key.trim();
          if (indent === 0) {
            config[currentKey] = {};
            currentSection = config[currentKey];
          } else {
            currentSection[currentKey] = {};
            currentSection = currentSection[currentKey];
          }
        }
      }
    }

    const terminal = config.terminal_colors || {};
    const normal = terminal.normal || {};
    const bright = terminal.bright || {};

    return {
      background: this.normalizeColor(config.background || "#000000"),
      foreground: this.normalizeColor(config.foreground || "#ffffff"),
      cursor: config.cursor ? this.normalizeColor(config.cursor) : undefined,
      selection: {
        background: this.normalizeColor(
          config.accent || normal.blue || "#0000ff"
        ),
        foreground: this.normalizeColor(config.foreground || "#ffffff"),
      },
      colors: {
        black: this.normalizeColor(normal.black || "#000000"),
        red: this.normalizeColor(normal.red || "#800000"),
        green: this.normalizeColor(normal.green || "#008000"),
        yellow: this.normalizeColor(normal.yellow || "#808000"),
        blue: this.normalizeColor(normal.blue || "#000080"),
        magenta: this.normalizeColor(normal.magenta || "#800080"),
        cyan: this.normalizeColor(normal.cyan || "#008080"),
        white: this.normalizeColor(normal.white || "#c0c0c0"),
        brightBlack: this.normalizeColor(bright.black || "#808080"),
        brightRed: this.normalizeColor(bright.red || "#ff0000"),
        brightGreen: this.normalizeColor(bright.green || "#00ff00"),
        brightYellow: this.normalizeColor(bright.yellow || "#ffff00"),
        brightBlue: this.normalizeColor(bright.blue || "#0000ff"),
        brightMagenta: this.normalizeColor(bright.magenta || "#ff00ff"),
        brightCyan: this.normalizeColor(bright.cyan || "#00ffff"),
        brightWhite: this.normalizeColor(bright.white || "#ffffff"),
      },
    };
  }

  private normalizeColor(color: string): string {
    return color.startsWith("#") ? color : `#${color}`;
  }
}

// Theme processor
export class ThemeProcessor {
  private adapters: Map<string, ThemeAdapter> = new Map();

  constructor() {
    this.registerAdapter(new GhosttyAdapter());
    this.registerAdapter(new WarpAdapter());
  }

  registerAdapter(adapter: ThemeAdapter) {
    this.adapters.set(adapter.name, adapter);
  }

  async discoverThemes(
    themesDir: string
  ): Promise<Array<{ name: string; path: string; adapter: ThemeAdapter }>> {
    const themes: Array<{ name: string; path: string; adapter: ThemeAdapter }> =
      [];

    try {
      const files = await fs.readdir(themesDir);

      for (const file of files) {
        const filePath = path.join(themesDir, file);
        const stat = await fs.stat(filePath);

        if (stat.isFile()) {
          const ext = path.extname(file);

          for (const adapter of this.adapters.values()) {
            if (adapter.extensions.includes(ext)) {
              themes.push({
                name: path.basename(file, ext),
                path: filePath,
                adapter,
              });
              break;
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read themes directory: ${themesDir}`);
    }

    return themes;
  }

  async loadTheme(
    themePath: string,
    adapter: ThemeAdapter
  ): Promise<ThemeColors> {
    const content = await fs.readFile(themePath, "utf-8");
    return adapter.parse(content);
  }

  generateTailwindTheme(
    colors: ThemeColors,
    semanticMapping: boolean = false
  ): string {
    if (semanticMapping) {
      return this.generateSemanticTheme(colors);
    } else {
      return this.generateDirectTheme(colors);
    }
  }

  private generateSemanticTheme(colors: ThemeColors): string {
    return `@theme {
  --color-background: ${colors.background};
  --color-foreground: ${colors.foreground};
  --color-primary: ${colors.colors.blue};
  --color-primary-foreground: ${colors.background};
  --color-secondary: ${colors.colors.cyan};
  --color-secondary-foreground: ${colors.background};
  --color-accent: ${colors.colors.magenta};
  --color-accent-foreground: ${colors.background};
  --color-destructive: ${colors.colors.red};
  --color-destructive-foreground: ${colors.colors.white};
  --color-muted: ${colors.colors.brightBlack};
  --color-muted-foreground: ${colors.colors.white};
  --color-border: ${colors.colors.brightBlack};
  --color-input: ${colors.colors.brightBlack};
  --color-ring: ${colors.colors.blue};
  --color-success: ${colors.colors.green};
  --color-warning: ${colors.colors.yellow};
  --color-info: ${colors.colors.cyan};
  ${colors.cursor ? `--color-cursor: ${colors.cursor};` : ""}
  ${
    colors.selection ? `--color-selection: ${colors.selection.background};` : ""
  }
  ${
    colors.selection?.foreground
      ? `--color-selection-foreground: ${colors.selection.foreground};`
      : ""
  }
}`;
  }

  private generateDirectTheme(colors: ThemeColors): string {
    return `@theme {
  --color-background: ${colors.background};
  --color-foreground: ${colors.foreground};
  --color-black: ${colors.colors.black};
  --color-red: ${colors.colors.red};
  --color-green: ${colors.colors.green};
  --color-yellow: ${colors.colors.yellow};
  --color-blue: ${colors.colors.blue};
  --color-magenta: ${colors.colors.magenta};
  --color-cyan: ${colors.colors.cyan};
  --color-white: ${colors.colors.white};
  --color-bright-black: ${colors.colors.brightBlack};
  --color-bright-red: ${colors.colors.brightRed};
  --color-bright-green: ${colors.colors.brightGreen};
  --color-bright-yellow: ${colors.colors.brightYellow};
  --color-bright-blue: ${colors.colors.brightBlue};
  --color-bright-magenta: ${colors.colors.brightMagenta};
  --color-bright-cyan: ${colors.colors.brightCyan};
  --color-bright-white: ${colors.colors.brightWhite};
  ${colors.cursor ? `--color-cursor: ${colors.cursor};` : ""}
  ${
    colors.selection ? `--color-selection: ${colors.selection.background};` : ""
  }
  ${
    colors.selection?.foreground
      ? `--color-selection-foreground: ${colors.selection.foreground};`
      : ""
  }
}`;
  }
}

// Main Astro integration
export default function terminalThemeIntegration(
  options: TerminalThemeIntegrationOptions = {}
): AstroIntegration {
  const {
    themesDir = "./themes",
    outputFile = "./src/styles/theme.css",
    defaultTheme,
    semanticMapping = false,
  } = options;

  let processor: ThemeProcessor;
  let watcher: chokidar.FSWatcher | null = null;

  return {
    name: "terminal-theme-integration",
    hooks: {
      "astro:config:setup": async ({ config, logger }) => {
        processor = new ThemeProcessor();

        const resolvedThemesDir = path.resolve(
          fileURLToPath(config.root),
          themesDir
        );
        const resolvedOutputFile = path.resolve(
          fileURLToPath(config.root),
          outputFile
        );

        async function generateThemeFile() {
          try {
            const themes = await processor.discoverThemes(resolvedThemesDir);

            if (themes.length === 0) {
              logger.warn(`No themes found in ${resolvedThemesDir}`);
              return;
            }

            // Determine which theme to use
            const selectedThemeName =
              process.env.THEME || defaultTheme || themes[0].name;
            const selectedTheme =
              themes.find((t) => t.name === selectedThemeName) || themes[0];

            logger.info(
              `Using theme: ${selectedTheme.name} (${selectedTheme.adapter.name})`
            );

            const colors = await processor.loadTheme(
              selectedTheme.path,
              selectedTheme.adapter
            );
            const themeCSS = processor.generateTailwindTheme(
              colors,
              semanticMapping
            );

            // Ensure output directory exists
            await fs.mkdir(path.dirname(resolvedOutputFile), {
              recursive: true,
            });
            await fs.writeFile(resolvedOutputFile, themeCSS);

            logger.info(`Generated theme CSS: ${outputFile}`);
          } catch (error) {
            logger.error(`Failed to generate theme: ${error}`);
          }
        }

        // Generate initial theme
        await generateThemeFile();

        // Setup file watcher for hot reloading
        if (process.env.NODE_ENV === "development") {
          watcher = chokidar.watch(resolvedThemesDir, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
          });

          watcher.on("change", async (path) => {
            logger.info(`Theme file changed: ${path}`);
            await generateThemeFile();
          });

          watcher.on("add", async (path) => {
            logger.info(`Theme file added: ${path}`);
            await generateThemeFile();
          });

          watcher.on("unlink", async (path) => {
            logger.info(`Theme file removed: ${path}`);
            await generateThemeFile();
          });
        }
      },
      "astro:config:done": () => {
        // Clean up watcher on config done
        if (watcher) {
          watcher.close();
        }
      },
    },
  };
}
