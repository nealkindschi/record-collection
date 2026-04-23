interface Props {
  format: string;
  formats: string[];
  onFormatChange: (format: string) => void;
}

export default function FilterPanel({
  format,
  formats,
  onFormatChange,
}: Props) {
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
      </div>
    </div>
  );
}
