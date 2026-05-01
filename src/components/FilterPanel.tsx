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

  function Select({ value, onChange, label, options }: {
    value: string | number;
    onChange: (v: string) => void;
    label: string;
    options: { value: string; label: string }[];
  }) {
    return (
      <div>
        <label class="block text-xs font-medium text-wax-400 mb-1.5 tracking-wide uppercase">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          class="w-full bg-crate-800 border border-crate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sun-500/50 focus:ring-1 focus:ring-sun-500/20 transition-all duration-200 appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239c9185' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
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
    <div class="bg-crate-800/50 border border-crate-600/50 rounded-xl p-4 space-y-4">
      <h2 class="font-display text-lg tracking-wide text-sun-400">Filters</h2>
      <Select
        value={format}
        onChange={onFormatChange}
        label="Format"
        options={[
          { value: "", label: "All Formats" },
          ...formats.map((f) => ({ value: f, label: f })),
        ]}
      />
      {genres && genres.length > 0 && (
        <Select
          value={genre}
          onChange={onGenreChange}
          label="Genre"
          options={[
            { value: "", label: "All Genres" },
            ...genres.map((g) => ({ value: g, label: g })),
          ]}
        />
      )}
      {years && (
        <Select
          value={year}
          onChange={(v) => onYearChange(v ? parseInt(v, 10) : "")}
          label="Year"
          options={[
            { value: "", label: "All Years" },
            ...yearOptions.map((y) => ({ value: String(y), label: String(y) })),
          ]}
        />
      )}
    </div>
  );
}
