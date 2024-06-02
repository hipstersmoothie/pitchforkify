import React, { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import makeClass from "clsx";
import * as Slider from "@radix-ui/react-slider";
import { useMutation, useQuery } from "react-query";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import * as Collapsible from "@radix-ui/react-collapsible";
import { MixerVerticalIcon, CheckIcon } from "@radix-ui/react-icons";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useRouter } from "next/router";

import { CloseIcon } from "./icons/CloseIcon";

const FIRST_YEAR = 1999;
const CURRENT_YEAR = new Date().getFullYear();

const MIN_SCORE = 0;
const MAX_SCORE = 10;

const SettingTitle = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    className={makeClass(
      "text-sm uppercase font-semibold mb-6 setting-header",
      className
    )}
    {...props}
  />
);

interface RangeInputProps {
  min: number;
  max: number;
  step?: number;
  values: number[];
  onValueChange: (values: number[]) => void;
}

const RangeInput = ({
  values,
  onValueChange,
  min,
  max,
  step = 1,
}: RangeInputProps) => {
  const first = values[0] || min;
  const last = values[1] || max;

  return (
    <Slider.Root
      value={[first, last]}
      min={min}
      max={max}
      step={step}
      minStepsBetweenThumbs={0}
      onValueChange={onValueChange}
      className="relative cursor-pointer rounded flex items-center select-none w-full"
    >
      <Slider.Track className="bg-gray-300 h-2 w-full rounded">
        <Slider.Range className="bg-gray-500 h-2 absolute rounded" />
      </Slider.Track>
      <SliderThumb value={first} />
      <SliderThumb value={last} />
    </Slider.Root>
  );
};

const SliderThumb = ({ value }: { value: number }) => (
  <Slider.Thumb className="group relative block transition-opacity h-4 w-4 bg-white rounded-full border border-gray-300 shadow focus:outline-none keyboard-focus:shadow-focus">
    <div
      className="opacity-0 group-hover:opacity-100 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-white rounded border border-gray-300 px-2 py-1"
      style={{
        // @ts-ignore
        "--tw-translate-y": "calc(-1 * (100% + 4px))",
      }}
    >
      {value}
    </div>
  </Slider.Thumb>
);

interface CheckboxProps
  extends Pick<CheckboxPrimitive.CheckboxProps, "onCheckedChange" | "checked"> {
  value: string;
}

const Checkbox = ({ onCheckedChange, value, checked }: CheckboxProps) => {
  return (
    <div className="flex items-center gap-4">
      <CheckboxPrimitive.Root
        id={value}
        checked={checked}
        className="w-6 h-6 border rounded flex items-center justify-center focus:outline-none keyboard-focus:shadow-focus"
        onCheckedChange={onCheckedChange}
      >
        <CheckboxPrimitive.Indicator>
          <CheckIcon />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label htmlFor={value} className={makeClass(!checked && "text-gray-500")}>
        {value}
      </label>
    </div>
  );
};

interface SwitchProps
  extends Pick<
    SwitchPrimitive.SwitchProps,
    "onCheckedChange" | "checked" | "id"
  > {
  children: string;
}

const Switch = ({ checked, id, onCheckedChange, children }: SwitchProps) => {
  return (
    <div className="flex items-center gap-4">
      <SwitchPrimitive.Root
        id={id}
        className={makeClass(
          "w-11 h-7 rounded-full relative shadow focus:outline-none keyboard-focus:shadow-focus",
          checked ? "bg-pitchfork" : "bg-gray-200"
        )}
        checked={checked}
        onCheckedChange={onCheckedChange}
      >
        <SwitchPrimitive.Thumb
          className={makeClass(
            "w-6 h-6 rounded-full bg-white shadow-lg block transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          )}
        />
      </SwitchPrimitive.Root>
      <label htmlFor={id} className={makeClass(!checked && "text-gray-500")}>
        {children}
      </label>
    </div>
  );
};

interface GenrePickerProps {
  addGenre: (genre: string) => void;
  removeGenre: (genre: string) => void;
  active: string[];
}

const GenrePicker = ({ addGenre, removeGenre, active }: GenrePickerProps) => {
  const { data: genres = [] } = useQuery("genres", async () => {
    const res = await fetch("/genres.json");
    return res.json() as Promise<string[]>;
  });

  return (
    <div>
      <SettingTitle>Genre</SettingTitle>

      <div className="grid grid-cols-2 gap-2">
        {genres.map((genre) => (
          <Checkbox
            key={genre}
            value={genre}
            checked={active.includes(genre)}
            onCheckedChange={(checked) => {
              if (checked) {
                addGenre(genre);
              } else {
                removeGenre(genre);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface SearchResult {
  id: number;
  name: string;
  type: "artist" | "label";
}

interface SearchProps {
  addSearchFilter: (result: SearchResult) => void;
}

const Search = ({ addSearchFilter }: SearchProps) => {
  const [search, setSearch] = useState("");
  const { data: results = [], mutateAsync } = useMutation(
    "search",
    async (query: string) => {
      if (!query) {
        return [];
      }

      const res = await fetch(`/api/search?search=${query}`);
      return res.json() as Promise<SearchResult[]>;
    }
  );

  const debouncedSearch = useDebouncedCallback((query) => {
    mutateAsync(query);
  }, 500);

  return (
    <Combobox
      aria-label="Search"
      onSelect={(item) => {
        setSearch("");
        const newFilter = results.find((r) => r.name === item);

        if (newFilter) {
          addSearchFilter(newFilter);
        }
      }}
    >
      <div className="border-gray-300 text-2xl w-full border-b focus:outline-none relative">
        <ComboboxInput
          className="py-2 text-2xl focus:outline-none w-full"
          placeholder="Search Artists and Labels"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            debouncedSearch(e.target.value);
          }}
        />
        <span className="border-pitchfork border-b-[3px] absolute bottom-0 translate-y-[2px] left-0 text-transparent rounded h-0">
          {search}
        </span>
      </div>
      <ComboboxPopover
        className={makeClass("rounded-b w-full mt-2 !border-none")}
      >
        <ComboboxList
          className={makeClass(
            "max-h-96 overflow-auto",
            results.length && "border-gray-300 border"
          )}
        >
          {results.map((result) => (
            <ComboboxOption
              key={`${result.name}-${result.id}`}
              value={result.name}
              className="h-10 flex items-center"
            >
              {result.name}
            </ComboboxOption>
          ))}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  );
};

const FilterPill = ({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) => {
  return (
    <div className="relative">
      <button
        className={makeClass(
          "box-border px-4 py-1 border-2 border-gray-500 rounded-full group overflow-hidden uppercase text-sm font-semibold text-gray-600",
          className
        )}
        {...props}
      >
        {children}

        <div className="box-border rounded-full absolute inset-0 bg-gray-700 bg-opacity-20 opacity-0 group-hover:opacity-100">
          <CloseIcon className="absolute p-1 right-2 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 bg-opacity-80 hover:bg-gray-600 hover:text-white" />
        </div>
      </button>
    </div>
  );
};

export interface GridFilters {
  genre: string[];
  isBestNew: boolean;
  yearRange?: {
    start: number;
    end: number;
  };
  score?: {
    start: number;
    end: number;
  };
  search: SearchResult[];
}

export function useGridFilters() {
  const router = useRouter();
  const [filters, setFilters] = useState<GridFilters>({
    isBestNew: false,
    genre: [],
    search: [],
  });

  useEffect(() => {
    const query = new URLSearchParams(document.location.search);
    const genre = query.get("genre");

    setFilters({
      isBestNew: query.get("isBestNew") === "1",
      search: [],
      genre: genre ? decodeURIComponent(genre).split(",") : [],
      yearRange:
        query.get("yearStart") || query.get("yearEnd")
          ? {
              start: query.get("yearStart")
                ? Number(query.get("yearStart"))
                : FIRST_YEAR,
              end: query.get("yearEnd")
                ? Number(query.get("yearEnd"))
                : CURRENT_YEAR,
            }
          : undefined,
      score:
        query.get("scoreStart") || query.get("scoreEnd")
          ? {
              start: query.get("scoreStart")
                ? Number(query.get("scoreStart"))
                : FIRST_YEAR,
              end: query.get("scoreEnd")
                ? Number(query.get("scoreEnd"))
                : CURRENT_YEAR,
            }
          : undefined,
    });
  }, []);

  useEffect(() => {
    const start = new URLSearchParams(document.location.search);
    const query = new URLSearchParams(document.location.search);

    if (filters.isBestNew) {
      query.set("isBestNew", "1");
    } else {
      query.delete("isBestNew");
    }

    if (filters.genre?.length) {
      query.set("genre", encodeURIComponent(filters.genre.join(",")));
    } else {
      query.delete("genre");
    }

    if (filters.yearRange?.start) {
      query.set("yearStart", String(filters.yearRange.start));
    } else {
      query.delete("yearStart");
    }

    if (filters.yearRange?.end) {
      query.set("yearEnd", String(filters.yearRange.end));
    } else {
      query.delete("yearEnd");
    }

    if (filters.score?.start) {
      query.set("scoreStart", String(filters.score.start));
    } else {
      query.delete("scoreStart");
    }

    if (filters.score?.end) {
      query.set("scoreEnd", String(filters.score.end));
    } else {
      query.delete("scoreEnd");
    }

    if (start.toString() !== query.toString()) {
      router.replace(
        `${document.location.pathname}?${query.toString()}`,
        undefined,
        {
          shallow: true,
          scroll: false,
        }
      );
    } else {
      query.delete("isBestNew");
    }
  }, [filters, router]);

  return [filters, setFilters] as const;
}

export function hasActiveFilters(filters: GridFilters) {
  return (
    filters.genre.length > 0 ||
    filters.isBestNew ||
    filters.score ||
    filters.yearRange ||
    filters.search.length > 0
  );
}

interface GridFilterProps {
  filters: GridFilters;
  setFilters: (newFilters: GridFilters) => void;
}

export const GridFilter = ({ filters, setFilters }: GridFilterProps) => {
  const [open, openSet] = useState(false);

  const addGenre = useCallback(
    (filter) => {
      setFilters({
        ...filters,
        genre: [...filters.genre, filter],
      });
    },
    [filters, setFilters]
  );

  const removeGenre = useCallback(
    (genre: string) => {
      setFilters({
        ...filters,
        genre: filters.genre.filter((g) => g !== genre),
      });
    },
    [filters, setFilters]
  );

  const setYears = useCallback(
    ([start, end]) => {
      setFilters({
        ...filters,
        yearRange:
          start !== FIRST_YEAR || end !== CURRENT_YEAR
            ? {
                start,
                end,
              }
            : undefined,
      });
    },
    [filters, setFilters]
  );

  const setScores = useCallback(
    ([start, end]) => {
      setFilters({
        ...filters,
        score:
          start !== MIN_SCORE || end !== MAX_SCORE
            ? {
                start,
                end,
              }
            : undefined,
      });
    },
    [filters, setFilters]
  );

  const addSearchFilter = useCallback(
    (result: SearchResult) => {
      setFilters({
        ...filters,
        search: [...filters.search, result],
      });
    },
    [filters, setFilters]
  );

  return (
    <div className="mx-auto max-w-screen-2xl">
      <Collapsible.Root
        className="mt-5 sm:mt-8 border rounded-lg mx-2 sm:mx-8"
        open={open}
        onOpenChange={openSet}
      >
        <Collapsible.Trigger
          id="grid-filter"
          className="px-4 py-3 w-full flex justify-between items-center min-h-[60px] focus:outline-none keyboard-focus:shadow-focus rounded"
        >
          {hasActiveFilters(filters) ? (
            <div className="flex gap-2 items-center">
              <div className="font-medium text-sm uppercase pr-2">
                Active Filters:
              </div>

              {filters.search.map((match) => (
                <FilterPill
                  key={`${match.type}-${match.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilters({
                      ...filters,
                      search: filters.search.filter(
                        (i) => !(i.type === match.type && i.id === match.id)
                      ),
                    });
                  }}
                >
                  {match.name}
                </FilterPill>
              ))}
              {filters.genre.map((genre) => (
                <FilterPill
                  key={`pill-${genre}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeGenre(genre);
                  }}
                >
                  {genre}
                </FilterPill>
              ))}
              {filters.isBestNew && (
                <FilterPill
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilters({ ...filters, isBestNew: false });
                  }}
                >
                  Best New
                </FilterPill>
              )}
              {filters.yearRange && (
                <FilterPill
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilters({ ...filters, yearRange: undefined });
                  }}
                >
                  {filters.yearRange.start}
                  {" - "}
                  {filters.yearRange.end}
                </FilterPill>
              )}
              {filters.score && (
                <FilterPill
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilters({ ...filters, score: undefined });
                  }}
                >
                  {filters.score.start}
                  {" - "}
                  {filters.score.end}
                </FilterPill>
              )}
            </div>
          ) : (
            <div className="font-medium uppercase text-sm pr-2">
              Latest Releases
            </div>
          )}

          <div className="text-gray-800 flex items-center justify-center">
            {open ? (
              <CloseIcon />
            ) : (
              <MixerVerticalIcon height={20} width={20} />
            )}
          </div>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <div className="flex flex-col gap-10 border-t px-6 py-8">
            <div>
              <Search addSearchFilter={addSearchFilter} />
            </div>

            <div>
              <Switch
                id="best-new"
                checked={filters.isBestNew}
                onCheckedChange={() => {
                  setFilters({ ...filters, isBestNew: !filters.isBestNew });
                }}
              >
                Best New
              </Switch>
            </div>

            <GenrePicker
              addGenre={addGenre}
              removeGenre={removeGenre}
              active={filters.genre}
            />

            <div>
              <SettingTitle>Years</SettingTitle>
              <RangeInput
                values={[
                  filters.yearRange?.start ?? 0,
                  filters.yearRange?.end ?? 0,
                ]}
                min={FIRST_YEAR}
                max={CURRENT_YEAR}
                onValueChange={setYears}
              />
            </div>

            <div>
              <SettingTitle>Score</SettingTitle>
              <RangeInput
                values={[filters.score?.start ?? 0, filters.score?.end ?? 0]}
                min={MIN_SCORE}
                max={MAX_SCORE}
                onValueChange={setScores}
                step={0.1}
              />
            </div>
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
};
