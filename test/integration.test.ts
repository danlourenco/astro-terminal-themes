import { describe, it, expect } from 'vitest';
import terminalThemes from '../src/index.js';

describe('Integration', () => {
  it('should export the integration function', () => {
    expect(typeof terminalThemes).toBe('function');
  });

  it('should return an Astro integration object', () => {
    const integration = terminalThemes();
    expect(integration).toHaveProperty('name');
    expect(integration).toHaveProperty('hooks');
    expect(integration.name).toBe('terminal-theme-integration');
  });
});
