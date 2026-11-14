'use client';
import { useEffect, useMemo, useState } from 'react';

// Searches every blog post via a static index (public/search/posts.json).
// While a query or category is active the scraped loop grid + pagination are
// hidden (body.blog-searching, see globals.css) and results take their place.
// Also drives the scraped page's "Filter by category" <select id="Filter_cat">,
// which is dead markup without WP's JS.
export default function BlogSearch() {
  const [posts, setPosts] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const active = q.trim() !== '' || cat !== '';

  useEffect(() => {
    let dead = false;
    fetch('/search/posts.json')
      .then((r) => r.json())
      .then((d) => { if (!dead) setPosts(d); })
      .catch(() => {});
    const onCat = (e) => { if (e.target?.id === 'Filter_cat') setCat(e.target.value); };
    document.addEventListener('change', onCat);
    return () => {
      dead = true;
      document.removeEventListener('change', onCat);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('blog-searching', active);
    return () => document.body.classList.remove('blog-searching');
  }, [active]);

  const results = useMemo(() => {
    if (!posts || !active) return [];
    const needle = q.trim().toLowerCase();
    return posts.filter((p) =>
      (!cat || p.c.includes(cat)) &&
      (!needle || p.t.toLowerCase().includes(needle)
        || p.e.toLowerCase().includes(needle)
        || p.c.join(' ').includes(needle))
    );
  }, [posts, q, cat, active]);

  const label = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const date = (d) => d && new Date(`${d}T00:00:00`).toLocaleDateString('en-US',
    { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="blog-search">
      <div className="bs-bar">
        <input
          type="search"
          className="bs-input"
          placeholder={posts ? `Search ${posts.length.toLocaleString()} articles…` : 'Search articles…'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search blog articles"
        />
        {active && (
          <button type="button" className="bs-clear" onClick={() => { setQ(''); setCat(''); const s = document.getElementById('Filter_cat'); if (s) s.value = ''; }}>
            Clear
          </button>
        )}
      </div>
      {active && (
        <p className="bs-count" role="status">
          {posts ? `${results.length.toLocaleString()} result${results.length === 1 ? '' : 's'}` : 'Loading index…'}
        </p>
      )}
      {active && results.length > 0 && (
        <div className="bs-results">
          {results.slice(0, 120).map((p) => (
            <a key={p.p} className="bs-card" href={`/${p.p}/`}>
              {p.i && <img className="bs-img" src={p.i} alt="" loading="lazy" />}
              {p.c[0] && <span className="bs-cat">{label(p.c[0])}</span>}
              <span className="bs-title">{p.t}</span>
              {p.e && <span className="bs-excerpt">{p.e.slice(0, 160)}{p.e.length > 160 ? '…' : ''}</span>}
              {p.d && <span className="bs-date">{date(p.d)}</span>}
            </a>
          ))}
        </div>
      )}
      {active && posts && results.length > 120 && (
        <p className="bs-count">Showing the first 120 — keep typing to narrow it down.</p>
      )}
    </div>
  );
}
