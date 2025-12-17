# 🔧 Troubleshooting: No Models in Dropdown

## Issue
The AI Config settings page shows "No Models Found" and the dropdown is empty.

## Possible Causes & Solutions

### 1. Models Not Seeded ✅ MOST LIKELY

**Check if models exist:**
```bash
# Run the test script
npx tsx test-language-models.ts
```

**If no models found, seed them:**
```bash
npx tsx prisma/seed-language-models.ts
```

This will create:
- ✅ Qwen 2.5 0.5B (Local) - Default
- ✅ Llama 3.1 70B (Groq)
- ✅ Mixtral 8x7B (Groq)

### 2. API Authentication Issue

**Check browser console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors when loading the page

**Common errors:**
- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Wrong tenant
- `404 Not Found` - API route issue

**Solution:**
- Make sure you're logged in
- Check session is valid
- Verify tenant ID matches

### 3. Wrong Tenant ID

**Check the tenant ID in the code:**

The page uses: `cmivuqa8z0000epwfkvvn28mi`

**Verify this matches your database:**
```bash
# Check your tenant ID
npx prisma studio
# Navigate to Tenant table
# Copy your actual tenant ID
```

**Update if needed:**
Edit `/src/app/(dashboard)/settings/ai-config/page.tsx`:
```typescript
const tenantId = (session?.user as any)?.tenantId || 'YOUR_ACTUAL_TENANT_ID';
```

### 4. Database Connection Issue

**Check Prisma connection:**
```bash
# Test database connection
npx prisma db pull
```

**If connection fails:**
- Check `.env` file
- Verify DATABASE_URL is correct
- Test database is accessible

### 5. API Route Not Working

**Test API directly:**
```bash
# After logging in, test in browser console:
fetch('/api/ai/models?tenantId=cmivuqa8z0000epwfkvvn28mi')
  .then(r => r.json())
  .then(console.log)
```

**Expected response:**
```json
[
  {
    "id": "...",
    "name": "Qwen 2.5 0.5B (Local)",
    "provider": "OLLAMA",
    "modelId": "qwen2.5:0.5b",
    ...
  }
]
```

## Quick Fix Steps

### Step 1: Seed Models
```bash
cd /home/mubasshir/Documents/erp
npx tsx prisma/seed-language-models.ts
```

### Step 2: Verify Models Exist
```bash
npx tsx test-language-models.ts
```

### Step 3: Refresh Page
1. Go to `http://localhost:3000/settings/ai-config`
2. Click "Refresh Models" button
3. Models should now appear

### Step 4: Check Browser Console
1. Open DevTools (F12)
2. Check Console for any errors
3. Check Network tab for API calls

## Debugging Tips

### Enable Detailed Logging

The page now includes console logging:

```typescript
console.log('Fetched models:', data);  // Shows fetched models
console.error('Failed to fetch models:', ...);  // Shows errors
```

**Check console for:**
- "Fetched models: []" - Empty array means no models in DB
- "Fetched models: [...]" - Models exist but not showing
- "Failed to fetch models: 401" - Authentication issue
- "Failed to fetch models: 500" - Server error

### Check Network Tab

1. Open DevTools → Network tab
2. Reload page
3. Look for `/api/ai/models` request
4. Check:
   - Status code (should be 200)
   - Response body (should have models array)
   - Request headers (should have auth cookies)

## Expected Behavior

### When Models Exist:
```
┌─────────────────────────────────────┐
│ Default Language Model              │
│                                     │
│ Selected Model                      │
│ [⚡ Qwen 2.5 0.5B (Local)     ▼]  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [⚡] Qwen 2.5 0.5B (Local)      │ │
│ │ Fast and efficient local model  │ │
│ │ OLLAMA • 4K tokens • 0 uses    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### When No Models:
```
┌─────────────────────────────────────┐
│ Default Language Model              │
│                                     │
│ ⚠️ No Models Found                  │
│                                     │
│ No language models are configured   │
│ yet. Run the seed script to create │
│ default models.                     │
│                                     │
│ To seed models, run:                │
│ npx tsx prisma/seed-language-models │
│                                     │
│ [🔄 Refresh Models]                 │
└─────────────────────────────────────┘
```

## Still Not Working?

### 1. Check Database Schema
```bash
npx prisma studio
```
- Navigate to LanguageModel table
- Verify records exist
- Check tenantId matches

### 2. Regenerate Prisma Client
```bash
npx prisma generate
```

### 3. Restart Dev Server
```bash
# Stop server (Ctrl+C)
pnpm run dev
```

### 4. Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or clear site data in DevTools

### 5. Check Logs
```bash
# Check server logs for errors
# Look for API route errors
# Check database connection issues
```

## Success Indicators

✅ Models seeded successfully  
✅ API returns models array  
✅ Dropdown shows 3 models  
✅ Can select a model  
✅ Selected model card appears  
✅ No console errors  

## Contact Support

If still having issues:
1. Check all console errors
2. Verify database has models
3. Test API endpoint directly
4. Check authentication status
5. Review server logs

---

**Last Updated**: December 17, 2025 at 10:30 PM UTC+05:30
