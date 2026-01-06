"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Pagination } from "@heroui/pagination";
import { Image } from "@heroui/image";
import { Select, SelectItem } from "@heroui/select";
import {
  ScryfallCard,
  ScryfallList,
  ScryfallError,
  UniqueMode,
  SortOrder,
  SortDirection,
} from "@/types/scryfall";
import { useFavorites } from "@/hooks/useFavorites";

const CARDS_PER_PAGE = 20;

type LocalSortField = "name" | "price" | "mana" | "rarity";
type LocalSortDir = "asc" | "desc";

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
  { value: "mana", label: "Mana" },
  { value: "rarity", label: "Rarity" },
];

const RARITY_ORDER: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  mythic: 4,
  special: 5,
  bonus: 6,
};

// Parse search query into user-friendly criteria
function parseSearchCriteria(query: string): { label: string; value: string }[] {
  const criteria: { label: string; value: string }[] = [];
  
  const patterns = [
    { regex: /c[=:<>]+([WUBRGC]+)/gi, label: "Colors" },
    { regex: /id[=:<>]+([WUBRGC]+)/gi, label: "Color Identity" },
    { regex: /t:([^\s"]+|"[^"]+")/gi, label: "Type" },
    { regex: /o:"([^"]+)"/gi, label: "Text contains" },
    { regex: /o:([^\s]+)/gi, label: "Text contains" },
    { regex: /mv([=<>]+)(\d+)/gi, label: "Mana Value" },
    { regex: /cmc([=<>]+)(\d+)/gi, label: "Mana Value" },
    { regex: /pow([=<>]+)(\d+|\*)/gi, label: "Power" },
    { regex: /tou([=<>]+)(\d+|\*)/gi, label: "Toughness" },
    { regex: /loy([=<>]+)(\d+)/gi, label: "Loyalty" },
    { regex: /r:(\w+)/gi, label: "Rarity" },
    { regex: /e:(\w+)/gi, label: "Set" },
    { regex: /f:(\w+)/gi, label: "Format" },
    { regex: /legal:(\w+)/gi, label: "Legal in" },
    { regex: /usd([=<>]+)([\d.]+)/gi, label: "Price USD" },
    { regex: /eur([=<>]+)([\d.]+)/gi, label: "Price EUR" },
    { regex: /a:"([^"]+)"/gi, label: "Artist" },
    { regex: /a:([^\s]+)/gi, label: "Artist" },
    { regex: /year([=<>]+)(\d+)/gi, label: "Year" },
    { regex: /ft:"([^"]+)"/gi, label: "Flavor text" },
    { regex: /is:full/gi, label: "Special", value: "Full Art" },
    { regex: /is:promo/gi, label: "Special", value: "Promo" },
    { regex: /is:reprint/gi, label: "Special", value: "Reprint" },
  ];

  const colorMap: Record<string, string> = {
    W: "White", U: "Blue", B: "Black", R: "Red", G: "Green", C: "Colorless",
  };

  const rarityMap: Record<string, string> = {
    c: "Common", common: "Common", u: "Uncommon", uncommon: "Uncommon",
    r: "Rare", rare: "Rare", m: "Mythic", mythic: "Mythic",
  };

  let remaining = query;

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(query)) !== null) {
      let value = pattern.value || match[1] || match[2] || "";
      value = value.replace(/"/g, "");
      
      if (pattern.label === "Colors" || pattern.label === "Color Identity") {
        value = value.toUpperCase().split("").map(c => colorMap[c] || c).join(", ");
      }
      
      if (pattern.label === "Rarity") {
        value = rarityMap[value.toLowerCase()] || value;
      }

      if (match[1] && match[2]) {
        const op = match[1].replace("=", "").replace("<", "≤").replace(">", "≥") || "=";
        value = `${op} ${match[2]}`;
      }
      
      if (!criteria.some(c => c.label === pattern.label && c.value === value)) {
        criteria.push({ label: pattern.label, value });
      }
      
      remaining = remaining.replace(match[0], "").trim();
    }
  }

  const cleanRemaining = remaining.replace(/\s+/g, " ").trim();
  if (cleanRemaining && cleanRemaining.length > 0) {
    const filtered = cleanRemaining.replace(/[()OR AND]/gi, "").trim();
    if (filtered) {
      criteria.unshift({ label: "Name", value: filtered });
    }
  }

  return criteria;
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allCards, setAllCards] = useState<ScryfallCard[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiPage, setApiPage] = useState(1);
  const [hasMoreFromApi, setHasMoreFromApi] = useState(false);
  const [query, setQuery] = useState("");

  const [sortField, setSortField] = useState<LocalSortField>("name");
  const [sortDir, setSortDir] = useState<LocalSortDir>("asc");

  const { isFavorite, toggleFavorite, isLoaded: favoritesLoaded } = useFavorites();

  const q = searchParams.get("q") || "";
  const unique = (searchParams.get("unique") as UniqueMode) || "cards";
  const order = (searchParams.get("order") as SortOrder) || "name";
  const dir = (searchParams.get("dir") as SortDirection) || "auto";
  const includeExtras = searchParams.get("include_extras") === "true";
  const includeMultilingual = searchParams.get("include_multilingual") === "true";
  const includeVariations = searchParams.get("include_variations") === "true";

  const searchCriteria = useMemo(() => parseSearchCriteria(q), [q]);

  const fetchCards = useCallback(
    async (page: number) => {
      if (!q) {
        setError("No search query provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setQuery(q);

      try {
        const params = new URLSearchParams({
          q, unique, order, dir,
          page: page.toString(),
          format: "json",
        });

        if (includeExtras) params.append("include_extras", "true");
        if (includeMultilingual) params.append("include_multilingual", "true");
        if (includeVariations) params.append("include_variations", "true");

        const response = await fetch(
          `https://api.scryfall.com/cards/search?${params.toString()}`,
          { headers: { Accept: "application/json" } },
        );

        const data: ScryfallList | ScryfallError = await response.json();

        if ("object" in data && data.object === "error") {
          setError((data as ScryfallError).details);
          setAllCards([]);
          setTotalCards(0);
        } else {
          const result = data as ScryfallList;
          if (page === 1) {
            setAllCards(result.data);
          } else {
            setAllCards((prev) => [...prev, ...result.data]);
          }
          setTotalCards(result.total_cards);
          setHasMoreFromApi(result.has_more);
          setApiPage(page);
        }
      } catch {
        setError("Failed to fetch cards. Please try again.");
        setAllCards([]);
        setTotalCards(0);
      } finally {
        setLoading(false);
      }
    },
    [q, unique, order, dir, includeExtras, includeMultilingual, includeVariations],
  );

  useEffect(() => {
    fetchCards(1);
  }, [fetchCards]);

  const sortedCards = useMemo(() => {
    const sorted = [...allCards].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          const priceA = a.prices.usd ? parseFloat(a.prices.usd) : -1;
          const priceB = b.prices.usd ? parseFloat(b.prices.usd) : -1;
          comparison = priceA - priceB;
          break;
        case "mana":
          comparison = a.cmc - b.cmc;
          break;
        case "rarity":
          comparison = (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0);
          break;
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [allCards, sortField, sortDir]);

  const displayedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    return sortedCards.slice(startIndex, startIndex + CARDS_PER_PAGE);
  }, [sortedCards, currentPage]);

  const totalPages = useMemo(() => Math.ceil(sortedCards.length / CARDS_PER_PAGE), [sortedCards]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      const neededCards = page * CARDS_PER_PAGE;
      if (neededCards > allCards.length && hasMoreFromApi) {
        fetchCards(apiPage + 1);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [allCards.length, hasMoreFromApi, apiPage, fetchCards],
  );

  const getCardImage = useCallback((card: ScryfallCard): string | null => {
    if (card.image_uris?.normal) return card.image_uris.normal;
    if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal;
    return null;
  }, []);

  const handleBack = useCallback(() => router.push("/search"), [router]);
  const handleCardClick = useCallback((cardId: string) => router.push(`/card?id=${cardId}`), [router]);
  const handleLikeClick = useCallback(
    (e: React.MouseEvent, card: ScryfallCard) => {
      e.stopPropagation();
      toggleFavorite(card);
    },
    [toggleFavorite],
  );

  return (
    <div className="min-h-screen -mx-4 sm:-mx-6">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-default-200 shadow-lg">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <Button
            className="font-semibold"
            color="primary"
            radius="full"
            size="sm"
            startContent={<span>←</span>}
            variant="shadow"
            onPress={handleBack}
          >
            Back
          </Button>
          {!loading && sortedCards.length > 0 && (
            <span className="text-sm text-default-600 font-medium">
              {sortedCards.length.toLocaleString()} cards found
            </span>
          )}
        </div>
      </div>

      <div className="pt-16 pb-8 px-4 sm:px-6">
        {searchCriteria.length > 0 && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center mb-4">Search Results</h1>
            <Card className="bg-default-50 border border-default-200">
              <CardBody className="py-3 px-4">
                <p className="text-xs text-default-500 mb-2 font-medium uppercase tracking-wide">
                  Searching for
                </p>
                <div className="flex flex-wrap gap-2">
                  {searchCriteria.map((criteria, index) => (
                    <Chip key={`${criteria.label}-${index}`} className="px-3" color="primary" size="sm" variant="flat">
                      <span className="font-medium">{criteria.label}:</span>{" "}
                      <span className="text-default-700">{criteria.value}</span>
                    </Chip>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <Spinner color="primary" label="Searching cards..." size="lg" />
          </div>
        )}

        {error && !loading && (
          <Card className="bg-danger-50 border border-danger-200 max-w-md mx-auto">
            <CardBody className="text-center py-8">
              <p className="text-danger font-medium text-lg mb-4">⚠️ {error}</p>
              <Button color="primary" variant="flat" onPress={handleBack}>Return to Search</Button>
            </CardBody>
          </Card>
        )}

        {!loading && !error && displayedCards.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-default-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-default-500">Sort by:</span>
                <Select
                  className="w-32"
                  classNames={{ trigger: "h-9 min-h-9" }}
                  selectedKeys={[sortField]}
                  size="sm"
                  variant="bordered"
                  aria-label="Sort by"
                  onSelectionChange={(keys) => {
                    setSortField(Array.from(keys)[0] as LocalSortField);
                    setCurrentPage(1);
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value}>{opt.label}</SelectItem>
                  ))}
                </Select>
                <div className="flex rounded-lg overflow-hidden border border-default-200">
                  <button
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      sortDir === "asc" ? "bg-primary text-primary-foreground" : "bg-default-100 text-default-600 hover:bg-default-200"
                    }`}
                    onClick={() => { setSortDir("asc"); setCurrentPage(1); }}
                  >
                    Asc ↑
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      sortDir === "desc" ? "bg-primary text-primary-foreground" : "bg-default-100 text-default-600 hover:bg-default-200"
                    }`}
                    onClick={() => { setSortDir("desc"); setCurrentPage(1); }}
                  >
                    Desc ↓
                  </button>
                </div>
              </div>
              {totalPages > 1 && (
                <Pagination color="primary" page={currentPage} showControls siblings={1} total={totalPages} onChange={handlePageChange} />
              )}
            </div>

            <div className="text-center text-sm text-default-500">
              Showing {(currentPage - 1) * CARDS_PER_PAGE + 1} - {Math.min(currentPage * CARDS_PER_PAGE, sortedCards.length)} of {sortedCards.length.toLocaleString()}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayedCards.map((card) => {
                const isLiked = favoritesLoaded && isFavorite(card.id);
                return (
                  <Card
                    key={card.id}
                    isPressable
                    className="bg-content1 hover:scale-105 transition-transform duration-200 relative"
                    onPress={() => handleCardClick(card.id)}
                  >
                    <button
                      className={`absolute bottom-15 left-2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
                        isLiked ? "bg-red-100 text-white" : "bg-black/50 text-white hover:bg-black/70"
                      }`}
                      onClick={(e) => handleLikeClick(e, card)}
                    >
                      {isLiked ? "❤️" : "🤍"}
                    </button>
                    <CardBody className="p-0 overflow-hidden">
                      {getCardImage(card) ? (
                        <Image alt={card.name} className="w-full h-auto object-cover" radius="none" src={getCardImage(card)!} />
                      ) : (
                        <div className="w-full aspect-[488/680] bg-default-200 flex items-center justify-center">
                          <span className="text-default-500 text-xs text-center px-2">No image</span>
                        </div>
                      )}
                    </CardBody>
                    <CardFooter className="flex flex-col items-start gap-1 p-2 bg-content2">
                      <p className="text-xs text-left font-semibold truncate w-full">{card.name}</p>
                      <div className="flex justify-between w-full items-center">
                        <Chip
                          className="text-[10px] h-5"
                          color={card.rarity === "mythic" ? "danger" : card.rarity === "rare" ? "warning" : card.rarity === "uncommon" ? "secondary" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          {card.rarity}
                        </Chip>
                        {card.prices.usd && <span className="text-[10px] text-success font-medium">${card.prices.usd}</span>}
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-default-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-default-500">Sort by:</span>
                  <Select
                    className="w-32"
                    classNames={{ trigger: "h-9 min-h-9" }}
                    selectedKeys={[sortField]}
                    size="sm"
                    variant="bordered"
                    aria-label="Sort by"
                    onSelectionChange={(keys) => {
                      setSortField(Array.from(keys)[0] as LocalSortField);
                      setCurrentPage(1);
                    }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </Select>
                  <div className="flex rounded-lg overflow-hidden border border-default-200">
                    <button
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        sortDir === "asc" ? "bg-primary text-primary-foreground" : "bg-default-100 text-default-600 hover:bg-default-200"
                      }`}
                      onClick={() => { setSortDir("asc"); setCurrentPage(1); }}
                    >
                      Asc ↑
                    </button>
                    <button
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        sortDir === "desc" ? "bg-primary text-primary-foreground" : "bg-default-100 text-default-600 hover:bg-default-200"
                      }`}
                      onClick={() => { setSortDir("desc"); setCurrentPage(1); }}
                    >
                      Desc ↓
                    </button>
                  </div>
                </div>
                <Pagination color="primary" page={currentPage} showControls siblings={1} total={totalPages} onChange={handlePageChange} />
              </div>
            )}
          </div>
        )}

        {!loading && !error && allCards.length === 0 && (
          <Card className="max-w-md mx-auto">
            <CardBody className="text-center py-12">
              <p className="text-xl mb-4">🔍 No cards found</p>
              <p className="text-default-500 mb-6">Try adjusting your search criteria</p>
              <Button color="primary" variant="flat" onPress={handleBack}>Back to Search</Button>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

// Wrap with Suspense for static export compatibility
export default function SearchResults() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner color="primary" label="Loading..." size="lg" />
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
