import type { Release } from "../utils/db";
import ReleaseCard from "./ReleaseCard";

interface Props {
  results: Release[];
  total: number;
  loading: boolean;
}

export default function CollectionGrid({ results, total, loading }: Props) {
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
        {total} {total === 1 ? "release" : "releases"} found
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {results.map((release) => (
          <ReleaseCard key={release.release_id} release={release} />
        ))}
      </div>
    </div>
  );
}
