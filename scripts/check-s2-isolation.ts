#!/usr/bin/env bun
/**
 * S2 Data Isolation Checker
 * Advanced TypeScript-based SQL query analyzer
 * Detects tenant isolation violations in database layer
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

interface Violation {
  file: string;
  line: number;
  column: number;
  type: 'DIRECT_PUBLIC_ACCESS' | 'RAW_SQL_NO_TENANT' | 'UNQUALIFIED_TABLE' | 'MISSING_SEARCH_PATH';
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  code: string;
}

const VIOLATIONS: Violation[] = [];

// Patterns to detect
const DANGEROUS_PATTERNS = {
  // Direct public schema access
  directPublicAccess: /public\.[a-zA-Z_][a-zA-Z0-9_]*/g,

  // Raw SQL template literals without tenant context
  rawSql: /sql`[^`]*`/g,

  // SELECT/INSERT/UPDATE/DELETE without schema qualification
  unqualifiedTable: /\b(SELECT|INSERT|UPDATE|DELETE)\s+(?:\*\s+)?(?:INTO\s+)?(?:FROM\s+)?([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+AS\s+\w+)?(?:\s+WHERE|\s+JOIN|\s+GROUP|\s+ORDER|\s+LIMIT|\s*;|\s*$)/gi,

  // Missing search_path in SET statements
  missingSearchPath: /SET\s+(?:SESSION\s+)?search_path\s*=\s*([^;]+)/gi,
};

// Safe patterns (not violations)
const SAFE_PATTERNS = [
  /search_path.*public/, // Has search_path with public
  /tenant_[a-zA-Z0-9_]+\./, // Uses tenant schema prefix
  /\/\/.*public\./, // Commented line
  /\/\*[\s\S]*?public\.[\s\S]*?\*\//, // Block comment
  /publicPool\./, // Safe: Variable name
  /publicDb\./,   // Safe: Variable name
];

function isSafe(line: string): boolean {
  return SAFE_PATTERNS.some(pattern => pattern.test(line));
}

function analyzeLine(line: string, lineNum: number, relativePath: string, filePath: string): void {
  // Skip test files
  if (filePath.includes('.test.ts') || filePath.includes('.spec.ts')) {
    return;
  }

  // Skip comments
  if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
    return;
  }

  // Check 1: Direct public schema access
  if (DANGEROUS_PATTERNS.directPublicAccess.test(line) && !isSafe(line)) {
    VIOLATIONS.push({
      file: relativePath,
      line: lineNum,
      column: line.indexOf('public.'),
      type: 'DIRECT_PUBLIC_ACCESS',
      severity: 'CRITICAL',
      message: 'Direct public schema access bypasses tenant isolation',
      code: line.trim(),
    });
  }

  // Check 2: Raw SQL without tenant context
  if (DANGEROUS_PATTERNS.rawSql.test(line)) {
    const hasTenantContext =
      line.includes('tenant') ||
      line.includes('search_path') ||
      line.includes('getCurrentTenant');

    if (!hasTenantContext) {
      VIOLATIONS.push({
        file: relativePath,
        line: lineNum,
        column: line.indexOf('sql`'),
        type: 'RAW_SQL_NO_TENANT',
        severity: 'WARNING',
        message: 'Raw SQL without visible tenant context',
        code: line.trim(),
      });
    }
  }

  // Check 3: Unqualified table references
  const unqualifiedMatch = DANGEROUS_PATTERNS.unqualifiedTable.exec(line);
  if (unqualifiedMatch && !isSafe(line)) {
    const tableName = unqualifiedMatch[2];
    // Skip if it's a CTE or subquery
    if (!tableName.match(/^(SELECT|WITH|FROM)$/i)) {
      VIOLATIONS.push({
        file: relativePath,
        line: lineNum,
        column: line.indexOf(tableName),
        type: 'UNQUALIFIED_TABLE',
        severity: 'WARNING',
        message: `Unqualified table reference: ${tableName}`,
        code: line.trim(),
      });
    }
  }

  // Reset regex lastIndex
  DANGEROUS_PATTERNS.directPublicAccess.lastIndex = 0;
  DANGEROUS_PATTERNS.rawSql.lastIndex = 0;
  DANGEROUS_PATTERNS.unqualifiedTable.lastIndex = 0;
}

function scanFile(filePath: string, content: string): void {
  const lines = content.split('\n');
  const relativePath = relative(process.cwd(), filePath);

  for (let i = 0; i < lines.length; i++) {
    analyzeLine(lines[i], i + 1, relativePath, filePath);
  }
}

function walkDir(dir: string, callback: (file: string) => void): void {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('dist')) {
      walkDir(filePath, callback);
    } else if (stat.isFile() && file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      callback(filePath);
    }
  }
}

function printReport(): void {
  console.log('\n🔍 S2 Data Isolation Check Report\n');
  console.log('='.repeat(70));

  if (VIOLATIONS.length === 0) {
    console.log('\n✅ No S2 violations found!');
    console.log('   All SQL queries respect tenant isolation.\n');
    return;
  }

  const critical = VIOLATIONS.filter(v => v.severity === 'CRITICAL');
  const warnings = VIOLATIONS.filter(v => v.severity === 'WARNING');

  console.log(`\n🚨 Found ${VIOLATIONS.length} violation(s):`);
  console.log(`   - Critical: ${critical.length}`);
  console.log(`   - Warnings: ${warnings.length}\n`);

  if (critical.length > 0) {
    console.log('❌ CRITICAL VIOLATIONS (Must Fix):\n');
    for (const v of critical) {
      console.log(`   📁 ${v.file}:${v.line}:${v.column}`);
      console.log(`      Type: ${v.type}`);
      console.log(`      ${v.message}`);
      console.log(`      Code: ${v.code.substring(0, 80)}`);
      console.log('');
    }
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (Review Recommended):\n');
    for (const v of warnings) {
      console.log(`   📁 ${v.file}:${v.line}:${v.column}`);
      console.log(`      ${v.message}`);
      console.log('');
    }
  }

  console.log('='.repeat(70));
  console.log('\n📋 S2 Protocol Requirements:');
  console.log('   1. Use SET search_path = tenant_{id}, public');
  console.log('   2. OR use fully qualified names: tenant_{id}.table_name');
  console.log('   3. Never access public schema directly\n');
}

// Main execution
console.log('\n🛡️  S2 Data Isolation Advanced Checker');
console.log('   Scanning packages/db/src for tenant isolation violations...\n');

try {
  const dbDir = join(process.cwd(), 'packages', 'db', 'src');

  walkDir(dbDir, (filePath) => {
    const content = readFileSync(filePath, 'utf-8');
    scanFile(filePath, content);
  });

  printReport();

  // Exit with error if critical violations found
  const criticalCount = VIOLATIONS.filter(v => v.severity === 'CRITICAL').length;
  process.exit(criticalCount > 0 ? 1 : 0);

} catch (error) {
  console.error('❌ Error running S2 check:', error);
  process.exit(1);
}
