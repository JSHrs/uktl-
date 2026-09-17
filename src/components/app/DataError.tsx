export function DataError() {
  return <div role="alert" className="p-8 text-ink bg-paper">
    <h2 className="font-display text-2xl">Data is temporarily unavailable</h2>
    <p className="mt-3 text-ink-soft">Please try again. Your saved records have not been removed.</p>
    <button className="mt-4 underline" onClick={() => window.location.reload()}>Try again</button>
  </div>;
}
