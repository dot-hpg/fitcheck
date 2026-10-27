export function Fixes({ items }: { items: string[] }) {
  return (
    <section className="card" aria-labelledby="fixes-title">
      <div className="card-head">
        <div>
          <h2 id="fixes-title">Top fixes</h2>
          <p className="card-sub">Ordered by how much they should move your score.</p>
        </div>
      </div>
      {items.length ? (
        <ol className="fixes">
          {items.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ol>
      ) : (
        <p className="empty">Nothing major to fix. Nice work.</p>
      )}
    </section>
  )
}
