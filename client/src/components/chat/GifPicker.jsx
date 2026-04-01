import { useState } from "react";
import { searchGifs } from "../../services/giphy";

function GifPicker({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async (event) => {
    event.preventDefault();
    const gifs = await searchGifs(query);
    setResults(gifs);
  };

  return (
    <div className="glass-panel absolute bottom-24 right-0 z-20 w-80 rounded-3xl p-4">
      <form onSubmit={handleSearch} className="mb-3 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search GIFs"
          className="flex-1 rounded-2xl border border-line bg-slate-900 px-3 py-2 text-sm outline-none"
        />
        <button type="submit" className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold">
          Go
        </button>
      </form>
      <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto">
        {results.map((gif) => (
          <button key={gif.id} type="button" onClick={() => onSelect(gif.images.fixed_height.url)}>
            <img src={gif.images.fixed_height_small.url} alt={gif.title} className="rounded-2xl" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default GifPicker;

