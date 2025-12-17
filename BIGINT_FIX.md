# ✅ Fixed: BigInt Serialization Error

## Issue
API route `/api/ai/models` was returning 500 error:
```
Failed to fetch models: 500 "Internal Server Error"
```

## Root Cause
The `totalTokens` field in the `LanguageModel` table is a `BigInt` type in PostgreSQL. JavaScript's `JSON.stringify()` cannot serialize `BigInt` values, causing the API to crash when trying to return the models.

## Solution
Convert `BigInt` to `string` before serialization:

```typescript
// Convert BigInt to string for JSON serialization
const serializedModels = models.map(model => ({
  ...model,
  totalTokens: model.totalTokens?.toString() || '0',
}));

return NextResponse.json(serializedModels);
```

## Files Modified
- `/src/app/api/ai/models/route.ts` - Added BigInt serialization

## Testing
After this fix:

1. **API should work:**
   ```bash
   # Test in browser console (after login)
   fetch('/api/ai/models?tenantId=cmivuqa8z0000epwfkvvn28mi')
     .then(r => r.json())
     .then(console.log)
   ```

2. **Expected response:**
   ```json
   [
     {
       "id": "...",
       "name": "Qwen 2.5 0.5B (Local)",
       "totalTokens": "0",  // ← Now a string
       ...
     }
   ]
   ```

3. **Settings page should load models:**
   - Navigate to `/settings/ai-config`
   - Models should appear in dropdown
   - No more 500 errors

## Why This Happens
PostgreSQL `BIGINT` maps to JavaScript `BigInt`, which is not JSON-serializable by default. This is a common issue when working with large numbers in databases.

## Prevention
For any API routes that return database records with `BigInt` fields, always convert them to strings before serialization.

## Status
✅ **FIXED** - Models should now load correctly in the AI Config settings page!

---

**Fixed**: December 17, 2025 at 10:36 PM UTC+05:30
