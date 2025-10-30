# Fix: Agents Tab Tool Selection Save Issue

## Problem

When editing an agent in the Agents tab and selecting/deselecting tools, clicking "Save Changes" would fail to properly save the tool selections.

## Root Cause

The component was using **uncontrolled checkboxes** with `defaultChecked`:

```tsx
// ❌ BEFORE (BROKEN)
<Checkbox
  id={`tool-${tool.id}`}
  defaultChecked={editingAgent.enabledTools.includes(tool.id)}
  disabled={!tool.isEnabled}
/>

// Save button tried to read from DOM
const selectedTools = tools
  .filter((tool) => (
    document.getElementById(`tool-${tool.id}`) as HTMLInputElement
  )?.checked)
  .map((t) => t.id);
```

### Why This Failed

1. **`defaultChecked` is uncontrolled**: It only sets the initial value. React doesn't track changes.
2. **DOM reads are unreliable**: Trying to read checkbox state directly from DOM is fragile
3. **React re-renders**: When the dialog opened, checkboxes might not reflect the actual state

## Solution

Convert to **controlled checkboxes** using React state:

### Changes Made

#### 1. Add State for Selected Tools
```tsx
const [selectedTools, setSelectedTools] = useState<string[]>([]);
```

#### 2. Initialize State When Dialog Opens
```tsx
useEffect(() => {
  if (editingAgent) {
    setSelectedTools(editingAgent.enabledTools || []);
  }
}, [editingAgent]);
```

#### 3. Add Toggle Handler
```tsx
const handleToolToggle = (toolId: string, checked: boolean) => {
  setSelectedTools(prev => {
    if (checked) {
      return [...prev, toolId];
    } else {
      return prev.filter(id => id !== toolId);
    }
  });
};
```

#### 4. Use Controlled Checkbox
```tsx
// ✅ AFTER (FIXED)
<Checkbox
  id={`tool-${tool.id}`}
  checked={selectedTools.includes(tool.id)}
  onCheckedChange={(checked) => handleToolToggle(tool.id, checked as boolean)}
  disabled={!tool.isEnabled}
/>
```

#### 5. Save Using State (Not DOM)
```tsx
// ✅ Use state directly
handleUpdateAgent({
  systemPrompt,
  enabledTools: selectedTools,  // From state, not DOM!
});
```

## Benefits

✅ **Reliable**: State is single source of truth
✅ **Predictable**: React manages checkbox state
✅ **No DOM reads**: Pure React state management
✅ **Works consistently**: No race conditions or re-render issues

## Files Modified

- `components/admin/agents-tab.tsx`:
  - Line 29: Added `selectedTools` state
  - Lines 56-61: Added initialization effect
  - Lines 63-72: Added toggle handler
  - Line 88: Clear state on successful save
  - Lines 220-221: Controlled checkbox
  - Line 262: Use state in save

## Testing

1. Open Admin Panel → Agents Tab
2. Click "Edit" on Chat Model
3. Check/uncheck some tools (e.g., getWeather, github_tools)
4. Click "Save Changes"
5. Verify:
   - Success toast appears
   - Dialog closes
   - Re-open: Selected tools are persisted correctly

## Before vs After

### Before (Broken)
```
User checks "getWeather" → DOM checkbox updates
User clicks "Save" → Reads DOM → Sometimes works, sometimes doesn't
Result: ❌ Unreliable saves
```

### After (Fixed)
```
User checks "getWeather" → onCheckedChange fires → Updates state
User clicks "Save" → Uses state → Always works
Result: ✅ Reliable saves
```

## Key Lesson

**Always use controlled components in React** for form inputs when you need to read their values. Never rely on direct DOM manipulation when React state can manage it properly.

### Controlled vs Uncontrolled

```tsx
// ❌ Uncontrolled (avoid in forms)
<Checkbox defaultChecked={isInitiallyChecked} />

// ✅ Controlled (use for forms)
<Checkbox
  checked={isChecked}
  onCheckedChange={setIsChecked}
/>
```

---

## Related Components

This same pattern should be used in:
- Models Tab (already correct)
- Tools Tab (already correct)
- Any other forms with checkboxes/inputs that need to be saved

The fix ensures consistent, predictable behavior across all admin panel forms.
