interface Props {
  format: string;
  formats: string[];
  onFormatChange: (format: string) => void;
  genre: string;
  genres: string[];
  onGenreChange: (genre: string) => void;
  year: number | "";
  years: { min: number; max: number } | null;
  onYearChange: (year: number | "") => void;
}

export default function FilterPanel({
  format,
  formats,
  onFormatChange,
  genre,
  genres,
  onGenreChange,
  year,
  years,
  onYearChange,
}: Props) {
  const yearOptions: number[] = years
    ? Array.from({ length: years.max - years.min + 1 }, (_, i) => years.max - i)
    : [];

  return (
    <div class="bg-gray-900 rounded-lg p-4">
      <h2 class="text-sm font-semibold text-gray-300 mb-3">Filters</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">Format</label>
          <select
            value={format}
            onChange={(e) =>
              onFormatChange((e.target as HTMLSelectElement).value)
            }
            class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Formats</option>
            {formats.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {genres && genres.length > 0 && (
          <div>
            <label class="block text-xs text-gray-400 mb-1">Genre</label>
            <select
              value={genre}
              onChange={(e) =>
                onGenreChange((e.target as HTMLSelectElement).value)
              }
              class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}

        {years && (
          <div>
            <label class="block text-xs text-gray-400 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                onYearChange(val ? parseInt(val, 10) : "");
              }}
              class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Years</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
