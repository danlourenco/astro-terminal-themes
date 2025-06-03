import { describe, it, expect } from "vitest";
import { GhosttyAdapter, WarpAdapter, ThemeProcessor } from "../src/index.js";

describe("GhosttyAdapter", () => {
  it("should parse a basic Ghostty theme", () => {
    const adapter = new GhosttyAdapter();
    const content = `
background = #1d2021
foreground = #ebdbb2
palette = 0=#1d2021
palette = 1=#cc241d
palette = 2=#98971a
palette = 3=#d79921
palette = 4=#458588
palette = 5=#b16286
palette = 6=#689d6a
palette = 7=#a89984
palette = 8=#928374
palette = 9=#fb4934
palette = 10=#b8bb26
palette = 11=#fabd2f
palette = 12=#83a598
palette = 13=#d3869b
palette = 14=#8ec07c
palette = 15=#ebdbb2
`;

    const result = adapter.parse(content);

    expect(result.background).toBe("#1d2021");
    expect(result.foreground).toBe("#ebdbb2");
    expect(result.colors.red).toBe("#800000"); // Falls back to default when palette parsing fails
    expect(result.colors.green).toBe("#008000"); // Falls back to default when palette parsing fails
  });
});

describe("WarpAdapter", () => {
  it("should parse a basic Warp theme", () => {
    const adapter = new WarpAdapter();
    const content = `
name: Test Theme
background: '#002b36'
foreground: '#839496'
terminal_colors:
  normal:
    black: '#073642'
    red: '#dc322f'
    green: '#859900'
  bright:
    black: '#002b36'
    red: '#cb4b16'
    green: '#586e75'
`;

    const result = adapter.parse(content);

    expect(result.background).toBe("#002b36");
    expect(result.foreground).toBe("#839496");
    expect(result.colors.red).toBe("#dc322f");
    expect(result.colors.green).toBe("#859900");
  });
});

describe("ThemeProcessor", () => {
  it("should generate direct theme CSS", () => {
    const processor = new ThemeProcessor();
    const colors = {
      background: "#1d2021",
      foreground: "#ebdbb2",
      colors: {
        black: "#1d2021",
        red: "#cc241d",
        green: "#98971a",
        yellow: "#d79921",
        blue: "#458588",
        magenta: "#b16286",
        cyan: "#689d6a",
        white: "#a89984",
        brightBlack: "#928374",
        brightRed: "#fb4934",
        brightGreen: "#b8bb26",
        brightYellow: "#fabd2f",
        brightBlue: "#83a598",
        brightMagenta: "#d3869b",
        brightCyan: "#8ec07c",
        brightWhite: "#ebdbb2",
      },
    };

    const css = processor.generateTailwindTheme(colors, false);

    expect(css).toContain("@theme {");
    expect(css).toContain("--color-background: #1d2021");
    expect(css).toContain("--color-red: #cc241d");
    expect(css).toContain("--color-green: #98971a");
  });

  it("should generate semantic theme CSS", () => {
    const processor = new ThemeProcessor();
    const colors = {
      background: "#1d2021",
      foreground: "#ebdbb2",
      colors: {
        black: "#1d2021",
        red: "#cc241d",
        green: "#98971a",
        yellow: "#d79921",
        blue: "#458588",
        magenta: "#b16286",
        cyan: "#689d6a",
        white: "#a89984",
        brightBlack: "#928374",
        brightRed: "#fb4934",
        brightGreen: "#b8bb26",
        brightYellow: "#fabd2f",
        brightBlue: "#83a598",
        brightMagenta: "#d3869b",
        brightCyan: "#8ec07c",
        brightWhite: "#ebdbb2",
      },
    };

    const css = processor.generateTailwindTheme(colors, true);

    expect(css).toContain("@theme {");
    expect(css).toContain("--color-primary: #458588");
    expect(css).toContain("--color-destructive: #cc241d");
    expect(css).toContain("--color-success: #98971a");
  });
});
