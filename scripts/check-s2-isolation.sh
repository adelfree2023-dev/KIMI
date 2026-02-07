#!/bin/bash
# S2 Data Isolation Checker
# Validates that all SQL queries respect tenant isolation
# Rule S2: Tenant data must be completely isolated

set -e

echo "🔍 S2 Data Isolation Check - Scanning packages/db/src..."
echo ""

VIOLATIONS=0

# Function to report violation
report_violation() {
    echo "❌ VIOLATION: $1"
    echo "   File: $2"
    echo "   Line: $3"
    echo ""
    VIOLATIONS=$((VIOLATIONS + 1))
}

# Check 1: Direct public schema access without search_path
echo "Check 1: Looking for direct 'public.' schema references..."
while IFS=: read -r file line content; do
    # Skip test files and comments
    if [[ "$file" == *".test.ts"* ]] || [[ "$content" == *"//"* ]] || [[ "$content" == *"search_path"* ]]; then
        continue
    fi
    report_violation "Direct 'public.' schema reference (bypasses tenant isolation)" "$file" "$line"
done < <(grep -rn "public\." packages/db/src --include="*.ts" --include="*.sql" 2>/dev/null || true)

# Check 2: Raw SQL without tenant context
echo "Check 2: Looking for raw SQL without tenant context..."
while IFS=: read -r file line content; do
    if [[ "$file" == *".test.ts"* ]]; then
        continue
    fi
    # Check if content has tenant reference
    if [[ ! "$content" == *"tenant"* ]] && [[ ! "$content" == *"search_path"* ]]; then
        report_violation "Raw SQL without tenant context" "$file" "$line"
    fi
done < <(grep -rn "sql\`" packages/db/src --include="*.ts" 2>/dev/null || true)

# Check 3: Unqualified SELECT * FROM statements
echo "Check 3: Looking for unqualified table references..."
while IFS=: read -r file line content; do
    if [[ "$file" == *".test.ts"* ]]; then
        continue
    fi
    # Skip if already has schema qualification
    if [[ ! "$content" == *"."*"FROM"* ]] && [[ ! "$content" == *"JOIN"*.* ]]; then
        report_violation "Unqualified table reference (no schema prefix)" "$file" "$line"
    fi
done < <(grep -rnE "FROM\s+\w+" packages/db/src --include="*.ts" 2>/dev/null | grep -v "FROM \"" | grep -v "FROM '" | head -20 || true)

# Check 4: Missing tenant context imports
echo "Check 4: Verifying tenant context imports..."
DB_FILES=$(find packages/db/src -name "*.ts" -not -name "*.test.ts" | wc -l)
MIDDLEWARE_IMPORTS=$(grep -rl "from ['\"]@apex/middleware['\"]" packages/db/src --include="*.ts" | grep -v "\.test\." | wc -l)

if [ "$MIDDLEWARE_IMPORTS" -eq 0 ] && [ "$DB_FILES" -gt 0 ]; then
    echo "⚠️  WARNING: No @apex/middleware imports found in DB layer"
    echo "    Ensure tenant isolation is handled elsewhere"
else
    echo "✅ Found $MIDDLEWARE_IMPORTS files importing from @apex/middleware"
fi

# Check 5: AsyncLocalStorage usage for tenant context
echo "Check 5: Checking AsyncLocalStorage tenant context usage..."
ALS_USAGE=$(grep -r "tenantStorage\|getCurrentTenant\|getCurrentTenantId" packages/db/src --include="*.ts" | grep -v "\.test\." | wc -l)
if [ "$ALS_USAGE" -eq 0 ]; then
    echo "⚠️  WARNING: No AsyncLocalStorage tenant context usage in DB layer"
else
    echo "✅ Found $ALS_USAGE tenant context references"
fi

# Summary
echo ""
echo "=========================================="
if [ $VIOLATIONS -eq 0 ]; then
    echo "✅ S2 Data Isolation Check PASSED"
    echo "=========================================="
    exit 0
else
    echo "🚨 S2 Data Isolation Check FAILED"
    echo "   Found $VIOLATIONS violation(s)"
    echo "=========================================="
    echo ""
    echo "📋 S2 Protocol Requirements:"
    echo "   - Use SET search_path = tenant_{id}, public"
    echo "   - OR use fully qualified names: tenant_{id}.table_name"
    echo "   - Never access public schema directly"
    echo ""
    exit 1
fi
