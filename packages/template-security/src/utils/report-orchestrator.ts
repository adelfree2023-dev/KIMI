import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Report Orchestrator
 * Runs individual security scripts and aggregates results into JSON reports.
 */
async function orchestrate() {
  console.log('🚀 Starting Apex Security Report Orchestration...');

  const reports = {
    protocols: {
      violations: [] as any[],
    },
    static: {
      violations: [] as any[],
    },
  };

  // 1. Run Legacy Security Scripts (S1, S3, S4)
  const scripts = [
    {
      name: 'S1: Env Config',
      path: 'tools/security-scripts/verify-env-config.ts',
      gate: 'S1',
    },
    {
      name: 'S3: Input Validation',
      path: 'tools/security-scripts/verify-input-validation.ts',
      gate: 'S3',
    },
    {
      name: 'S4: Audit Logs',
      path: 'tools/security-scripts/verify-audit-logs.ts',
      gate: 'S4',
    },
  ];

  for (const script of scripts) {
    try {
      console.log(`  Checking ${script.name}...`);
      execSync(`bun ${script.path}`, { stdio: 'pipe' });
    } catch (error: any) {
      const output = error.stdout?.toString() || error.message;
      reports.protocols.violations.push({
        rule: script.gate,
        severity: 'CRITICAL',
        message: `Verification script failed: ${script.name}`,
        details: output
          .split('\n')
          .filter((l: string) => l.includes('❌'))
          .join('\n'),
      });
    }
  }

  // 2. Run Modern Template Validators (S2, S3, S7)
  // These generate their own internal reports in .security-reports if run via CLI
  // For orchestration, we'll run the CLI against a mock/test template or similar
  try {
    console.log('  Running Template Security Validator CLI...');
    // Example: run on fashion-boutique if it exists
    execSync('bun src/cli.ts templates/fashion-boutique', { stdio: 'pipe' });
    const templateReport = JSON.parse(
      readFileSync(
        'templates/fashion-boutique/.security-reports/validation-report.json',
        'utf-8'
      )
    );

    // Merge violations
    Object.values(templateReport.phases).forEach((phase: any) => {
      reports.protocols.violations.push(
        ...phase.violations.map((v: any) => ({
          rule: phase.name,
          severity: v.severity === 'FATAL' ? 'CRITICAL' : 'WARNING',
          message: v.message,
          file: v.file,
        }))
      );
    });
  } catch (error) {
    console.warn(
      '  ⚠️  Modern Template Validator skipped or failed (template not found)'
    );
  }

  // 3. Run Pattern Scanner (Static Analysis)
  try {
    console.log('  Running Surgical Grep Pattern Scanner...');
    // We'll implement this script next
    execSync('bun src/scanners/pattern-scanner.ts --path=templates', {
      stdio: 'pipe',
    });
    const patternReport = JSON.parse(
      readFileSync('static-analysis-report.json', 'utf-8')
    );
    reports.static.violations.push(...patternReport.violations);
  } catch (error) {
    console.warn('  ⚠️  Pattern Scanner failed.');
  }

  // 4. Write Final Aggregated Reports
  writeFileSync(
    's1-s9-report.json',
    JSON.stringify(reports.protocols, null, 2)
  );
  writeFileSync(
    'static-analysis-report.json',
    JSON.stringify(reports.static, null, 2)
  );

  console.log('\n✅ Orchestration Complete. Reports generated:');
  console.log('  - s1-s9-report.json');
  console.log('  - static-analysis-report.json');
}

orchestrate().catch((err) => {
  console.error('❌ Orchestration Error:', err);
  process.exit(1);
});
