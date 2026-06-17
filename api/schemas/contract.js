import { expect } from '@playwright/test';

/**
 * Asserts that `actual` (API response body) matches the shape declared in `contract`.
 * 
 * Contract rules:
 *   "fieldName": "number" | "string" | "boolean"  → checks typeof
 *   "fieldName": { ... }                           → checks it's an array, then checks first item's shape
 *   Keys starting with "_" are metadata and are skipped.
 * @param {{ [x: string]: any; }} actual
 * @param {{ [s: string]: any; } | ArrayLike<any>} contract
 */
export function assertMatchesContract(actual, contract) {
    for (const [key, expected] of Object.entries(contract)) {

        // Skip _comment, _source — metadata keys, not part of the response shape
        if (key.startsWith('_')) continue;

        if (typeof expected === 'object') {
            // Object value means: this field is an array of items with the given shape.
            // e.g. "products": { "productId": "number", "quantity": "number" }
            expect(Array.isArray(actual[key]), `"${key}" must be an array`).toBe(true);

            if (actual[key].length > 0) {
                // Check that the first item has all the declared fields and types
                for (const [itemKey, itemType] of Object.entries(expected)) {
                    expect(
                        typeof actual[key][0][itemKey],
                        `"${key}[0].${itemKey}" must be ${itemType}`
                    ).toBe(itemType);
                }
            }
        } else {
            // Primitive check — "number", "string", "boolean"
            // typeof [] === 'object' so arrays never reach this branch
            expect(actual).toHaveProperty(key);
            expect(
                typeof actual[key],
                `"${key}" must be ${expected}, got ${typeof actual[key]}`
            ).toBe(expected);
        }
    }
}
