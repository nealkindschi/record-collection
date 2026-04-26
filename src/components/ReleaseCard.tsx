import type { Release } from "../utils/db";

interface Props {
  release: Release;
}

export default function ReleaseCard({ release }: Props) {
  const imgSrc = release.cover_image_url || release.thumb_url;

  return (
    <div
      data-release-id={release.release_id}
      class="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-all duration-200 cursor-pointer hover:scale-[1.03] hover:shadow-lg hover:shadow-purple-500/10 group relative"
    >
      <div class="aspect-square bg-gray-800 overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={release.title}
            class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div class="w-full h-full flex items-center justify-center text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
        )}
        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8 text-white pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>
      </div>
      <div class="p-3">
        <p class="text-sm font-medium text-white truncate">{release.title}</p>
        <p class="text-xs text-gray-400 truncate">{release.artist}</p>
        <div class="flex items-center gap-2 mt-1">
          {release.year && (
            <span class="text-xs text-gray-500">{release.year}</span>
          )}
          {release.format && (
            <span class="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
              {release.format}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
