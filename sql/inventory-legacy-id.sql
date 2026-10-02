-- Run once in the Supabase SQL Editor (2026-10-02), before the Inventory
-- migration. inventory_items.id is a uuid, so each migrated item's old app id
-- ("inv2", "inv1727…") is kept here instead. Materials Used still points at
-- items by those old ids, so the app looks items up by either id, and the
-- Materials Used migration later maps old → new through this column.
alter table public.inventory_items
  add column if not exists legacy_id text unique;
