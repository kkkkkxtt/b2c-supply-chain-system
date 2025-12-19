# Quick Integration Guide - New Features

## Step-by-Step Setup

### 1. Create blockchain_proofs Table

```bash
# Connect to your PostgreSQL database
psql -U scm_user -d supply_chain_db

# Run the schema creation script
\i scripts/create_blockchain_proofs_table.sql

# Verify table creation
\dt blockchain_proofs
```

### 2. Verify Component Imports

All new components are already imported in `app/page.tsx`:

- ✅ `BlockchainHashViewer` - imported and routing added
- ✅ `Pagination` - imported in OrderList, Inventory, ShipmentManager
- ✅ Updated Layout with new nav item

### 3. Test Features Locally

#### Feature 1: Image Removal

```bash
# Start dev server
npm run dev

# Navigate to Marketplace
# Expected: See gradient boxes with icon instead of images
```

#### Feature 2: Seller Address Optional

```bash
# Navigate to signup
# Select "Seller" role
# Address field should show "(Optional)" label
# Can submit without entering address
```

#### Feature 3: Pagination

```bash
# Navigate to My Orders / Inventory / Active Shipments
# Should show 5 items per page
# Navigation buttons should appear
# Click page 2 to test pagination
```

#### Feature 4: Blockchain Height Adjustment

```bash
# Look at bottom of screen
# Find "Hardhat Local Node - Event Stream"
# Click ↑ to decrease, ↓ to increase height
# Should see height value in header update
```

#### Feature 5: Blockchain Hash Viewer

```bash
# Navigate to "View on Blockchain" in sidebar
# Search for a transaction hash / wallet address
# Should display proof details
# Test copy buttons
```

---

## API Endpoints

### Blockchain Proofs Search

```
GET /api/blockchain-proofs
  ?search=<term>
  &txHash=<hash>
  &entity=<id>
  &sender=<address>
  &type=<USER|ITEM|ORDER|SHIPMENT>
  &limit=<1-200>
```

### Examples:

```bash
# Search by transaction hash
GET /api/blockchain-proofs?txHash=0x123abc...

# Search by wallet address
GET /api/blockchain-proofs?sender=0x456def...

# Search by entity ID
GET /api/blockchain-proofs?entity=user_123

# Full-text search
GET /api/blockchain-proofs?search=order_456

# Get recent proofs (default)
GET /api/blockchain-proofs?limit=50
```

---

## Component Usage

### Using Pagination Component

```typescript
import { Pagination } from '@/components/Pagination';

const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 5;

// In your render:
{
  totalPages > 1 && (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      itemsPerPage={ITEMS_PER_PAGE}
      totalItems={items.length}
    />
  );
}
```

### Recording Blockchain Proofs

```typescript
import { recordBlockchainProof } from '@/lib/db/blockchain-proofs';

await recordBlockchainProof(
  entityId: 'item_123',
  entityType: 'ITEM',
  eventType: 4,  // ITEM_METADATA_HASHED
  dataHash: '0xsha256...',
  txHash: '0xtxhash...',
  senderAddress: '0xwalletaddress...',
  metadata: { itemName: 'Product', price: 99.99 }
);
```

### Searching Proofs

```typescript
import { searchBlockchainProofs } from '@/lib/db/blockchain-proofs';

const proofs = await searchBlockchainProofs('0x123abc', 50);
```

---

## Database Query Examples

### Find all proofs for a specific user

```sql
SELECT * FROM blockchain_proofs
WHERE entity_type = 'USER' AND entity_id = 'user_123'
ORDER BY created_at DESC;
```

### Find all orders created by a seller

```sql
SELECT * FROM blockchain_proofs
WHERE event_type = 0  -- ORDER_CREATED
AND sender_address = '0xwalletaddress...';
```

### Find all transactions for an item

```sql
SELECT * FROM blockchain_proofs
WHERE entity_type = 'ITEM' AND entity_id = 'item_456'
ORDER BY created_at DESC;
```

### Find latest 20 transactions

```sql
SELECT * FROM blockchain_proofs
ORDER BY created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Blockchain table not found error

**Solution**: Run `scripts/create_blockchain_proofs_table.sql`

```bash
psql -U scm_user -d supply_chain_db -f scripts/create_blockchain_proofs_table.sql
```

### Pagination not showing

**Ensure**:

- Component has `currentPage` state
- Component passes `onPageChange` function
- Total pages > 1 to show pagination

### Height adjustment buttons not working

**Check**:

- BlockchainViewer is rendering
- ChevronUp/Down icons from lucide-react imported
- Height state updating properly

### Blockchain hash viewer search returns empty

**Possible reasons**:

- No proofs recorded yet (normal at start)
- Search term doesn't match any proofs
- Check console for API errors
- Verify blockchain_proofs table has data

### Copy buttons not working

**Solution**:

- Browser needs clipboard API permissions
- Check browser console for security warnings
- Test in HTTPS or localhost

---

## Environment Notes

### Required Environment Variables

None new required - all features work with existing setup

### Database Compatibility

- PostgreSQL 10+ (uses JSONB)
- Node.js 14+
- Next.js 13+

### Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- (For clipboard API support)

---

## Performance Optimization Tips

1. **Database**: Indexes already created for fast queries
2. **Pagination**: Reduces DOM elements (shows 5 instead of 100+)
3. **Search**: Limited to 200 results by default
4. **Images**: Removed - faster load times
5. **Height Adjustment**: Uses CSS only - no reflows

---

## Monitoring & Maintenance

### Monitor table size:

```sql
SELECT pg_size_pretty(pg_total_relation_size('blockchain_proofs'));
```

### Clean old proofs (if needed):

```sql
DELETE FROM blockchain_proofs
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Analyze table performance:

```sql
ANALYZE blockchain_proofs;
```

---

## Support & Documentation

- **Pagination**: See `components/Pagination.tsx`
- **Blockchain Viewer**: See `components/BlockchainHashViewer.tsx`
- **Database Layer**: See `lib/db/blockchain-proofs.ts`
- **API**: See `app/api/blockchain-proofs/route.ts`
- **Schema**: See `scripts/create_blockchain_proofs_table.sql`

---

**All features ready for production!** ✅
