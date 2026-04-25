import { useState, useEffect, useCallback } from "preact/hooks";
import type { Release } from "../utils/db";
import SearchBar from "./SearchBar";
import FilterPanel from "./FilterPanel";
import CollectionGrid from "./CollectionGrid";

export default function CollectionApp() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [format, setFormat] = useState("");
  const [results, setResults] = useState<Release[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [formats, setFormats] = useState<string[]>([]);
  const [years, setYears] = useState<{ min: number; max: number } | null>(null);
  const [year, setYear] = useState<number | "">("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (format) params.set("format", format);
      if (year) params.set("year", String(year));
      params.set("limit", "100");
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.results);
      setTotal(data.total);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, format, year]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await fetch("/api/filters");
        const data = await res.json();
        setFormats(data.formats ?? []);
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
        <CollectionGrid results={results} total={total} loading={loading} />
      </main>
    </div>
  );
}
