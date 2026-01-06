"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Image } from "@heroui/image";
import { Select, SelectItem } from "@heroui/select";
import { Pagination } from "@heroui/pagination";
import { useFavorites, FavoriteCard } from "@/hooks/useFavorites";

const CARDS_PER_PAGE = 20;

type SortField = "name" | "price" | "added" | "rarity";
type SortDir = "asc" | "desc";

const SORT_OPTIONS = [
  { value: "added", label: "Date Added" },
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
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

export default function MyCards() {
  const router = useRouter();
  const { favorites, removeFavorite, clearFavorites, isLoaded, count } =
    useFavorites();

  const [sortField, setSortField] = useState<SortField>("added");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Sort favorites
  const sortedFavorites = useMemo(() => {
    return [...favorites].sort((a, b) => {
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
        case "added":
          comparison = a.added_at - b.added_at;
          break;
        case "rarity":
          comparison =
            (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0);
          break;
      }

      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [favorites, sortField, sortDir]);

  // Paginate
  const displayedCards = useMemo(() => {
    const start = (currentPage - 1) * CARDS_PER_PAGE;
    const end = start + CARDS_PER_PAGE;
    return sortedFavorites.slice(start, end);
  }, [sortedFavorites, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(sortedFavorites.length / CARDS_PER_PAGE);
  }, [sortedFavorites]);

  const handleCardClick = useCallback(
    (cardId: string) => {
      router.push(`/card?id=${cardId}`);
    },
    [router],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent, cardId: string) => {
      e.stopPropagation();
      removeFavorite(cardId);
    },
    [removeFavorite],
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Calculate total value
  const totalValue = useMemo(() => {
    return favorites.reduce((sum, card) => {
      const price = card.prices.usd ? parseFloat(card.prices.usd) : 0;
      return sum + price;
    }, 0);
  }, [favorites]);

  if (!isLoaded) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="animate-pulse text-default-500">Loading...</div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 py-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">My Cards</h1>
        <p className="text-default-500">
          {count === 0
            ? "You haven't liked any cards yet"
            : `${count} card${count !== 1 ? "s" : ""} in your collection`}
        </p>
        {count > 0 && totalValue > 0 && (
          <p className="text-success font-semibold mt-1">
            Total Value: ${totalValue.toFixed(2)} USD
          </p>
        )}
      </div>

      {/* Empty State */}
      {count === 0 && (
        <Card className="max-w-md mx-auto">
          <CardBody className="text-center py-12">
            <p className="text-5xl mb-4">🃏</p>
            <p className="text-xl font-semibold mb-2">No cards yet</p>
            <p className="text-default-500 mb-6">
              Search for cards and tap the heart to add them here
            </p>
            <Button
              color="primary"
              variant="shadow"
              onPress={() => router.push("/search")}
            >
              Search Cards
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Cards */}
      {count > 0 && (
        <>
          {/* Sort & Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-default-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-default-500">Sort by:</span>
              <Select
                className="w-36"
                classNames={{
                  trigger: "h-9 min-h-9",
                }}
                selectedKeys={[sortField]}
                size="sm"
                variant="bordered"
                aria-label="Sort by"
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as SortField;
                  setSortField(value);
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
                    sortDir === "asc"
                      ? "bg-primary text-primary-foreground"
                      : "bg-default-100 text-default-600 hover:bg-default-200"
                  }`}
                  onClick={() => {
                    setSortDir("asc");
                    setCurrentPage(1);
                  }}
                >
                  Asc ↑
                </button>
                <button
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    sortDir === "desc"
                      ? "bg-primary text-primary-foreground"
                      : "bg-default-100 text-default-600 hover:bg-default-200"
                  }`}
                  onClick={() => {
                    setSortDir("desc");
                    setCurrentPage(1);
                  }}
                >
                  Desc ↓
                </button>
              </div>
            </div>

            {totalPages > 1 && (
              <Pagination
                color="primary"
                page={currentPage}
                showControls
                siblings={1}
                total={totalPages}
                onChange={handlePageChange}
              />
            )}
          </div>

          {/* Page Info */}
          <div className="text-center text-sm text-default-500">
            Showing {(currentPage - 1) * CARDS_PER_PAGE + 1} -{" "}
            {Math.min(currentPage * CARDS_PER_PAGE, sortedFavorites.length)} of{" "}
            {sortedFavorites.length}
          </div>

          {/* Card Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedCards.map((card) => (
              <Card
                key={card.id}
                isPressable
                className="bg-content1 hover:scale-105 transition-transform duration-200 relative group"
                onPress={() => handleCardClick(card.id)}
              >
                {/* Remove Button */}
                <button
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-danger text-white shadow-lg transition-transform hover:scale-110"
                  onClick={(e) => handleRemove(e, card.id)}
                >
                  ❤️
                </button>

                <CardBody className="p-0 overflow-hidden">
                  {card.image_uri ? (
                    <Image
                      alt={card.name}
                      className="w-full h-auto object-cover"
                      radius="none"
                      src={card.image_uri}
                    />
                  ) : (
                    <div className="w-full aspect-[488/680] bg-default-200 flex items-center justify-center">
                      <span className="text-default-500 text-xs text-center px-2">
                        No image
                      </span>
                    </div>
                  )}
                </CardBody>
                <CardFooter className="flex flex-col items-start gap-1 p-2 bg-content2">
                  <p className="text-xs font-semibold truncate w-full">
                    {card.name}
                  </p>
                  <div className="flex justify-between w-full items-center">
                    <Chip
                      className="text-[10px] h-5"
                      color={
                        card.rarity === "mythic"
                          ? "danger"
                          : card.rarity === "rare"
                            ? "warning"
                            : card.rarity === "uncommon"
                              ? "secondary"
                              : "default"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {card.rarity}
                    </Chip>
                    {card.prices.usd && (
                      <span className="text-[10px] text-success font-medium">
                        ${card.prices.usd}
                      </span>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                color="primary"
                page={currentPage}
                showControls
                siblings={1}
                total={totalPages}
                onChange={handlePageChange}
              />
            </div>
          )}

          {/* Clear All Button */}
          <div className="flex justify-center pt-4">
            <Button
              color="danger"
              variant="flat"
              onPress={() => {
                if (
                  window.confirm(
                    "Are you sure you want to remove all cards from your collection?",
                  )
                ) {
                  clearFavorites();
                }
              }}
            >
              Clear All Cards
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
