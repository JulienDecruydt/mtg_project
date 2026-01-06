"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Image } from "@heroui/image";
import { Divider } from "@heroui/divider";
import { ScryfallCard, ScryfallError } from "@/types/scryfall";
import { useFavorites } from "@/hooks/useFavorites";

function CardDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cardId = searchParams.get("id");

  const [card, setCard] = useState<ScryfallCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isFavorite, toggleFavorite, isLoaded } = useFavorites();

  useEffect(() => {
    async function fetchCard() {
      if (!cardId) {
        setError("No card ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.scryfall.com/cards/${cardId}`,
          { headers: { Accept: "application/json" } },
        );

        const data: ScryfallCard | ScryfallError = await response.json();

        if ("object" in data && data.object === "error") {
          setError((data as ScryfallError).details);
          setCard(null);
        } else {
          setCard(data as ScryfallCard);
        }
      } catch {
        setError("Failed to fetch card details.");
        setCard(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCard();
  }, [cardId]);

  const handleBack = useCallback(() => router.back(), [router]);

  const getCardImage = useCallback((c: ScryfallCard): string | null => {
    if (c.image_uris?.large) return c.image_uris.large;
    if (c.image_uris?.normal) return c.image_uris.normal;
    if (c.card_faces?.[0]?.image_uris?.large) return c.card_faces[0].image_uris.large;
    if (c.card_faces?.[0]?.image_uris?.normal) return c.card_faces[0].image_uris.normal;
    return null;
  }, []);

  const liked = card && isLoaded ? isFavorite(card.id) : false;

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
          {card && (
            <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-none">
              {card.name}
            </h1>
          )}
        </div>
      </div>

      <div className="pt-16 pb-24 px-4 sm:px-6">
        {loading && (
          <div className="flex justify-center py-20">
            <Spinner color="primary" label="Loading card..." size="lg" />
          </div>
        )}

        {error && !loading && (
          <Card className="bg-danger-50 border border-danger-200 max-w-md mx-auto mt-8">
            <CardBody className="text-center py-8">
              <p className="text-danger font-medium text-lg mb-4">⚠️ {error}</p>
              <Button color="primary" variant="flat" onPress={handleBack}>Go Back</Button>
            </CardBody>
          </Card>
        )}

        {card && !loading && !error && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-sm">
                  {getCardImage(card) ? (
                    <Image alt={card.name} className="w-full rounded-xl shadow-2xl" src={getCardImage(card)!} />
                  ) : (
                    <div className="w-full aspect-[488/680] bg-default-200 rounded-xl flex items-center justify-center">
                      <span className="text-default-500">No image available</span>
                    </div>
                  )}
                  {isLoaded && (
                    <button
                      className={`absolute top-3 right-3 w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-200 shadow-lg ${
                        liked ? "bg-danger text-white" : "bg-black/60 text-white hover:bg-black/80"
                      }`}
                      onClick={() => toggleFavorite(card)}
                    >
                      {liked ? "❤️" : "🤍"}
                    </button>
                  )}
                </div>
                {isLoaded && (
                  <Button
                    className="mt-6 w-full max-w-sm font-semibold"
                    color={liked ? "danger" : "default"}
                    size="lg"
                    startContent={<span className="text-xl">{liked ? "❤️" : "🤍"}</span>}
                    variant={liked ? "solid" : "bordered"}
                    onPress={() => toggleFavorite(card)}
                  >
                    {liked ? "Remove from My Cards" : "Add to My Cards"}
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{card.name}</h1>
                  <p className="text-lg text-default-600">{card.type_line}</p>
                </div>

                {card.mana_cost && (
                  <div className="flex items-center gap-2">
                    <span className="text-default-500">Mana Cost:</span>
                    <span className="font-mono text-lg">{card.mana_cost}</span>
                    <Chip size="sm" variant="flat">MV {card.cmc}</Chip>
                  </div>
                )}

                <Divider />

                {card.oracle_text && (
                  <div>
                    <h3 className="text-sm font-semibold text-default-500 mb-2">Card Text</h3>
                    <div className="bg-default-100 rounded-lg p-4">
                      <p className="whitespace-pre-wrap">{card.oracle_text}</p>
                    </div>
                  </div>
                )}

                {card.flavor_text && (
                  <div>
                    <h3 className="text-sm font-semibold text-default-500 mb-2">Flavor Text</h3>
                    <div className="bg-default-50 rounded-lg p-4 border border-default-200">
                      <p className="italic text-default-600">{card.flavor_text}</p>
                    </div>
                  </div>
                )}

                {(card.power || card.toughness || card.loyalty) && (
                  <div className="flex gap-4">
                    {card.power && card.toughness && (
                      <div className="bg-default-100 rounded-lg px-4 py-2">
                        <span className="text-default-500 text-sm">P/T: </span>
                        <span className="font-bold text-lg">{card.power}/{card.toughness}</span>
                      </div>
                    )}
                    {card.loyalty && (
                      <div className="bg-default-100 rounded-lg px-4 py-2">
                        <span className="text-default-500 text-sm">Loyalty: </span>
                        <span className="font-bold text-lg">{card.loyalty}</span>
                      </div>
                    )}
                  </div>
                )}

                <Divider />

                <div className="flex flex-wrap gap-3">
                  <Chip
                    color={card.rarity === "mythic" ? "danger" : card.rarity === "rare" ? "warning" : card.rarity === "uncommon" ? "secondary" : "default"}
                    size="lg"
                    variant="flat"
                  >
                    {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                  </Chip>
                  <Chip size="lg" variant="bordered">{card.set_name}</Chip>
                  <Chip size="lg" variant="flat">#{card.collector_number}</Chip>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-default-500 mb-2">Prices</h3>
                  <div className="flex flex-wrap gap-3">
                    {card.prices.usd && (
                      <div className="bg-success-50 border border-success-200 rounded-lg px-4 py-2">
                        <span className="text-success-700 font-semibold">${card.prices.usd} USD</span>
                      </div>
                    )}
                    {card.prices.usd_foil && (
                      <div className="bg-warning-50 border border-warning-200 rounded-lg px-4 py-2">
                        <span className="text-warning-700 font-semibold">${card.prices.usd_foil} Foil</span>
                      </div>
                    )}
                    {card.prices.eur && (
                      <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
                        <span className="text-primary-700 font-semibold">€{card.prices.eur} EUR</span>
                      </div>
                    )}
                    {!card.prices.usd && !card.prices.usd_foil && !card.prices.eur && (
                      <span className="text-default-400">No price data available</span>
                    )}
                  </div>
                </div>

                {card.artist && (
                  <div>
                    <h3 className="text-sm font-semibold text-default-500 mb-1">Artist</h3>
                    <p>{card.artist}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-default-500 mb-2">Format Legality</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(card.legalities)
                      .filter(([_, status]) => status === "legal")
                      .slice(0, 8)
                      .map(([format]) => (
                        <Chip key={format} className="capitalize" color="success" size="sm" variant="flat">
                          {format}
                        </Chip>
                      ))}
                    {Object.entries(card.legalities).filter(([_, status]) => status === "legal").length === 0 && (
                      <span className="text-default-400">Not legal in any format</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CardDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner color="primary" label="Loading..." size="lg" />
        </div>
      }
    >
      <CardDetailContent />
    </Suspense>
  );
}

