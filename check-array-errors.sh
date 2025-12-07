#!/bin/bash
# Script to find all pages with potential array method errors

echo "🔍 Checking for potential array method errors..."
echo ""

# Find all page.tsx files that use array methods without safety checks
grep -r "useState<.*\[\]>" src/app/\(dashboard\) --include="page.tsx" | \
  cut -d: -f1 | \
  sort -u | \
  while read file; do
    # Check if file uses .filter, .map, or .reduce
    if grep -q "\.filter(\|\.map(\|\.reduce(" "$file"; then
      echo "📄 $file"
      # Check if it has Array.isArray checks
      if ! grep -q "Array.isArray" "$file"; then
        echo "   ⚠️  NEEDS FIX - Uses array methods without safety checks"
      else
        echo "   ✅ Has safety checks"
      fi
    fi
  done

echo ""
echo "Done!"
