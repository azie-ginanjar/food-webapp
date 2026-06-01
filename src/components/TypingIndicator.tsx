export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 p-4 glass rounded-2xl rounded-tl-sm w-fit">
      <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
      <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
      <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
    </div>
  );
}
