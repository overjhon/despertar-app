-- Fix old data in pending_purchases by mapping product_id to real ebook_id
-- Step 1: Update ebook_id from product_id to real ebook_id using product_mappings
UPDATE pending_purchases pp
SET ebook_id = pm.ebook_id
FROM product_mappings pm
WHERE pp.ebook_id::text = pm.product_id
  AND pp.ebook_id != pm.ebook_id;

-- Step 2: Reset claimed status for purchases that were marked claimed but never delivered
-- (claimed=true but no claimed_by and user doesn't own the ebook)
UPDATE pending_purchases pp
SET 
  claimed = false,
  claimed_at = NULL,
  claimed_by = NULL
WHERE pp.claimed = true
  AND pp.claimed_by IS NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM user_ebooks ue 
    INNER JOIN auth.users au ON au.id = ue.user_id
    WHERE ue.ebook_id = pp.ebook_id 
      AND LOWER(TRIM(au.email)) = LOWER(TRIM(pp.email))
  );