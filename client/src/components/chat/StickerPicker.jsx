import { STICKERS } from "../../lib/stickers";

function StickerPicker({ onSelect }) {
  return (
    <div className="glass-panel absolute bottom-24 right-20 z-20 w-72 rounded-3xl p-4">
      <p className="mb-3 text-sm font-semibold text-white">Quick stickers</p>
      <div className="grid grid-cols-3 gap-3">
        {STICKERS.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            onClick={() => onSelect(sticker.emoji)}
            className="rounded-2xl border border-line bg-slate-900/70 p-4 text-center transition hover:border-teal-400"
          >
            <div className="text-3xl">{sticker.emoji}</div>
            <div className="mt-2 text-[11px] text-slate-400">{sticker.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default StickerPicker;

