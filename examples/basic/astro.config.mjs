import { defineConfig } from 'astro/config';
import terminalThemes from 'astro-terminal-themes';

export default defineConfig({
  integrations: [
    terminalThemes({
      themesDir: './themes',
      outputFile: './src/styles/theme.css',
      semanticMapping: false,
      defaultTheme: 'gruvbox'
    })
  ]
});