import { useState, useEffect, useRef } from "preact/hooks";

const DELAY_MS = 1500;

interface Props {
  active: boolean;
}

export default function PrewarmBar({ active }: Props) {
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [running, setRunning] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!active || running) return;
    cancelledRef.current = false;
    setRunning(true);

    async function prewarm() {
      try {
        const res = await fetch("/api/prewarm");
        const data = await res.json();
        if (!res.ok || !data.uncached?.length) {
          setRunning(false);
          return;
        }

        const ids: number[] = data.uncached;
        setTotal(ids.length);
        setDone(0);

        for (let i = 0; i < ids.length; i++) {
          if (cancelledRef.current) break;
          try {
            await fetch(`/api/tracklist?release_id=${ids[i]}`);
          } catch {}
          if (!cancelledRef.current) setDone(i + 1);
          if (i < ids.length - 1 && !cancelledRef.current) {
            await new Promise((r) => setTimeout(r, DELAY_MS));
          }
        }
      } catch {}
      setRunning(false);
    }

    prewarm();
    return () => {
      cancelledRef.current = true;
    };
  }, [active]);

  if (!running && total === 0) return null;
  if (dismissed && !running) return null;

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = done >= total && total > 0;

  return (
    <div class="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur border-t border-gray-800 px-4 py-2">
      <div class="max-w-7xl mx-auto flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-gray-400">
              {complete
                ? `Cached ${total} tracklists`
                : `Caching tracklists: ${done}/${total}`}
            </span>
            <span class="text-xs text-gray-500">{pct}%</span>
          </div>
          <div class="w-full bg-gray-800 rounded-full h-1.5">
            <div
              class="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {complete && (
          <button
            onClick={() => setDismissed(true)}
            class="text-gray-400 hover:text-white text-xs shrink-0"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
