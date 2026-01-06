"use client";

import { useState, useEffect, useCallback } from "react";
import { ScryfallCard } from "@/types/scryfall";

const STORAGE_KEY = "mtg_favorites";

export interface FavoriteCard {
  id: string;
  name: string;
  image_uri: string | null;
  type_line: string;
  mana_cost?: string;
  rarity: string;
  prices: {
    usd?: string | null;
  };
  set_name: string;
  scryfall_uri: string;
  added_at: number;
}

// Get image from card
function getCardImage(card: ScryfallCard): string | null {
  if (card.image_uris?.normal) {
    return card.image_uris.normal;
  }
  if (card.card_faces?.[0]?.image_uris?.normal) {
    return card.card_faces[0].image_uris.normal;
  }
  return null;
}

// Convert ScryfallCard to FavoriteCard (minimal data for storage)
export function cardToFavorite(card: ScryfallCard): FavoriteCard {
  return {
    id: card.id,
    name: card.name,
    image_uri: getCardImage(card),
    type_line: card.type_line,
    mana_cost: card.mana_cost,
    rarity: card.rarity,
    prices: {
      usd: card.prices.usd,
    },
    set_name: card.set_name,
    scryfall_uri: card.scryfall_uri,
    added_at: Date.now(),
  };
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteCard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
      setFavorites([]);
    }
    setIsLoaded(true);
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error("Failed to save favorites:", error);
      }
    }
  }, [favorites, isLoaded]);

  // Check if a card is favorited
  const isFavorite = useCallback(
    (cardId: string): boolean => {
      return favorites.some((f) => f.id === cardId);
    },
    [favorites],
  );

  // Add a card to favorites
  const addFavorite = useCallback((card: ScryfallCard) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === card.id)) {
        return prev; // Already exists
      }
      return [cardToFavorite(card), ...prev];
    });
  }, []);

  // Remove a card from favorites
  const removeFavorite = useCallback((cardId: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== cardId));
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(
    (card: ScryfallCard) => {
      if (isFavorite(card.id)) {
        removeFavorite(card.id);
      } else {
        addFavorite(card);
      }
    },
    [isFavorite, addFavorite, removeFavorite],
  );

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    isLoaded,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    count: favorites.length,
  };
}

