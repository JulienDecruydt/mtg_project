"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox, CheckboxGroup } from "@heroui/checkbox";
import { Switch } from "@heroui/switch";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Divider } from "@heroui/divider";
import {
  SearchFormState,
  UniqueMode,
  SortOrder,
  SortDirection,
  COLORS,
  CARD_TYPES,
  RARITIES,
  FORMATS,
  UNIQUE_MODES,
  SORT_OPTIONS,
  SORT_DIRECTIONS,
  COMPARISON_OPERATORS,
} from "@/types/scryfall";

const initialFormState: SearchFormState = {
  query: "",
  unique: "cards",
  order: "name",
  dir: "auto",
  includeExtras: false,
  includeMultilingual: false,
  includeVariations: false,
  colors: [],
  colorIdentity: [],
  colorMode: "include",
  types: [],
  subtypes: "",
  oracleText: "",
  flavorText: "",
  manaValue: "",
  manaValueOp: "=",
  power: "",
  powerOp: "=",
  toughness: "",
  toughnessOp: "=",
  loyalty: "",
  loyaltyOp: "=",
  rarities: [],
  sets: "",
  formats: [],
  legalIn: "",
  priceUsd: "",
  priceUsdOp: "<=",
  priceCurrency: "usd",
  artist: "",
  year: "",
  yearOp: "=",
  isFullArt: false,
  isPromo: false,
  isReprint: false,
};

export default function Search() {
  const router = useRouter();
  const [formState, setFormState] = useState<SearchFormState>(initialFormState);
  const [generatedQuery, setGeneratedQuery] = useState("");

  const updateForm = useCallback(
    <K extends keyof SearchFormState>(key: K, value: SearchFormState[K]) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Build the search query string from form state
  const buildQuery = useCallback((): string => {
    const parts: string[] = [];

    // Main text query
    if (formState.query) {
      parts.push(formState.query);
    }

    // Colors
    if (formState.colors.length > 0) {
      const colorStr = formState.colors.join("");
      switch (formState.colorMode) {
        case "exact":
          parts.push(`c=${colorStr}`);
          break;
        case "include":
          parts.push(`c:${colorStr}`);
          break;
        case "atMost":
          parts.push(`c<=${colorStr}`);
          break;
        case "morethan":
          parts.push(`c>=${colorStr}`);
          break;
      }
    }

    // Color Identity
    if (formState.colorIdentity.length > 0) {
      parts.push(`id:${formState.colorIdentity.join("")}`);
    }

    // Card Types
    formState.types.forEach((type) => {
      parts.push(`t:${type.toLowerCase()}`);
    });

    // Subtypes
    if (formState.subtypes) {
      formState.subtypes.split(",").forEach((subtype) => {
        const trimmed = subtype.trim();
        if (trimmed) parts.push(`t:${trimmed}`);
      });
    }

    // Oracle Text
    if (formState.oracleText) {
      parts.push(`o:"${formState.oracleText}"`);
    }

    // Flavor Text
    if (formState.flavorText) {
      parts.push(`ft:"${formState.flavorText}"`);
    }

    // Mana Value
    if (formState.manaValue) {
      parts.push(`mv${formState.manaValueOp}${formState.manaValue}`);
    }

    // Power
    if (formState.power) {
      parts.push(`pow${formState.powerOp}${formState.power}`);
    }

    // Toughness
    if (formState.toughness) {
      parts.push(`tou${formState.toughnessOp}${formState.toughness}`);
    }

    // Loyalty
    if (formState.loyalty) {
      parts.push(`loy${formState.loyaltyOp}${formState.loyalty}`);
    }

    // Rarities
    if (formState.rarities.length > 0) {
      if (formState.rarities.length === 1) {
        parts.push(`r:${formState.rarities[0]}`);
      } else {
        const rarityPart = formState.rarities.map((r) => `r:${r}`).join(" OR ");
        parts.push(`(${rarityPart})`);
      }
    }

    // Sets
    if (formState.sets) {
      formState.sets.split(",").forEach((set) => {
        const trimmed = set.trim();
        if (trimmed) parts.push(`e:${trimmed}`);
      });
    }

    // Format Legality
    formState.formats.forEach((format) => {
      parts.push(`f:${format}`);
    });

    if (formState.legalIn) {
      parts.push(`legal:${formState.legalIn}`);
    }

    // Price
    if (formState.priceUsd) {
      parts.push(
        `${formState.priceCurrency}${formState.priceUsdOp}${formState.priceUsd}`,
      );
    }

    // Artist
    if (formState.artist) {
      parts.push(`a:"${formState.artist}"`);
    }

    // Year
    if (formState.year) {
      parts.push(`year${formState.yearOp}${formState.year}`);
    }

    // Boolean flags
    if (formState.isFullArt) {
      parts.push("is:full");
    }
    if (formState.isPromo) {
      parts.push("is:promo");
    }
    if (formState.isReprint) {
      parts.push("is:reprint");
    }

    return parts.join(" ");
  }, [formState]);

  // Perform the search - redirect to results page
  const handleSearch = useCallback(() => {
    const query = buildQuery();
    if (!query.trim()) {
      return;
    }

    setGeneratedQuery(query);

    // Build URL params
    const params = new URLSearchParams({
      q: query,
      unique: formState.unique,
      order: formState.order,
      dir: formState.dir,
    });

    if (formState.includeExtras) {
      params.append("include_extras", "true");
    }
    if (formState.includeMultilingual) {
      params.append("include_multilingual", "true");
    }
    if (formState.includeVariations) {
      params.append("include_variations", "true");
    }

    // Navigate to results page
    router.push(`/search/results?${params.toString()}`);
  }, [buildQuery, formState, router]);

  const handleReset = useCallback(() => {
    setFormState(initialFormState);
    setGeneratedQuery("");
  }, []);

  // Preview query on change
  const previewQuery = buildQuery();

  return (
    <section className="flex flex-col gap-8 py-6 relative z-10">
      {/* Main Search Card */}
      <Card className="bg-content1/80 backdrop-blur-md border border-default-100 shadow-xl">
        <CardHeader className="flex-col items-start gap-2 px-6 pt-6 pb-2">
          <h2 className="text-xl font-semibold">Quick Search</h2>
          <p className="text-sm text-default-500">
            Enter a card name
          </p>
        </CardHeader>
        <CardBody className="gap-5 px-6 pb-6">
          <Input
            classNames={{
              label: "text-default-600",
              input: "text-lg",
              inputWrapper:
                "bg-default-100/50 hover:bg-default-100 transition-colors",
            }}
            label="Search Query"
            placeholder='"Lightning Bolt" or "Wurmcoil Engine"'
            size="lg"
            value={formState.query}
            variant="flat"
            onValueChange={(v) => updateForm("query", v)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

          <Divider className="my-1" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              classNames={{
                trigger: "bg-default-100/50 hover:bg-default-100",
              }}
              label="Unique Mode"
              selectedKeys={[formState.unique]}
              size="sm"
              variant="flat"
              onSelectionChange={(keys) =>
                updateForm("unique", Array.from(keys)[0] as UniqueMode)
              }
            >
              {UNIQUE_MODES.map((mode) => (
                <SelectItem key={mode.value}>{mode.label}</SelectItem>
              ))}
            </Select>

            <Select
              classNames={{
                trigger: "bg-default-100/50 hover:bg-default-100",
              }}
              label="Sort By"
              selectedKeys={[formState.order]}
              size="sm"
              variant="flat"
              onSelectionChange={(keys) =>
                updateForm("order", Array.from(keys)[0] as SortOrder)
              }
            >
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>

            <Select
              classNames={{
                trigger: "bg-default-100/50 hover:bg-default-100",
              }}
              label="Direction"
              selectedKeys={[formState.dir]}
              size="sm"
              variant="flat"
              onSelectionChange={(keys) =>
                updateForm("dir", Array.from(keys)[0] as SortDirection)
              }
            >
              {SORT_DIRECTIONS.map((opt) => (
                <SelectItem key={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 py-2">
            <Switch
              classNames={{
                label: "text-sm",
              }}
              isSelected={formState.includeExtras}
              size="sm"
              onValueChange={(v) => updateForm("includeExtras", v)}
            >
              Include Extras
            </Switch>
            <Switch
              classNames={{
                label: "text-sm",
              }}
              isSelected={formState.includeMultilingual}
              size="sm"
              onValueChange={(v) => updateForm("includeMultilingual", v)}
            >
              All Languages
            </Switch>
            <Switch
              classNames={{
                label: "text-sm",
              }}
              isSelected={formState.includeVariations}
              size="sm"
              onValueChange={(v) => updateForm("includeVariations", v)}
            >
              Variations
            </Switch>
          </div>
        </CardBody>
      </Card>

      {/* Advanced Filters */}
      <Card className="bg-content1/60 backdrop-blur-md border border-default-100 shadow-lg overflow-visible">
        <CardHeader className="px-6 pt-5 pb-0">
          <h2 className="text-xl font-semibold">Advanced Filters</h2>
        </CardHeader>
        <CardBody className="px-3 py-4">
          <Accordion
            className="px-0 gap-3"
            itemClasses={{
              base: "py-0 w-full",
              title: "font-medium text-base",
              trigger:
                "px-4 py-3 rounded-xl data-[hover=true]:bg-default-100/50 transition-colors",
              indicator: "text-default-400",
              content: "px-4 pb-4 pt-2",
            }}
            selectionMode="multiple"
            variant="light"
          >
            {/* Colors Section */}
            <AccordionItem
              key="colors"
              aria-label="Colors"
              subtitle="Card colors and commander identity"
              title={
                <span className="flex items-center gap-2">
                  <span className="text-lg">🎨</span> Colors & Identity
                </span>
              }
            >
              <div className="flex flex-col gap-6">
                <div className="bg-default-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-default-700 mb-3">
                    Card Colors
                  </p>
                  <div className="flex flex-wrap gap-4 items-center">
                    <CheckboxGroup
                      classNames={{
                        wrapper: "gap-3",
                      }}
                      orientation="horizontal"
                      value={formState.colors}
                      onValueChange={(v) => updateForm("colors", v)}
                    >
                      {COLORS.map((color) => (
                        <Checkbox
                          key={color.value}
                          classNames={{
                            label: "text-sm",
                          }}
                          value={color.value}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-base">{color.symbol}</span>
                            <span>{color.label}</span>
                          </span>
                        </Checkbox>
                      ))}
                    </CheckboxGroup>
                  </div>
                  <div className="mt-4">
                    <Select
                      className="max-w-[220px]"
                      classNames={{
                        trigger: "bg-default-100/80",
                      }}
                      label="Color Match Mode"
                      selectedKeys={[formState.colorMode]}
                      size="sm"
                      variant="flat"
                      onSelectionChange={(keys) =>
                        updateForm(
                          "colorMode",
                          Array.from(keys)[0] as SearchFormState["colorMode"],
                        )
                      }
                    >
                      <SelectItem key="include">Includes these</SelectItem>
                      <SelectItem key="exact">Exactly these</SelectItem>
                      <SelectItem key="atMost">At most these</SelectItem>
                      <SelectItem key="morethan">At least these</SelectItem>
                    </Select>
                  </div>
                </div>

                <div className="bg-default-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-default-700 mb-3">
                    Color Identity (Commander)
                  </p>
                  <CheckboxGroup
                    classNames={{
                      wrapper: "gap-3",
                    }}
                    orientation="horizontal"
                    value={formState.colorIdentity}
                    onValueChange={(v) => updateForm("colorIdentity", v)}
                  >
                    {COLORS.map((color) => (
                      <Checkbox
                        key={color.value}
                        classNames={{
                          label: "text-sm",
                        }}
                        value={color.value}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-base">{color.symbol}</span>
                          <span>{color.label}</span>
                        </span>
                      </Checkbox>
                    ))}
                  </CheckboxGroup>
                </div>
              </div>
            </AccordionItem>

            {/* Card Types Section */}
            <AccordionItem
              key="types"
              aria-label="Card Types"
              subtitle="Filter by type and subtype"
              title={
                <span className="flex items-center gap-2">
                  <span className="text-lg">📜</span> Card Types
                </span>
              }
            >
              <div className="flex flex-col gap-5">
                <div className="bg-default-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-default-700 mb-3">
                    Card Types
                  </p>
                  <CheckboxGroup
                    classNames={{
                      wrapper: "gap-3",
                    }}
                    orientation="horizontal"
                    value={formState.types}
                    onValueChange={(v) => updateForm("types", v)}
                  >
                    {CARD_TYPES.map((type) => (
                      <Checkbox
                        key={type}
                        classNames={{
                          label: "text-sm",
                        }}
                        value={type}
                      >
                        {type}
                      </Checkbox>
                    ))}
                  </CheckboxGroup>
                </div>

                <Input
                  classNames={{
                    inputWrapper: "bg-default-100/50",
                  }}
                  description="Comma-separated (e.g., Dragon, Wizard, Aura)"
                  label="Subtypes"
                  placeholder="Dragon, Wizard, Elf..."
                  value={formState.subtypes}
                  variant="flat"
                  onValueChange={(v) => updateForm("subtypes", v)}
                />
              </div>
            </AccordionItem>

            {/* Text Search Section */}
            <AccordionItem
              key="text"
              aria-label="Text Search"
              subtitle="Rules text and flavor"
              title={
                <span className="flex items-center gap-2">
                  <span className="text-lg">📝</span> Text Search
                </span>
              }
            >
              <div className="flex flex-col gap-4">
                <Input
                  classNames={{
                    inputWrapper: "bg-default-100/50",
                  }}
                  description="Search card rules text"
                  label="Text Contains"
                  placeholder='Example: "draw a card", "destroy target", "fly", etc.'
                  value={formState.oracleText}
                  variant="flat"
                  onValueChange={(v) => updateForm("oracleText", v)}
                />
                <Input
                  classNames={{
                    inputWrapper: "bg-default-100/50",
                  }}
                  description="Search flavor text"
                  label="Flavor Text Contains"
                  placeholder="Example: Jace, Chandra, etc."
                  value={formState.flavorText}
                  variant="flat"
                  onValueChange={(v) => updateForm("flavorText", v)}
                />
              </div>
            </AccordionItem>

            {/* Stats Section */}
            <AccordionItem
              key="stats"
              aria-label="Stats"
              subtitle="Mana value, power, toughness"
              title={
                <span className="flex items-center gap-2">
                  <span className="text-lg">⚔️</span> Stats
                </span>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2 items-end bg-default-50 rounded-xl p-3">
                  <Select
                    className="w-20 shrink-0"
                    classNames={{ trigger: "bg-default-100/80" }}
                    label="Op"
                    selectedKeys={[formState.manaValueOp]}
                    size="sm"
                    variant="flat"
                    onSelectionChange={(keys) =>
                      updateForm(
                        "manaValueOp",
                        Array.from(keys)[0] as SearchFormState["manaValueOp"],
                      )
                    }
                  >
                    {COMPARISON_OPERATORS.map((op) => (
                      <SelectItem key={op.value}>{op.label}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    className="flex-1"
                    classNames={{ inputWrapper: "bg-default-100/80" }}
                    label="Mana Value"
                    placeholder="3"
                    type="number"
                    value={formState.manaValue}
                    variant="flat"
                    onValueChange={(v) => updateForm("manaValue", v)}
                  />
                </div>

                <div className="flex gap-2 items-end bg-default-50 rounded-xl p-3">
                  <Select
                    className="w-20 shrink-0"
                    classNames={{ trigger: "bg-default-100/80" }}
                    label="Op"
                    selectedKeys={[formState.powerOp]}
                    size="sm"
                    variant="flat"
                    onSelectionChange={(keys) =>
                      updateForm(
                        "powerOp",
                        Array.from(keys)[0] as SearchFormState["powerOp"],
                      )
                    }
                  >
                    {COMPARISON_OPERATORS.map((op) => (
                      <SelectItem key={op.value}>{op.label}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    className="flex-1"
                    classNames={{ inputWrapper: "bg-default-100/80" }}
                    label="Power"
                    placeholder="4"
                    value={formState.power}
                    variant="flat"
                    onValueChange={(v) => updateForm("power", v)}
                  />
                </div>

                <div className="flex gap-2 items-end bg-default-50 rounded-xl p-3">
                  <Select
                    className="w-20 shrink-0"
                    classNames={{ trigger: "bg-default-100/80" }}
                    label="Op"
                    selectedKeys={[formState.toughnessOp]}
                    size="sm"
                    variant="flat"
                    onSelectionChange={(keys) =>
                      updateForm(
                        "toughnessOp",
                        Array.from(keys)[0] as SearchFormState["toughnessOp"],
                      )
                    }
                  >
                    {COMPARISON_OPERATORS.map((op) => (
                      <SelectItem key={op.value}>{op.label}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    className="flex-1"
                    classNames={{ inputWrapper: "bg-default-100/80" }}
                    label="Toughness"
                    placeholder="4"
                    value={formState.toughness}
                    variant="flat"
                    onValueChange={(v) => updateForm("toughness", v)}
                  />
                </div>

                <div className="flex gap-2 items-end bg-default-50 rounded-xl p-3">
                  <Select
                    className="w-20 shrink-0"
                    classNames={{ trigger: "bg-default-100/80" }}
                    label="Op"
                    selectedKeys={[formState.loyaltyOp]}
                    size="sm"
                    variant="flat"
                    onSelectionChange={(keys) =>
                      updateForm(
                        "loyaltyOp",
                        Array.from(keys)[0] as SearchFormState["loyaltyOp"],
                      )
                    }
                  >
                    {COMPARISON_OPERATORS.map((op) => (
                      <SelectItem key={op.value}>{op.label}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    className="flex-1"
                    classNames={{ inputWrapper: "bg-default-100/80" }}
                    label="Loyalty"
                    placeholder="3"
                    type="number"
                    value={formState.loyalty}
                    variant="flat"
                    onValueChange={(v) => updateForm("loyalty", v)}
                  />
                </div>
              </div>
            </AccordionItem>

            {/* Rarity Section */}
            <AccordionItem
              key="rarity"
              aria-label="Rarity"
              subtitle="Common to Mythic"
              title={
                <span className="flex items-center gap-2">
                  <span className="text-lg">💎</span> Rarity
                </span>
              }
            >
              <div className="bg-default-50 rounded-xl p-4">
                <CheckboxGroup
                  classNames={{
                    wrapper: "gap-3",
                  }}
                  orientation="horizontal"
                  value={formState.rarities}
                  onValueChange={(v) => updateForm("rarities", v)}
                >
                  {RARITIES.map((rarity) => (
                    <Checkbox
                      key={rarity.value}
                      classNames={{
                        label: "text-sm",
                      }}
                      value={rarity.value}
                    >
                      {rarity.label}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </div>
            </AccordionItem>

            {/* Sets & Formats Section */}
            <AccordionItem
              key="sets"
              aria-label="Sets & Formats"
              subtitle="Expansion and legality"
              title={
                <span className="flex items-center gap-2">
                  <span className="text-lg">🃏</span> Sets & Formats
                </span>
              }
            >
              <div className="flex flex-col gap-5">
                <Input
                  classNames={{
                    inputWrapper: "bg-default-100/50",
                  }}
                  description="Comma-separated set codes (e.g., MH3, ONE, DMU)"
                  label="Sets"
                  placeholder="MH3, ONE, DMU..."
                  value={formState.sets}
                  variant="flat"
                  onValueChange={(v) => updateForm("sets", v)}
                />

                <div className="bg-default-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-default-700 mb-3">
                    Legal in Format
                  </p>
                  <CheckboxGroup
                    classNames={{
                      wrapper: "gap-x-4 gap-y-2",
                    }}
                    orientation="horizontal"
                    value={formState.formats}
                    onValueChange={(v) => updateForm("formats", v)}
                  >
                    {FORMATS.map((format) => (
                      <Checkbox
                        key={format.value}
                        classNames={{
                          label: "text-sm",
                        }}
                        value={format.value}
                      >
                        {format.label}
                      </Checkbox>
                    ))}
                  </CheckboxGroup>
                </div>

                <Input
                  classNames={{
                    inputWrapper: "bg-default-100/50",
                  }}
                  description="Single format for strict check"
                  label="Strictly Legal In"
                  placeholder="Example: Commander, Modern, etc."
                  value={formState.legalIn}
                  variant="flat"
                  onValueChange={(v) => updateForm("legalIn", v)}
                />
              </div>
            </AccordionItem>

            {/* Price Section */}
            <AccordionItem
              key="price"
              aria-label="Price"
              subtitle="Filter by card price"
              title={
                <span className="flex items-center gap-2">
                  <span className="text-lg">💰</span> Price
                </span>
              }
            >
              <div className="flex flex-wrap gap-3 items-end bg-default-50 rounded-xl p-4">
                <Select
                  className="w-24"
                  classNames={{ trigger: "bg-default-100/80" }}
                  label="Currency"
                  selectedKeys={[formState.priceCurrency]}
                  size="sm"
                  variant="flat"
                  onSelectionChange={(keys) =>
                    updateForm(
                      "priceCurrency",
                      Array.from(keys)[0] as SearchFormState["priceCurrency"],
                    )
                  }
                >
                  <SelectItem key="usd">USD</SelectItem>
                  <SelectItem key="eur">EUR</SelectItem>
                  <SelectItem key="tix">TIX</SelectItem>
                </Select>

                <Select
                  className="w-20"
                  classNames={{ trigger: "bg-default-100/80" }}
                  label="Op"
                  selectedKeys={[formState.priceUsdOp]}
                  size="sm"
                  variant="flat"
                  onSelectionChange={(keys) =>
                    updateForm(
                      "priceUsdOp",
                      Array.from(keys)[0] as SearchFormState["priceUsdOp"],
                    )
                  }
                >
                  {COMPARISON_OPERATORS.map((op) => (
                    <SelectItem key={op.value}>{op.label}</SelectItem>
                  ))}
                </Select>

                <Input
                  className="w-32"
                  classNames={{ inputWrapper: "bg-default-100/80" }}
                  label="Price"
                  placeholder="10.00"
                  type="number"
                  value={formState.priceUsd}
                  variant="flat"
                  onValueChange={(v) => updateForm("priceUsd", v)}
                />
              </div>
            </AccordionItem>

            {/* Misc Section */}
            <AccordionItem
              key="misc"
              aria-label="Miscellaneous"
              subtitle="Artist, year, and more"
              title={
                <span className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span> Miscellaneous
                </span>
              }
            >
              <div className="flex flex-col gap-5">
                <Input
                  classNames={{
                    inputWrapper: "bg-default-100/50",
                  }}
                  label="Artist Name"
                  placeholder="Example: John Avo, Simon Bisley, etc."
                  value={formState.artist}
                  variant="flat"
                  onValueChange={(v) => updateForm("artist", v)}
                />

                <div className="flex gap-3 items-end bg-default-50 rounded-xl p-4">
                  <Select
                    className="w-20 shrink-0"
                    classNames={{ trigger: "bg-default-100/80" }}
                    label="Op"
                    selectedKeys={[formState.yearOp]}
                    size="sm"
                    variant="flat"
                    onSelectionChange={(keys) =>
                      updateForm(
                        "yearOp",
                        Array.from(keys)[0] as SearchFormState["yearOp"],
                      )
                    }
                  >
                    {COMPARISON_OPERATORS.map((op) => (
                      <SelectItem key={op.value}>{op.label}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    className="w-32"
                    classNames={{ inputWrapper: "bg-default-100/80" }}
                    label="Year"
                    placeholder="2024"
                    type="number"
                    value={formState.year}
                    variant="flat"
                    onValueChange={(v) => updateForm("year", v)}
                  />
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-3 bg-default-50 rounded-xl p-4">
                  <Switch
                    classNames={{ label: "text-sm" }}
                    isSelected={formState.isFullArt}
                    size="sm"
                    onValueChange={(v) => updateForm("isFullArt", v)}
                  >
                    Full Art Only
                  </Switch>
                  <Switch
                    classNames={{ label: "text-sm" }}
                    isSelected={formState.isPromo}
                    size="sm"
                    onValueChange={(v) => updateForm("isPromo", v)}
                  >
                    Promo Cards
                  </Switch>
                  <Switch
                    classNames={{ label: "text-sm" }}
                    isSelected={formState.isReprint}
                    size="sm"
                    onValueChange={(v) => updateForm("isReprint", v)}
                  >
                    Reprints Only
                  </Switch>
                </div>
              </div>
            </AccordionItem>
          </Accordion>
        </CardBody>
      </Card>

      {/* Query Preview */}
      {previewQuery && (
        <Card className="bg-default-50 border border-default-200">
          <CardBody className="py-3 px-4">
            <p className="text-xs text-default-500 mb-1 font-medium uppercase tracking-wide">
              Query Preview
            </p>
            <code className="text-sm bg-default-100 px-3 py-2 rounded-lg block overflow-x-auto font-mono">
              {previewQuery}
            </code>
          </CardBody>
        </Card>
      )}

      {/* Action Buttons - Fixed at bottom */}
      <div className="sticky bottom-4 z-20">
        <Card className="bg-content1/95 backdrop-blur-lg border border-default-200 shadow-2xl">
          <CardBody className="py-4 px-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                className="min-w-[200px] font-semibold text-base"
                color="primary"
                isDisabled={!previewQuery}
                size="lg"
                variant="shadow"
                onPress={handleSearch}
              >
                🔍 Search Cards
              </Button>
              <Button
                className="min-w-[140px] font-medium"
                color="default"
                size="lg"
                variant="bordered"
                onPress={handleReset}
              >
                Reset All
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
