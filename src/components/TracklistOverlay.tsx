import { useState, useEffect, useCallback } from "preact/hooks";
import type { Release, Track } from "../utils/db";

interface Props {
  release: Release;
  onClose: () => void;
}

export default function TracklistOverlay({ release, onClose }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [tracklist, setTracklist] = useState<Track[] | null>(
    release.tracklist ?? null
  );
  const [loading, setLoading] = useState(!release.tracklist);
  const [error, setError] = useState("");

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

  useEffect(() => {
    const timer = setTimeout(() => setFlipped(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBackdropClick = useCallback(
    (e: Event) => {
      if ((e.target as HTMLElement).classList.contains("overlay-backdrop")) {
        setFlipped(false);
        setTimeout(onClose, 400);
      }
    },
    [onClose]
  );

  const handleClose = useCallback(() => {
    setFlipped(false);
    setTimeout(onClose, 400);
  }, [onClose]);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [handleClose]);

  const imgSrc = release.cover_image_url || release.thumb_url;

  return (
    <div
      class="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        class="overlay-card w-full max-w-lg"
        style={{ perspective: "1200px" }}
      >
        <div
          class="overlay-card-inner"
          style={{
            position: "relative",
            width: "100%",
            transition: "transform 0.6s ease-in-out",
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front face — album art */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
            class="rounded-xl overflow-hidden shadow-2xl shadow-purple-500/20"
          >
            <div class="bg-gray-900 aspect-square flex items-center justify-center">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={release.title}
                  class="w-full h-full object-cover"
                />
              ) : (
                <div class="text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-24 w-24"
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
            </div>
          </div>

          {/* Back face — tracklist */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            class="rounded-xl overflow-hidden shadow-2xl shadow-purple-500/20 bg-gray-900"
          >
            <div class="flex flex-col h-full">
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
                  <p class="text-sm text-gray-400 truncate">
                    {release.artist}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    {release.year && (
                      <span class="text-xs text-gray-500">
                        {release.year}
                      </span>
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

              <div class="flex-1 overflow-y-auto p-5">
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
        </div>
      </div>
    </div>
  );
}
