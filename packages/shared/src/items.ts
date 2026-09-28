import { z } from 'zod';

/**
 * Shop items: cosmetic things bought with PURR. They change how the cat's
 * world looks and give the cat new things to do — they never touch stakes,
 * deadlines or credits.
 *
 * Each item fills one slot, and a slot holds one item at a time: one toy, one
 * bowl, one scratcher, one thing around the neck, one painting… Decor in
 * different slots (plant, fish tank, painting, clock) can all be out at once.
 * The equipped set is the user's "loadout".
 */
export const ITEM_SLOTS = [
  'toy',
  'bed',
  'scratcher',
  'blanket',
  'bowl',
  'neck',
  'plant',
  'aquarium',
  'painting',
  'clock',
] as const;
export type ItemSlot = (typeof ITEM_SLOTS)[number];

export const ITEM_IDS = [
  'ball',
  'yarn',
  'mouse',
  'bed-donut',
  'scratch-post',
  'blanket-knit',
  'bowl-kitty',
  'bowl-tuxedo',
  'bowl-ginger',
  'bowl-calico',
  'collar-bell',
  'bow-tie',
  'plant-monstera',
  'aquarium',
  'art-fish',
  'art-sunset',
  'art-paw',
  'clock-cat',
] as const;
export type ItemId = (typeof ITEM_IDS)[number];

export type ItemCategory = 'toys' | 'comfort' | 'bowls' | 'wearables' | 'decor';

/** From which life stage an item shows up in the scene (a stray in a box owns nothing but a toy). */
export const CATEGORY_FROM_STAGE: Record<ItemCategory, number> = { toys: 1, bowls: 2, comfort: 3, wearables: 3, decor: 3 };

export interface ShopItem {
  id: ItemId;
  slot: ItemSlot;
  category: ItemCategory;
  name: string;
  /** What the cat does with it — shown in the shop. */
  blurb: string;
  pricePurr: number;
}

export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'ball', slot: 'toy', category: 'toys', name: 'Jingle Ball', pricePurr: 60, blurb: 'Lies by its paw on the floor. Swat — it rolls away and back.' },
  { id: 'yarn', slot: 'toy', category: 'toys', name: 'Ball of Yarn', pricePurr: 60, blurb: 'Crouch, wiggle, pounce, then a big swat.' },
  { id: 'mouse', slot: 'toy', category: 'toys', name: 'Plush Mouse', pricePurr: 70, blurb: 'A suspicious sniff, then flicked into the air.' },
  { id: 'bed-donut', slot: 'bed', category: 'comfort', name: 'Donut Bed', pricePurr: 180, blurb: 'The cat sits in it and dozes off now and then.' },
  { id: 'scratch-post', slot: 'scratcher', category: 'comfort', name: 'Scratching Post', pricePurr: 150, blurb: 'Stands right by its side; it turns and sharpens its claws on it.' },
  { id: 'blanket-knit', slot: 'blanket', category: 'comfort', name: 'Knitted Blanket', pricePurr: 120, blurb: 'Spread under the cat. It kneads it with its eyes shut.' },
  { id: 'bowl-kitty', slot: 'bowl', category: 'bowls', name: 'Kitty Ears Bowl', pricePurr: 40, blurb: 'Its food bowl. It keeps glancing at it.' },
  { id: 'bowl-tuxedo', slot: 'bowl', category: 'bowls', name: 'Tuxedo Bowl', pricePurr: 40, blurb: 'Black and white, very formal dining.' },
  { id: 'bowl-ginger', slot: 'bowl', category: 'bowls', name: 'Ginger Tabby Bowl', pricePurr: 40, blurb: 'Orange stripes and whiskers.' },
  { id: 'bowl-calico', slot: 'bowl', category: 'bowls', name: 'Calico Bowl', pricePurr: 40, blurb: 'Patches of orange and black.' },
  { id: 'collar-bell', slot: 'neck', category: 'wearables', name: 'Bell Collar', pricePurr: 90, blurb: 'A red collar with a golden bell that swings when it plays.' },
  { id: 'bow-tie', slot: 'neck', category: 'wearables', name: 'Bow Tie', pricePurr: 90, blurb: 'For cats who mean business.' },
  { id: 'plant-monstera', slot: 'plant', category: 'decor', name: 'Potted Monstera', pricePurr: 100, blurb: 'A plant for the room.' },
  { id: 'aquarium', slot: 'aquarium', category: 'decor', name: 'Fish Tank', pricePurr: 200, blurb: 'Fish swim; the cat stares at them from where it sits.' },
  { id: 'art-fish', slot: 'painting', category: 'decor', name: 'Fish Painting', pricePurr: 80, blurb: 'Framed art for the wall. A classic.' },
  { id: 'art-sunset', slot: 'painting', category: 'decor', name: 'Sunset Painting', pricePurr: 80, blurb: 'Framed art for the wall. Warm and calm.' },
  { id: 'art-paw', slot: 'painting', category: 'decor', name: 'Paw Print Art', pricePurr: 80, blurb: 'Framed art for the wall. Signed by the artist.' },
  { id: 'clock-cat', slot: 'clock', category: 'decor', name: 'Cat Wall Clock', pricePurr: 120, blurb: 'Shows your real time; its tail swings. The cat checks it.' },
];

export const ITEM_CATEGORIES: ReadonlyArray<{ id: ItemCategory; label: string }> = [
  { id: 'toys', label: 'Toys' },
  { id: 'comfort', label: 'Comfort' },
  { id: 'bowls', label: 'Bowls' },
  { id: 'wearables', label: 'Wearables' },
  { id: 'decor', label: 'Room decor' },
];

export function itemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find(i => i.id === id);
}

/** Ledger id for an item purchase (cats use "cat:<id>"). */
export const itemLedgerId = (itemId: string): string => `item:${itemId}`;

export const itemIdSchema = z.enum(ITEM_IDS);
export const itemSlotSchema = z.enum(ITEM_SLOTS);

/** Equipped items, one per slot. */
export const loadoutSchema = z.object({
  toy: itemIdSchema.optional(),
  bed: itemIdSchema.optional(),
  scratcher: itemIdSchema.optional(),
  blanket: itemIdSchema.optional(),
  bowl: itemIdSchema.optional(),
  neck: itemIdSchema.optional(),
  plant: itemIdSchema.optional(),
  aquarium: itemIdSchema.optional(),
  painting: itemIdSchema.optional(),
  clock: itemIdSchema.optional(),
});
export type Loadout = Partial<Record<ItemSlot, ItemId>>;

export const buyItemSchema = z.object({ itemId: itemIdSchema });
export const equipItemSchema = z.object({ slot: itemSlotSchema, itemId: itemIdSchema.nullable() });

/** Keeps only valid, slot-matching entries — the stored JSON is never trusted blindly. */
export function sanitizeLoadout(raw: unknown): Loadout {
  const out: Loadout = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const slot of ITEM_SLOTS) {
    const id = (raw as Record<string, unknown>)[slot];
    const item = typeof id === 'string' ? itemById(id) : undefined;
    if (item && item.slot === slot) out[slot] = item.id;
  }
  return out;
}
