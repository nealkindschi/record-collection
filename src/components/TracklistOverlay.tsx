import { useState, useEffect, useCallback } from "preact/hooks";
import type { Release, Track } from "../utils/db";

interface Props {
  release: Release;
  onClose: () => void;
}

export default function TracklistOverlay({ release, onClose }: Props) {
  const [tracklist, setTracklist] = useState<Track[] | null>(
    release.tracklist ?? null
  );
  const [loading, setLoading] = useState(!release.tracklist);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (release.tracklist) {
      setTracklist(release.tracklist);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTracklist() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/tracklist?release_id=${release.release_id}`
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch tracklist");
        }
        if (!cancelled) {
          setTracklist(data.tracklist);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load tracklist"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTracklist();

    return () => {
      cancelled = true;
    };
  }, [release.release_id, release.tracklist]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [handleClose]);

  const imgSrc = release.cover_image_url || release.thumb_url;

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        backgroundColor: visible ? "rgba(15, 13, 11, 0.85)" : "rgba(15, 13, 11, 0)",
        backdropFilter: visible ? "blur(8px)" : "none",
        WebkitBackdropFilter: visible ? "blur(8px)" : "none",
        transition: "background-color 0.3s, backdrop-filter 0.3s",
      }}
    >
      <div
        class="w-full max-w-lg bg-crate-900 border border-crate-600/50 rounded-2xl shadow-2xl shadow-sun-500/10 overflow-hidden"
        style={{
          transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(10px)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out",
        }}
      >
        <div class="flex items-start gap-4 p-5 border-b border-crate-600/50">
          {imgSrc && (
            <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg">
              <img
                src={imgSrc}
                alt={release.title}
                class="w-full h-full object-cover"
              />
            </div>
          )}
          <div class="min-w-0 flex-1 pt-0.5">
            <h2 class="text-base font-semibold text-white truncate leading-tight">
              {release.title}
            </h2>
            <p class="text-sm text-wax-400 truncate">{release.artist}</p>
            <div class="flex items-center gap-2 mt-1.5">
              {release.year && (
                <span class="text-xs text-wax-500">{release.year}</span>
              )}
              {release.format && (
                <span class="text-xs bg-crate-700 text-wax-400 px-1.5 py-0.5 rounded-md border border-crate-600/50">
                  {release.format}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            class="text-wax-500 hover:text-white transition-colors p-1.5 -m-1.5 rounded-lg hover:bg-crate-700/50"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="max-h-[60vh] overflow-y-auto p-5">
          {loading && (
            <div class="flex flex-col items-center justify-center py-12 gap-3">
              <div class="w-8 h-8 rounded-full border-2 border-sun-500/30 border-t-sun-500 animate-spin" />
              <p class="text-sm text-wax-500">Loading tracklist...</p>
            </div>
          )}

          {error && (
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <p class="text-red-400/80 text-sm">{error}</p>
              <p class="text-wax-500 text-xs mt-2">Try clicking the card again later</p>
            </div>
          )}

          {tracklist && tracklist.length > 0 && (
            <ol class="space-y-0.5">
              {tracklist.map((track, i) => (
                <li
                  key={`${track.position}-${track.title}`}
                  class="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-crate-800/60 transition-colors group"
                  style={{
                    animation: visible ? `slideUp 0.3s ease-out both` : "none",
                    animationDelay: `${i * 30}ms`,
                  }}
                >
                  <span class="text-xs text-wax-500 w-8 text-right shrink-0 font-mono tabular-nums">
                    {track.position}
                  </span>
                  <span class="text-sm text-wax-200 flex-1 truncate group-hover:text-white transition-colors">
                    {track.title}
                  </span>
                  {track.duration && (
                    <span class="text-xs text-wax-500 shrink-0 tabular-nums">
                      {track.duration}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}

          {tracklist && tracklist.length === 0 && !loading && (
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <div class="w-12 h-12 rounded-full bg-crate-800 border border-crate-600 flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-wax-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              </div>
              <p class="text-wax-400 text-sm">No tracklist available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
