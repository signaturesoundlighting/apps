# Supabase Integration Plan

## Files Created

1. **SUPABASE_SETUP.md** - Step-by-step setup guide
2. **supabaseConfig.js** - Configuration file (you'll add your credentials here)
3. **supabaseHelpers.js** - Helper functions for database operations

## Quick Start Checklist

### 1. Set Up Supabase (15 minutes)
- [ ] Create Supabase account and project
- [ ] Get your Project URL and anon key
- [ ] Run the SQL schema from SUPABASE_SETUP.md
- [ ] Add credentials to `supabaseConfig.js`

### 2. Test Connection
- [ ] Open browser console
- [ ] Check for "Supabase initialized" message
- [ ] Verify no errors

### 3. Integration Priority

#### Phase 1: Service Agreement Data (HIGH PRIORITY)
**Files to update:**
- `serviceAgreement.js`
  - Load client data on page load
  - Save form fields as user types
  - Save signature when submitted

**Functions to replace:**
```javascript
// Current: Uses const eventData = {...}
// New: await getClientData(clientId)
```

#### Phase 2: Payment Status (HIGH PRIORITY)
**Files to update:**
- `depositPayment.js`
  - Check payment status from database
  - Update payment status after Stripe payment

**Functions to replace:**
```javascript
// Current: localStorage.getItem('depositPaid')
// New: await getClientData(clientId) then check deposit_paid field
```

#### Phase 3: Events Data (MEDIUM PRIORITY)
**Files to update:**
- `data.js` - Load events from database
- `modal.js` - Save event changes to database
- `drag.js` - Save new event order to database
- `ui.js` - Load events on page load

#### Phase 4: General Info (MEDIUM PRIORITY)
**Files to update:**
- `modal.js` - Save general info to database
- `ui.js` - Load general info on page load

## Implementation Pattern

For each integration point, follow this pattern:

```javascript
// OLD WAY (localStorage)
const data = JSON.parse(localStorage.getItem('myData'));

// NEW WAY (Supabase)
const clientId = window.supabaseHelpers.getCurrentClientId();
const data = await window.supabaseHelpers.getClientData(clientId);
```

## Migration Strategy

### Option 1: Gradual Migration (Recommended)
1. Keep localStorage as fallback
2. Try to load from Supabase first
3. If fails, fall back to localStorage
4. Gradually replace all localStorage calls

### Option 2: Full Migration
1. Update all files at once
2. Remove all localStorage usage
3. Require Supabase connection

## Testing Checklist

- [ ] Service agreement loads client data
- [ ] Service agreement saves form fields
- [ ] Payment status loads correctly
- [ ] Payment status updates after payment
- [ ] Events load from database
- [ ] Events save when modified
- [ ] Event order saves when dragged
- [ ] General info loads and saves

## Next Steps

1. **First**: Complete Supabase setup (see SUPABASE_SETUP.md)
2. **Second**: Test serviceAgreement.js integration
3. **Third**: Test depositPayment.js integration
4. **Fourth**: Migrate events and general info

## Helpful Supabase Resources

- [Supabase Docs](https://supabase.com/docs)
- [JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

