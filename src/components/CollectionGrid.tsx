import type { Release } from "../utils/db";
import ReleaseCard from "./ReleaseCard";

interface Props {
  results: Release[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onCardClick: (release: Release) => void;
}

export default function CollectionGrid({
  results,
  total,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onCardClick,
}: Props) {
  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center py-24 gap-3">
        <div class="w-8 h-8 rounded-full border-2 border-sun-500/30 border-t-sun-500 animate-spin" />
        <p class="text-sm text-wax-500">Searching your collection...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-16 h-16 rounded-full bg-crate-800 border border-crate-600 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-wax-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <p class="text-wax-400 text-sm">No records found</p>
        <p class="text-wax-500 text-xs mt-1">Try adjusting your search or sync your collection</p>
      </div>
    );
  }

  function handleGridClick(e: Event) {
    const target = (e.target as HTMLElement).closest(
      "[data-release-id]"
    ) as HTMLElement | null;
    if (!target) return;
    const id = Number(target.dataset.releaseId);
    const release = results.find((r) => r.release_id === id);
    if (release) onCardClick(release);
  }

  return (
    <div>
      <div class="flex items-center justify-between mb-5">
        <p class="text-xs text-wax-500 font-body">
          <span class="text-wax-400 font-medium">{total}</span>{" "}
          {total === 1 ? "release" : "releases"}
          {results.length < total && (
            <> &middot; showing <span class="text-wax-400 font-medium">{results.length}</span></>
          )}
        </p>
        <div class="h-px flex-1 mx-4 bg-gradient-to-r from-crate-600 to-transparent" />
      </div>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
        onClick={handleGridClick}
      >
        {results.map((release, i) => (
          <div
            key={release.release_id}
            class="animate-card-in"
            style={{ animationDelay: `${(i % 24) * 35}ms` }}
          >
            <ReleaseCard release={release} />
          </div>
        ))}
      </div>
      {hasMore && (
        <div class="flex justify-center mt-10">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            class="group relative bg-crate-800 hover:bg-crate-700 disabled:opacity-30 disabled:cursor-not-allowed text-wax-300 text-sm font-medium rounded-xl px-8 py-3 transition-all duration-200 border border-crate-600 hover:border-sun-500/30 active:scale-[0.98] overflow-hidden"
          >
            <span class="relative z-10 flex items-center gap-2">
              {loadingMore ? (
                <>
                  <div class="w-4 h-4 rounded-full border-2 border-wax-500/30 border-t-wax-400 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
