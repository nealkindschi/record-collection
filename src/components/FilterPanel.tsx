interface Props {
  format: string;
  formats: string[];
  onFormatChange: (format: string) => void;
  vinylSize: string;
  vinylSizes: string[];
  onVinylSizeChange: (size: string) => void;
  genre: string;
  genres: string[];
  onGenreChange: (genre: string) => void;
}

export default function FilterPanel({
  format,
  formats,
  onFormatChange,
  vinylSize,
  vinylSizes,
  onVinylSizeChange,
  genre,
  genres,
  onGenreChange,
}: Props) {

  function Select({ value, onChange, label, options }: {
    value: string | number;
    onChange: (v: string) => void;
    label: string;
    options: { value: string; label: string }[];
  }) {
    return (
      <div>
        <label class="block text-xs font-medium text-sun-400 mb-1.5 tracking-wide uppercase">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          class="w-full bg-crate-800 border border-sun-500/25 hover:border-sun-500/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sun-400 focus:ring-2 focus:ring-sun-400/25 transition-all duration-200 appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff6d00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: "36px",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div class="bg-crate-800/50 border border-sun-500/25 rounded-xl p-4 shadow-lg shadow-sun-500/5">
      <h2 class="font-display text-lg tracking-wide text-sun-300 mb-3">Filters</h2>
      <div class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-[140px]">
          <Select
            value={format}
            onChange={onFormatChange}
            label="Format"
            options={[
              { value: "", label: "All Formats" },
              ...formats.map((f) => ({ value: f, label: f })),
            ]}
          />
        </div>
        {format && vinylSizes.length > 0 && (
          <div class="flex-1 min-w-[140px]">
            <Select
              value={vinylSize}
              onChange={onVinylSizeChange}
              label="Size"
              options={[
                { value: "", label: "All Sizes" },
                ...vinylSizes.map((s) => ({ value: s, label: s })),
              ]}
            />
          </div>
        )}
        {genres && genres.length > 0 && (
          <div class="flex-1 min-w-[140px]">
            <Select
              value={genre}
              onChange={onGenreChange}
              label="Genre"
              options={[
                { value: "", label: "All Genres" },
                ...genres.map((g) => ({ value: g, label: g })),
              ]}
            />
          </div>
        )}

      </div>
    </div>
  );
}
