import type { Release } from "../utils/db";

interface Props {
  release: Release;
}

export default function ReleaseCard({ release }: Props) {
  const imgSrc = release.cover_image_url || release.thumb_url;

  return (
    <div
      data-release-id={release.release_id}
      class="group relative bg-crate-800 rounded-xl overflow-hidden cursor-pointer border border-crate-600/60 hover:border-sun-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-sun-500/5 hover:-translate-y-0.5"
    >
      <div class="aspect-square bg-crate-700 overflow-hidden relative">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={release.title}
            class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            loading="lazy"
          />
        ) : (
          <div class="w-full h-full flex items-center justify-center text-crate-500">
            <svg class="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}

        <div class="absolute inset-0 bg-gradient-to-t from-crate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div class="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div class="flex items-center gap-1.5 text-sun-400 text-xs font-medium">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
            Tracklist
          </div>
        </div>
      </div>

      <div class="p-3 space-y-1">
        <p class="text-sm font-medium text-white truncate leading-tight">{release.title}</p>
        <p class="text-xs text-wax-400 truncate">{release.artist}</p>
        <div class="flex items-center gap-2 pt-0.5">
          {release.year && (
            <span class="text-[11px] text-wax-500 font-medium">{release.year}</span>
          )}
          {release.format && (
            <span class="text-[11px] bg-crate-700 text-wax-400 px-1.5 py-0.5 rounded-md border border-crate-600/50">
              {release.format}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
