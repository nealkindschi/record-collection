import { useState, useEffect, useRef } from "preact/hooks";

interface Props {
  query?: string;
}

export default function SearchBar({ query: externalQuery = "" }: Props) {
  const [query, setQuery] = useState(externalQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("search:query", { detail: query }));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleFocus() {
      inputRef.current?.focus();
    }
    window.addEventListener("search:focus", handleFocus);
    return () => window.removeEventListener("search:focus", handleFocus);
  }, []);

  return (
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg
          class="w-4 h-4 text-wax-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        placeholder="Search by title or artist..."
        class="w-full bg-crate-800 border border-crate-600 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-wax-500/60 focus:outline-none focus:border-sun-500/50 focus:ring-1 focus:ring-sun-500/20 transition-all duration-200"
      />
    </div>
  );
}
