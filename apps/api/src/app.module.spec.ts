import { describe, it, expect } from 'vitest';
import { AppModule } from './app.module.js';

describe('AppModule', () => {
  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });

  it('should have correct imports', () => {
    expect(AppModule.imports).toBeDefined();
  });

  it('should have correct providers', () => {
    expect(AppModule.providers).toBeDefined();
  });
});
