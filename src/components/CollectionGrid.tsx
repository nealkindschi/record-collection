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
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div class="text-center py-20">
        <p class="text-gray-400">
          No records found. Try adjusting your search or sync your collection.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p class="text-xs text-gray-500 mb-4">
        Showing {results.length} of {total} {total === 1 ? "release" : "releases"}
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {results.map((release) => (
          <ReleaseCard
            key={release.release_id}
            release={release}
            onClick={onCardClick}
          />
        ))}
      </div>
      {hasMore && (
        <div class="flex justify-center mt-8">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            class="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 text-sm font-medium rounded-lg px-6 py-2.5 transition-colors"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
