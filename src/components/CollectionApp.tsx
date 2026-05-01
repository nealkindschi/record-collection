import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import type { Release } from "../utils/db";
import FilterPanel from "./FilterPanel";
import CollectionGrid from "./CollectionGrid";
import TracklistOverlay from "./TracklistOverlay";
import PrewarmBar from "./PrewarmBar";

const SEARCH_EVENT = "search:query";

const PER_PAGE_OPTIONS = [25, 50, 100, 250];

interface Props {
  initialResults?: Release[];
  initialTotal?: number;
}

export default function CollectionApp({ initialResults, initialTotal }: Props) {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [format, setFormat] = useState("");
  const [vinylSize, setVinylSize] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("artist");
  const [perPage, setPerPage] = useState(25);
  const [results, setResults] = useState<Release[]>(initialResults ?? []);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [formats, setFormats] = useState<string[]>([]);
  const [vinylSizes, setVinylSizes] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [prewarmReady, setPrewarmReady] = useState(false);
  const isInitialRender = useRef(true);

  useEffect(() => {
    function handleSearch(e: CustomEvent) {
      setDebouncedQuery(e.detail);
    }
    window.addEventListener(SEARCH_EVENT, handleSearch as EventListener);
    return () => window.removeEventListener(SEARCH_EVENT, handleSearch as EventListener);
  }, []);

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
      if (vinylSize) params.set("vinyl_size", vinylSize);
      if (genre) params.set("genre", genre);
      if (sort) params.set("sort", sort);
      params.set("limit", String(perPage));
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
  }, [debouncedQuery, format, vinylSize, genre, sort, perPage]);

  useEffect(() => {
    if (isInitialRender.current && initialResults) {
      isInitialRender.current = false;
      setPrewarmReady(true);
      return;
    }
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    if (!loading && results.length > 0) setPrewarmReady(true);
  }, [loading, results.length]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await fetch("/api/filters");
        const data = await res.json();
        setFormats(data.formats ?? []);
        setVinylSizes(data.vinyl_sizes ?? []);
        setGenres(data.genres ?? []);
      } catch {
        // filters will remain empty
      }
    }
    loadFilters();
  }, []);

  function handleLoadMore() {
    fetchResults(results.length, true);
  }

  const hasMore = results.length < total;

  return (
    <div class="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <aside class="w-full lg:w-56 shrink-0 space-y-4">
        <FilterPanel
          format={format}
          formats={formats}
          onFormatChange={(f) => { setFormat(f); setVinylSize(""); }}
          vinylSize={vinylSize}
          vinylSizes={vinylSizes}
          onVinylSizeChange={setVinylSize}
          genre={genre}
          genres={genres}
          onGenreChange={setGenre}
        />
      </aside>
      <main class="flex-1 min-w-0 space-y-5">
        <div class="flex items-center justify-end gap-3">
          <label class="text-xs text-wax-500 font-medium tracking-wide uppercase">Show</label>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number((e.target as HTMLSelectElement).value))}
            class="bg-crate-800 border border-sun-500/25 hover:border-sun-500/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sun-400 focus:ring-2 focus:ring-sun-400/25 transition-all duration-200 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff6d00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              paddingRight: "32px",
            }}
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <label class="text-xs text-wax-500 font-medium tracking-wide uppercase">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort((e.target as HTMLSelectElement).value)}
            class="bg-crate-800 border border-sun-500/25 hover:border-sun-500/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sun-400 focus:ring-2 focus:ring-sun-400/25 transition-all duration-200 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff6d00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              paddingRight: "32px",
            }}
          >
            <option value="artist">Artist (A-Z)</option>
            <option value="title">Title (A-Z)</option>
            <option value="year_desc">Year (Newest)</option>
            <option value="year_asc">Year (Oldest)</option>
          </select>
        </div>
        <CollectionGrid
          results={results}
          total={total}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onCardClick={setSelectedRelease}
        />
      </main>
      {selectedRelease && (
        <TracklistOverlay
          release={selectedRelease}
          onClose={() => setSelectedRelease(null)}
        />
      )}
      <PrewarmBar active={prewarmReady} />
    </div>
  );
}
