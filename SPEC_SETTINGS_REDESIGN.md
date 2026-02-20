# Settings Pages Redesign Spec

## Summary
Redesign admin settings pages with 3-column layout, section-based forms, modern components, and improved UX patterns based on `working/template` reference.

---

## Navigation Structure

**Before:** 2-level tabs (General | Authentication (Basic | Google) | Workspaces)
**After:** 3 top-level tabs (General | Authentication | Workspaces)

- Flatten nested auth tabs into single Authentication page
- Reserve nav space for future settings pages
- Keep page header + tabs + section titles pattern

---

## Layout Architecture

### 3-Column Grid
```
[Label Column (1/3)] [Content Area (2/3)]
```
- Use `grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3`
- Left column: section title + description
- Right columns: form fields
- Mobile: responsive stack (all columns stack vertically)

### Section Structure
```
<section aria-labelledby="section-id">
  <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
    <div>
      <h2 id="section-id">Section Title</h2>
      <p>Description...</p>
    </div>
    <div className="md:col-span-2">
      {/* Form content */}
    </div>
  </div>
</section>
<Divider />
```

### Spacing
- `gap-y-8` between sections
- `gap-4` between fields within section
- `mt-6` before save button
- Reference: `working/template/src/app/settings/general/page.tsx`

---

## Page Breakdown

### 1. General Page
**Sections:**
1. Instance Settings
   - Instance name (text input)

**Save per section:** Yes

### 2. Authentication Page
**Sections (in order):**
1. Basic Authentication
   - Enable toggle (Switch)
   - Password Policy section (nested)
     - Preset dropdown: None / Basic / Standard / Strict / Custom
     - When Custom: show individual toggles (min length, special chars, numbers, uppercase, lowercase)

2. Google OAuth
   - Enable toggle (Switch)
   - Credentials card (current pattern: configured state + "Change" button)
   - Info card with Google Cloud Console URLs (blue tinted)

**Save per section:** Yes

### 3. Workspaces Page
**Sections:**
1. Workspace Settings
   - Enable toggle (Switch)

**Save per section:** Yes (single toggle + save)

---

## Components to Add

Copy from `working/template/src/components/`:

| Component | Source File | Notes |
|-----------|-------------|-------|
| Switch | `Switch.tsx` | Replace all toggles |
| Card | `Card.tsx` | For info cards, danger zones |
| Divider | `Divider.tsx` | Between sections |
| Label | `Label.tsx` | Field labels |
| Checkbox | `Checkbox.tsx` | Keep for multi-select groups only |
| Skeleton | Create minimal | For loading states |

### Existing Components (keep)
- Button
- Input
- TabNavigation, TabNavigationLink

---

## Form Patterns

### State Management
- Install `react-hook-form` + `@hookform/resolvers`
- Use Zod schemas for validation
- Track dirty state per section for unsaved changes warning

### Validation
- Client-side: Zod schemas with instant feedback
- Server-side: Return validation errors from API
- Error display: Below each field (inline)

### Save Behavior
- One "Save" button per section
- Manual save only (no auto-save)
- Optimistic updates with rollback on error
- Success: Toast notification + reset dirty state
- Error: Toast notification + inline field errors

### Unsaved Changes
- Confirm dialog when navigating away with unsaved changes
- Copy AlertDialog from reference template
- Track dirty state via form library

### Disabled Provider State
- When auth provider toggle is OFF:
  - Show toggle as OFF
  - Block (disable) all configuration inputs below
  - Visual: grayed out, not hidden

---

## Loading States

Replace "Loading..." text with skeleton loaders:

```tsx
// Section skeleton
<div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
  <div>
    <Skeleton className="h-6 w-24" />
    <Skeleton className="mt-2 h-4 w-48" />
  </div>
  <div className="md:col-span-2 space-y-4">
    <Skeleton className="h-10 w-full max-w-md" />
  </div>
</div>
```

---

## API Changes

### New Endpoints (per-section save)

```
PATCH /api/admin/settings/general
PATCH /api/admin/settings/auth/basic
PATCH /api/admin/settings/auth/google
PATCH /api/admin/settings/workspaces
```

### Request/Response Pattern

```ts
// Request
PATCH /api/admin/settings/auth/basic
{
  "basicAuthEnabled": true,
  "passwordPreset": "standard",
  // If preset === "custom":
  "passwordMinLength": 8,
  "requireSpecial": true,
  "requireNumber": true,
  "requireUppercase": true,
  "requireLowercase": false
}

// Success Response
{ "success": true, "settings": { ...updatedSettings } }

// Error Response
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": { "passwordMinLength": "Minimum 6 characters required" }
}
```

### Google Secret Handling
- API returns `googleConfigured: boolean` (not the actual secret)
- POST new credentials to update
- Empty secret field = keep existing

---

## Password Policy Presets

| Preset | Min Length | Special | Number | Upper | Lower |
|--------|------------|---------|--------|-------|-------|
| None | 1 | false | false | false | false |
| Basic | 8 | false | false | false | false |
| Standard | 8 | true | true | false | false |
| Strict | 12 | true | true | true | true |
| Custom | (user defined) | | | | |

---

## Danger Zone Pattern

For destructive actions (not currently needed, but architecture ready):

```tsx
<Card className="overflow-hidden p-0">
  <div className="p-4">
    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">
      Action Title
    </h4>
    <p className="mt-2 text-sm text-gray-500">
      Description of consequences
    </p>
  </div>
  <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-900 dark:bg-gray-900">
    <div className="flex items-center gap-3">
      <Switch id="action-toggle" />
      <Label htmlFor="action-toggle">Activate</Label>
    </div>
  </div>
</Card>
```

---

## Access Control

- Settings pages are admin-only (existing route protection)
- If non-admin somehow accesses: hide settings entirely
- No read-only mode for non-admins

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Offline save | Error toast + manual retry |
| Concurrent edits | Last write wins (no conflict detection) |
| Validation failure | Inline errors below fields + toast |
| API timeout | Error toast, keep form state |
| Network error | Error toast, enable retry |

---

## File Changes

### New Files
```
front/src/components/Switch.tsx
front/src/components/Card.tsx
front/src/components/Divider.tsx
front/src/components/Label.tsx
front/src/components/Checkbox.tsx
front/src/components/Skeleton.tsx
front/src/components/AlertDialog.tsx
front/src/components/Toast.tsx (if not exists)
```

### Modified Files
```
front/src/app/admin/settings/layout.tsx
front/src/app/admin/settings/page.tsx (redirect to general)
front/src/app/admin/settings/general/page.tsx
front/src/app/admin/settings/auth/page.tsx (new merged page)
front/src/app/admin/settings/auth/basic/page.tsx (remove)
front/src/app/admin/settings/auth/google/page.tsx (remove)
front/src/app/admin/settings/auth/layout.tsx (remove)
front/src/app/admin/settings/auth/AuthSettingsLayoutClient.tsx (remove)
front/src/app/admin/settings/workspaces/page.tsx
front/src/components/admin/settings/GeneralSettingsForm.tsx
front/src/components/admin/settings/BasicAuthSettingsForm.tsx
front/src/components/admin/settings/GoogleAuthSettingsForm.tsx
front/src/components/admin/settings/WorkspaceSettingsForm.tsx
front/src/lib/api/settings.ts (new endpoints)
front/package.json (add react-hook-form, @hookform/resolvers)
```

### API Changes
```
api/src/routes/settings.ts (add PATCH endpoints per section)
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x"
  }
}
```

Note: Zod already installed

---

## Testing Requirements

- Test new components (Switch, Card, etc.)
- Test form validation (client + server)
- Test dirty state tracking
- Test confirm dialog on unsaved navigation
- Test API endpoints
- Update existing settings tests

---

## Implementation Priority

If time constrained:
1. **Layout restructure** (essential)
2. New components
3. Feedback UX
4. API changes

---

## Unresolved Questions

1. **Toast component**: Does project have existing toast/notification system? If not, need to add one (recommend sonner or custom).

2. **Form library setup**: Should we create a shared `useSettingsForm` hook wrapping react-hook-form for consistent behavior across sections?

3. **Preset dropdown component**: Should we create a dedicated `PasswordPresetSelect` component or inline the logic?

4. **Section component**: Should we create a reusable `SettingsSection` component that encapsulates the 3-col grid pattern, or keep it as template code in each page?

5. **API error mapping**: How should server validation errors map to form fields? Need to define error response structure.

6. **Toast positioning**: Where should toasts appear? Top-right, top-center, or bottom-right?

7. **Confirm dialog text**: What should the unsaved changes dialog say? (e.g., "You have unsaved changes. Discard them?")
