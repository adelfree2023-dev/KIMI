import { readFileSync, writeFileSync } from 'fs';

/**
 * Surgical JSON Validator (S1-S8 Elite Grade)
 * Strips comments and illegal control characters while preserving structure.
 */
function validateJson(filePath) {
    try {
        const raw = readFileSync(filePath, 'utf8');

        // 1. Strip C-style comments (JSONC support)
        const sanitized = raw
            .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')
            // 2. Strip illegal control characters (U+0000 to U+001F) except whitespace (\n, \r, \t)
            .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');

        // 3. Strict JSON structural check
        JSON.parse(sanitized);
        return true;
    } catch (error) {
        console.error(`🚨 CRITICAL: Invalid JSON in ${filePath}`);
        console.error(`Reason: ${error.message}`);
        return false;
    }
}

const files = process.argv.slice(2);
let hasError = false;

for (const file of files) {
    if (!validateJson(file)) {
        hasError = true;
    }
}

if (hasError) {
    process.exit(1);
} else {
    console.log('✅ All JSON files passed elite validation');
}
