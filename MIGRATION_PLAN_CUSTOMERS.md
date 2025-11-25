# Migration Plan: Adding Customers Table

## Overview
This migration plan adds a dedicated `customers` table to normalize customer data while maintaining full backward compatibility with existing orders.

## Migration Strategy

### Phase 1: Database Schema (Non-Breaking)
- ✅ Create `customers` table
- ✅ Add nullable `customer_id` column to `orders` table
- ✅ Create indexes for performance
- ✅ Existing orders continue to work (customer_id is NULL)

### Phase 2: Data Migration
- ✅ Migrate existing orders to create customer records
- ✅ Link existing orders to customers
- ✅ Update customer statistics (total orders, total spent)

### Phase 3: API Updates (Optional - Can be done later)
- Update `create-order` API to optionally create/link customers
- Add customer lookup functionality
- Maintain backward compatibility

## Execution Steps

### Step 1: Run SQL Migration
Execute `supabase-migration-customers.sql` in Supabase SQL Editor.

**What it does:**
1. Creates `customers` table with email as unique identifier
2. Adds nullable `customer_id` to `orders` table
3. Migrates existing orders to create customer records
4. Links orders to customers
5. Creates helper functions and triggers

**Time:** ~2-5 minutes depending on number of orders

**Risk:** Low - all changes are backward compatible

### Step 2: Verify Migration
```sql
-- Check customers were created
SELECT COUNT(*) FROM customers;

-- Check orders are linked
SELECT 
  COUNT(*) as total_orders,
  COUNT(customer_id) as linked_orders,
  COUNT(*) - COUNT(customer_id) as unlinked_orders
FROM orders;

-- Check customer stats
SELECT email, name, total_orders, total_spent 
FROM customers 
ORDER BY total_spent DESC 
LIMIT 10;
```

### Step 3: Update API (Optional - Can be done later)
Update `/api/create-order/route.ts` to use customer table:

```typescript
// Option 1: Use helper function (recommended)
const { data: customerData } = await supabase.rpc('get_or_create_customer', {
  p_email: customer_email,
  p_phone: customer_phone,
  p_name: customer_name
});

// Option 2: Manual lookup/create
let customerId;
const { data: existingCustomer } = await supabase
  .from('customers')
  .select('id')
  .eq('email', customer_email)
  .single();

if (existingCustomer) {
  customerId = existingCustomer.id;
} else {
  const { data: newCustomer } = await supabase
    .from('customers')
    .insert({ email: customer_email, phone: customer_phone, name: customer_name })
    .select('id')
    .single();
  customerId = newCustomer.id;
}
```

### Step 4: Update TypeScript Types
Update `types/order.ts` to include `customer_id`:

```typescript
export interface Order {
  // ... existing fields
  customer_id: string | null;
}
```

## Benefits After Migration

1. **Customer Analytics**
   - Track repeat customers
   - Calculate customer lifetime value
   - Identify top customers

2. **Future Features Ready**
   - Customer accounts/login
   - Order history per customer
   - Saved addresses
   - Customer preferences

3. **Data Quality**
   - Single source of truth for customer data
   - Easier to update customer information
   - Better data consistency

4. **Reporting**
   - Customer segmentation
   - Repeat purchase rate
   - Average order value per customer

## Rollback Plan

If needed, you can rollback:

```sql
-- Remove customer_id from orders (data preserved in customer_name/email/phone)
ALTER TABLE orders DROP COLUMN IF EXISTS customer_id;

-- Drop customers table (if no longer needed)
DROP TABLE IF EXISTS customers CASCADE;
```

**Note:** This won't lose any order data since customer info is still in orders table.

## Testing Checklist

- [ ] Run migration SQL
- [ ] Verify customers table created
- [ ] Verify existing orders still accessible
- [ ] Verify new orders can be created (with or without customer_id)
- [ ] Test customer lookup function
- [ ] Verify customer stats are updated correctly
- [ ] Test API still works (backward compatible)

## Next Steps (After Migration)

1. **Optional:** Update API to use customer table (see `app/api/create-order-with-customer.example.ts`)
2. **Optional:** Add customer lookup endpoint (see `app/api/get-customer.example.ts`)
3. **Future:** Build customer portal/account system
4. **Future:** Add customer preferences/saved addresses

## Files Created

1. **`supabase-migration-customers.sql`** - Complete migration SQL script
2. **`types/customer.ts`** - TypeScript type definitions for Customer
3. **`app/api/create-order-with-customer.example.ts`** - Example API update
4. **`app/api/get-customer.example.ts`** - Example customer lookup endpoint

## Quick Start

1. Run `supabase-migration-customers.sql` in Supabase SQL Editor
2. Verify migration with test queries
3. (Optional) Update API when ready - current API continues to work
4. (Optional) Add customer features gradually

## Notes

- Migration is **non-breaking** - existing code continues to work
- Customer table is **optional** - orders can still be created without it
- Email is used as unique identifier (one customer per email)
- Customer stats are auto-updated via trigger
- Can be implemented gradually - no rush

