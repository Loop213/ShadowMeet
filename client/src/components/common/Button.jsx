function Button({ className = "", children, ...props }) {
  return (
    <button
      className={`rounded-2xl bg-teal-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;

