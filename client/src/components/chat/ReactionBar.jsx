const REACTIONS = ["❤️", "🔥", "😂"];

function ReactionBar({ onReact }) {
  return (
    <div className="mt-2 flex gap-2">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(emoji)}
          className="rounded-full bg-slate-900/40 px-2 py-1 text-xs"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default ReactionBar;

