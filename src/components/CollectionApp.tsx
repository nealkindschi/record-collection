import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import type { Release } from "../utils/db";
import SearchBar from "./SearchBar";
import FilterPanel from "./FilterPanel";
import CollectionGrid from "./CollectionGrid";

const PAGE_SIZE = 24;

interface Props {
  initialResults?: Release[];
  initialTotal?: number;
}

export default function CollectionApp({ initialResults, initialTotal }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [format, setFormat] = useState("");
  const [genre, setGenre] = useState("");
  const [results, setResults] = useState<Release[]>(initialResults ?? []);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [formats, setFormats] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [years, setYears] = useState<{ min: number; max: number } | null>(null);
  const [year, setYear] = useState<number | "">("");
  const isInitialRender = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchResults = useCallback(async (offset = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (format) params.set("format", format);
      if (genre) params.set("genre", genre);
      if (year) params.set("year", String(year));
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      if (append) {
        setResults((prev) => [...prev, ...data.results]);
      } else {
        setResults(data.results);
      }
      setTotal(data.total);
    } catch {
      if (!append) {
        setResults([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedQuery, format, genre, year]);

  useEffect(() => {
    if (isInitialRender.current && initialResults) {
      isInitialRender.current = false;
      return;
    }
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await fetch("/api/filters");
        const data = await res.json();
        setFormats(data.formats ?? []);
        setGenres(data.genres ?? []);
        if (data.minYear && data.maxYear) {
          setYears({ min: data.minYear, max: data.maxYear });
        }
      } catch {
        // filters will remain empty
      }
    }
    loadFilters();
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncError("");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchResults();
      } else {
        setSyncError(data.error || "Sync failed");
      }
    } catch {
      setSyncError("Network error during sync");
    } finally {
      setSyncing(false);
    }
  }

  function handleLoadMore() {
    fetchResults(results.length, true);
  }

  const hasMore = results.length < total;

  return (
    <div class="flex flex-col md:flex-row gap-6">
      <aside class="w-full md:w-56 shrink-0 space-y-4">
        <button
          onClick={handleSync}
          disabled={syncing}
          class="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          {syncing ? "Syncing..." : "Sync Collection"}
        </button>
        <FilterPanel
          format={format}
          formats={formats}
          onFormatChange={setFormat}
          genre={genre}
          genres={genres}
          onGenreChange={setGenre}
          year={year}
          years={years}
          onYearChange={setYear}
        />
        {syncError && (
          <p class="text-xs text-red-400 mt-2">{syncError}</p>
        )}
      </aside>
      <main class="flex-1 min-w-0">
        <SearchBar query={query} onQueryChange={setQuery} />
        <CollectionGrid
          results={results}
          total={total}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      </main>
    </div>
  );
}
