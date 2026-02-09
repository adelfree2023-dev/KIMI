/**
 * Export Strategy Factory
 * Implements Strategy Pattern for different export types
 */

import { Injectable } from '@nestjs/common';
import { AnalyticsExportStrategy } from './strategies/analytics-export.strategy.js';
import { LiteExportStrategy } from './strategies/lite-export.strategy.js';
import { NativeExportStrategy } from './strategies/native-export.strategy.js';
import type { ExportOptions, ExportProfile, ExportStrategy } from './types.js';

@Injectable()
export class ExportStrategyFactory {
  private strategies: Map<ExportProfile, ExportStrategy>;

  constructor(
    private readonly liteStrategy: LiteExportStrategy,
    private readonly nativeStrategy: NativeExportStrategy,
    private readonly analyticsStrategy: AnalyticsExportStrategy
  ) {
    this.strategies = new Map([
      ['lite', liteStrategy],
      ['native', nativeStrategy],
      ['analytics', analyticsStrategy],
    ]);
  }

  getStrategy(profile: ExportProfile): ExportStrategy {
    const strategy = this.strategies.get(profile);
    if (!strategy) {
      throw new Error(`Unknown export profile: ${profile}`);
    }
    return strategy;
  }

  async validateOptions(options: ExportOptions): Promise<boolean> {
    const strategy = this.getStrategy(options.profile);
    return strategy.validate(options);
  }
}
