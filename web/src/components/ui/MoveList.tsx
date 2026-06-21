/** Renders SAN history as numbered White/Black move pairs. */
export function MoveList({ history }: { history: string[] }) {
  const pairs: [string, string?][] = [];
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i], history[i + 1]]);

  return (
    <div>
      <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-mono text-faint">Moves</p>
      <ol className="max-h-44 overflow-y-auto pr-1 font-mono text-[0.78rem] text-muted">
        {pairs.length === 0 && <li className="text-faint">No moves yet.</li>}
        {pairs.map((pair, i) => (
          <li key={i} className="flex gap-2 py-0.5">
            <span className="w-6 shrink-0 text-faint">{i + 1}.</span>
            <span className="w-16 text-ink">{pair[0]}</span>
            <span className="w-16 text-ink">{pair[1] ?? ""}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
