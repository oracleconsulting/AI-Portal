# Committee Switcher Setup Guide

## Overview

The committee switcher allows users who are members of both Implementation and Oversight committees to easily switch between the two portals.

## Database Migration

1. **Run Migration 012:**
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/012_multiple_committees.sql
   ```

2. **Add Dual Committee Access:**
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/add-dual-committee-users.sql
   ```

   This will add both committees to:
   - jhoward@rpgcc.co.uk
   - sjohnson@rpgcc.co.uk
   - kdunn@rpgcc.co.uk

## How It Works

- The `profiles` table now has a `committees` TEXT[] array column
- Users can belong to multiple committees
- The committee switcher appears in the sidebar header for users with multiple committee access
- Switching preserves the current page path (e.g., `/implementation/forms` → `/oversight/forms`)

## Adding More Users to Multiple Committees

To add more users to both committees, run:

```sql
UPDATE profiles
SET committees = ARRAY['implementation', 'oversight']::TEXT[]
WHERE email = 'user@rpgcc.co.uk';
```

## Component Usage

The `CommitteeSwitcher` component is automatically included in the `Sidebar` component and only appears for users with access to multiple committees.

## Testing

1. Log in as one of the dual-committee users
2. You should see a committee switcher button in the sidebar header
3. Click it to see available committees
4. Select a different committee to switch portals
5. The URL and content should update accordingly

