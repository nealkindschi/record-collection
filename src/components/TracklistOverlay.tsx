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
        backgroundColor: visible ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(4px)" : "none",
        transition: "background-color 0.2s, backdrop-filter 0.2s",
      }}
    >
      <div
        class="w-full max-w-lg bg-gray-900 rounded-xl shadow-2xl shadow-purple-500/20 overflow-hidden"
        style={{
          transform: visible ? "scale(1)" : "scale(0.9)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.3s ease-out, opacity 0.2s ease-out",
        }}
      >
        <div class="flex items-start gap-4 p-5 border-b border-gray-800">
          {imgSrc && (
            <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0">
              <img
                src={imgSrc}
                alt={release.title}
                class="w-full h-full object-cover"
              />
            </div>
          )}
          <div class="min-w-0 flex-1 pt-1">
            <h2 class="text-base font-semibold text-white truncate">
              {release.title}
            </h2>
            <p class="text-sm text-gray-400 truncate">{release.artist}</p>
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
          <button
            onClick={handleClose}
            class="text-gray-400 hover:text-white transition-colors p-1 -m-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div class="max-h-[60vh] overflow-y-auto p-5">
          {loading && (
            <div class="flex flex-col items-center justify-center py-10 gap-3">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              <p class="text-sm text-gray-400">Loading tracklist...</p>
            </div>
          )}

          {error && (
            <div class="text-center py-10">
              <p class="text-red-400 text-sm">{error}</p>
              <p class="text-gray-500 text-xs mt-1">
                Try clicking the card again later.
              </p>
            </div>
          )}

          {tracklist && tracklist.length > 0 && (
            <ol class="space-y-1">
              {tracklist.map((track) => (
                <li
                  key={`${track.position}-${track.title}`}
                  class="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-gray-800/50 transition-colors"
                >
                  <span class="text-xs text-gray-500 w-8 text-right shrink-0 font-mono">
                    {track.position}
                  </span>
                  <span class="text-sm text-gray-200 flex-1 truncate">
                    {track.title}
                  </span>
                  {track.duration && (
                    <span class="text-xs text-gray-500 shrink-0">
                      {track.duration}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}

          {tracklist && tracklist.length === 0 && !loading && (
            <div class="text-center py-10">
              <p class="text-gray-400 text-sm">
                No tracklist available for this release.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
