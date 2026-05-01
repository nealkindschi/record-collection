import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import type { Release } from "../utils/db";
import FilterPanel from "./FilterPanel";

const SEARCH_EVENT = "search:query";
import CollectionGrid from "./CollectionGrid";
import TracklistOverlay from "./TracklistOverlay";
import PrewarmBar from "./PrewarmBar";

const PAGE_SIZE = 24;

interface Props {
  initialResults?: Release[];
  initialTotal?: number;
}

export default function CollectionApp({ initialResults, initialTotal }: Props) {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [format, setFormat] = useState("");
  const [genre, setGenre] = useState("");
  const [results, setResults] = useState<Release[]>(initialResults ?? []);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [formats, setFormats] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [years, setYears] = useState<{ min: number; max: number } | null>(null);
  const [year, setYear] = useState<number | "">("");
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
          onFormatChange={setFormat}
          genre={genre}
          genres={genres}
          onGenreChange={setGenre}
          year={year}
          years={years}
          onYearChange={setYear}
        />
      </aside>
      <main class="flex-1 min-w-0 space-y-5">
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
