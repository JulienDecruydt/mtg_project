// Scryfall API Types
// Reference: https://scryfall.com/docs/api

export interface ScryfallCard {
  id: string;
  oracle_id: string;
  name: string;
  lang: string;
  released_at: string;
  uri: string;
  scryfall_uri: string;
  layout: string;
  highres_image: boolean;
  image_status: "missing" | "placeholder" | "lowres" | "highres_scan";
  image_uris?: ScryfallImageUris;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  colors?: string[];
  color_identity: string[];
  keywords: string[];
  legalities: Record<string, "legal" | "not_legal" | "restricted" | "banned">;
  games: string[];
  reserved: boolean;
  foil: boolean;
  nonfoil: boolean;
  finishes: string[];
  oversized: boolean;
  promo: boolean;
  reprint: boolean;
  variation: boolean;
  set_id: string;
  set: string;
  set_name: string;
  set_type: string;
  set_uri: string;
  set_search_uri: string;
  scryfall_set_uri: string;
  rulings_uri: string;
  prints_search_uri: string;
  collector_number: string;
  digital: boolean;
  rarity: "common" | "uncommon" | "rare" | "mythic" | "special" | "bonus";
  flavor_text?: string;
  card_back_id?: string;
  artist?: string;
  artist_ids?: string[];
  illustration_id?: string;
  border_color: "black" | "white" | "borderless" | "silver" | "gold";
  frame: string;
  frame_effects?: string[];
  security_stamp?: string;
  full_art: boolean;
  textless: boolean;
  booster: boolean;
  story_spotlight: boolean;
  edhrec_rank?: number;
  penny_rank?: number;
  prices: ScryfallPrices;
  related_uris: Record<string, string>;
  purchase_uris?: Record<string, string>;
  card_faces?: ScryfallCardFace[];
}

export interface ScryfallImageUris {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
}

export interface ScryfallCardFace {
  object: "card_face";
  name: string;
  mana_cost: string;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  power?: string;
  toughness?: string;
  loyalty?: string;
  flavor_text?: string;
  artist?: string;
  artist_id?: string;
  illustration_id?: string;
  image_uris?: ScryfallImageUris;
}

export interface ScryfallPrices {
  usd?: string | null;
  usd_foil?: string | null;
  usd_etched?: string | null;
  eur?: string | null;
  eur_foil?: string | null;
  tix?: string | null;
}

export interface ScryfallList {
  object: "list";
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
  warnings?: string[];
}

export interface ScryfallError {
  object: "error";
  code: string;
  status: number;
  warnings?: string[];
  details: string;
}

// Search Parameters
export type UniqueMode = "cards" | "art" | "prints";
export type SortOrder =
  | "name"
  | "set"
  | "released"
  | "rarity"
  | "color"
  | "usd"
  | "tix"
  | "eur"
  | "cmc"
  | "power"
  | "toughness"
  | "edhrec"
  | "penny"
  | "artist"
  | "review";
export type SortDirection = "auto" | "asc" | "desc";

export interface SearchParams {
  q: string;
  unique?: UniqueMode;
  order?: SortOrder;
  dir?: SortDirection;
  include_extras?: boolean;
  include_multilingual?: boolean;
  include_variations?: boolean;
  page?: number;
  format?: "json" | "csv";
  pretty?: boolean;
}

// Search form state
export interface SearchFormState {
  // Main query
  query: string;

  // API parameters
  unique: UniqueMode;
  order: SortOrder;
  dir: SortDirection;
  includeExtras: boolean;
  includeMultilingual: boolean;
  includeVariations: boolean;

  // Color filters
  colors: string[];
  colorIdentity: string[];
  colorMode: "exact" | "include" | "atMost" | "morethan";

  // Type filters
  types: string[];
  subtypes: string;

  // Text search
  oracleText: string;
  flavorText: string;

  // Stats
  manaValue: string;
  manaValueOp: "=" | "<" | ">" | "<=" | ">=" | "!=";
  power: string;
  powerOp: "=" | "<" | ">" | "<=" | ">=" | "!=";
  toughness: string;
  toughnessOp: "=" | "<" | ">" | "<=" | ">=" | "!=";
  loyalty: string;
  loyaltyOp: "=" | "<" | ">" | "<=" | ">=" | "!=";

  // Rarity
  rarities: string[];

  // Set & Format
  sets: string;
  formats: string[];
  legalIn: string;

  // Price
  priceUsd: string;
  priceUsdOp: "=" | "<" | ">" | "<=" | ">=" | "!=";
  priceCurrency: "usd" | "eur" | "tix";

  // Misc
  artist: string;
  year: string;
  yearOp: "=" | "<" | ">" | "<=" | ">=" | "!=";
  isFullArt: boolean;
  isPromo: boolean;
  isReprint: boolean;
}

// Constants for form options
export const COLORS = [
  { value: "W", label: "White", symbol: "⚪" },
  { value: "U", label: "Blue", symbol: "🔵" },
  { value: "B", label: "Black", symbol: "⚫" },
  { value: "R", label: "Red", symbol: "🔴" },
  { value: "G", label: "Green", symbol: "🟢" },
  { value: "C", label: "Colorless", symbol: "◇" },
];

export const CARD_TYPES = [
  "Creature",
  "Instant",
  "Sorcery",
  "Artifact",
  "Enchantment",
  "Planeswalker",
  "Land",
  "Battle",
  "Kindred",
];

export const RARITIES = [
  { value: "common", label: "Common" },
  { value: "uncommon", label: "Uncommon" },
  { value: "rare", label: "Rare" },
  { value: "mythic", label: "Mythic" },
  { value: "special", label: "Special" },
  { value: "bonus", label: "Bonus" },
];

export const FORMATS = [
  { value: "standard", label: "Standard" },
  { value: "pioneer", label: "Pioneer" },
  { value: "modern", label: "Modern" },
  { value: "legacy", label: "Legacy" },
  { value: "vintage", label: "Vintage" },
  { value: "commander", label: "Commander" },
  { value: "pauper", label: "Pauper" },
  { value: "historic", label: "Historic" },
  { value: "alchemy", label: "Alchemy" },
  { value: "explorer", label: "Explorer" },
  { value: "brawl", label: "Brawl" },
  { value: "penny", label: "Penny Dreadful" },
  { value: "oathbreaker", label: "Oathbreaker" },
  { value: "duel", label: "Duel Commander" },
  { value: "predh", label: "PreDH" },
  { value: "oldschool", label: "Old School 93/94" },
  { value: "premodern", label: "Premodern" },
];

export const UNIQUE_MODES: { value: UniqueMode; label: string }[] = [
  { value: "cards", label: "Unique Cards (default)" },
  { value: "art", label: "Unique Artwork" },
  { value: "prints", label: "All Prints" },
];

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "set", label: "Set/Number" },
  { value: "released", label: "Release Date" },
  { value: "rarity", label: "Rarity" },
  { value: "color", label: "Color" },
  { value: "usd", label: "Price (USD)" },
  { value: "eur", label: "Price (EUR)" },
  { value: "tix", label: "Price (TIX)" },
  { value: "cmc", label: "Mana Value" },
  { value: "power", label: "Power" },
  { value: "toughness", label: "Toughness" },
  { value: "edhrec", label: "EDHREC Rank" },
  { value: "penny", label: "Penny Rank" },
  { value: "artist", label: "Artist" },
  { value: "review", label: "Review Order" },
];

export const SORT_DIRECTIONS: { value: SortDirection; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

export const COMPARISON_OPERATORS = [
  { value: "=", label: "=" },
  { value: "<", label: "<" },
  { value: ">", label: ">" },
  { value: "<=", label: "≤" },
  { value: ">=", label: "≥" },
  { value: "!=", label: "≠" },
];

