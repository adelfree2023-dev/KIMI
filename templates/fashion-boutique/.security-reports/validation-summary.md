# Security Validation Report: fashion-boutique
Generated: 2026-02-08T22:43:39.472Z

## Overall Result
- **Status:** ❌ FAILED
- **Score:** 67/100
- **Violations:** 1 fatal, 0 warnings

## Phase Results

### S2: Tenant Isolation
- Score: 100/100
- Status: ✅ PASSED
- Duration: 65ms

### S3: Input Validation
- Score: 0/100
- Status: ❌ FAILED
- Duration: 22ms
- Violations: 1
  - [FATAL] S3-004: Unsanitized user input in template literal
    File: ./templates/fashion-boutique/src/lib/api.ts:0
    💡 Validate with Zod before using

### S7: Encryption
- Score: 100/100
- Status: ✅ PASSED
- Duration: 28ms