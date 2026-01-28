# Bug Fix Plan: "1.0" Wire Size Loading Issue

## Diagnosis
The issue stems from a mismatch between the **keys in the source JSON index** and the **keys generated during the index rebuilding process** in `mspecService.js`.

1.  **Source JSON (`Aptiv_M-Spec.indexed.json`)**:
    *   The `indexes.byWireSize` uses string keys like `"1.0"`.
    *   The `variants` data has `WireSize` as a number: `1.0`.

2.  **`mspecService.js` Behavior**:
    *   **Loading**: It reads the source keys (`"1.0"`) into `_canonicalKeys`.
    *   **Rebuilding Indexes**: It rebuilds the internal index by iterating over variants. It uses `String(variant.WireSize)` as the key.
    *   **Mismatch**: `String(1.0)` converts to `"1"`.
    *   **Result**: The frontend dropdown (built from `_canonicalKeys`) shows `"1.0"`. When selected, it queries the internal index for `"1.0"`. However, the internal index only has `"1"`. Thus, the lookup fails.

## Implementation Steps

### 1. Fix `src/services/mspecService.js`
*   **Modify `load()` method**:
    *   In the index rebuilding loop (around line 164), prioritize using the **original source key** (retrieved via `getWireSizeKeyForId`) instead of `String(variant.WireSize)`.
    *   This ensures the internal index key matches the source index key (`"1.0"`), restoring consistency.

### 2. Verify Frontend Components (`CalcPage.js` & `QueryPage.js`)
*   **Calculation Page**:
    *   The dropdowns are already dynamically populated via `mspecService`.
    *   The "hardcoded" initial rows (`0.35`) are placeholders that are automatically corrected to the first available valid option if `0.35` is missing.
    *   The fallback logic (`currentWireOdTable`) is correctly bypassed when `mspecService` is active.
    *   No changes are strictly required in `CalcPage.js` logic, as the service fix addresses the root cause. However, I will double-check for any explicit hardcoded checks for "1.0".

*   **Query Page**:
    *   Relies entirely on `mspecService`. The service fix will automatically resolve the issue here.

### 3. Verification
*   Confirm that selecting "1.0" now correctly retrieves the variant ID and populates the `WallThickness` / `WireType` dropdowns.
*   Confirm that `String(1.0)` vs `"1.0"` consistency is maintained.

## Deliverables
*   Modified `src/services/mspecService.js`.
*   Explanation of why frontend components are already dynamic and how the fix enables "1.0" to work.
