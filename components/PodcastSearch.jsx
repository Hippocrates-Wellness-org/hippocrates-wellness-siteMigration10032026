'use client';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

// Search box rendered on the "Recent Episodes" line (right margin) via a
// runtime-inserted slot. While a query is active the scraped loop grid,
// pagination and result counter hide (body.podcast-searching, globals.css)
// and matching episodes are portaled into the grid's position.
export default function PodcastSearch() {
  const [eps, setEps] = useState(null);
  const [q, setQ] = useState('');
  const [slot, setSlot] = useState(null);
  const [out, setOut] = useState(null);
  const active = q.trim() !== '';

  useEffect(() => {
    let dead = false;
    fetch('/search/podcasts.json')
      .then((r) => r.json())
      .then((d) => { if (!dead) setEps(d); })
      .catch(() => {});

    // Search input goes on the same row as the "Recent Episodes" heading,
    // pushed to the right margin by .podcast-search-row flex rules.
    const h = [...document.querySelectorAll('h2')]
      .find((e) => e.textContent.trim() === 'Recent Episodes');
    const wrap = h?.closest('.elementor-widget-wrap');
    const s = document.createElement('div');
    s.className = 'podcast-search';
    if (wrap) {
      wrap.classList.add('podcast-search-row');
      h.closest('.elementor-element').after(s);
    }

    // Results slot sits where the loop grid is.
    const grid = document.querySelector('.elementor-loop-container');
    const o = document.createElement('div');
    o.className = 'podcast-search-results';
    if (grid) grid.parentNode.insertBefore(o, grid);

    setSlot(s);
    setOut(o);
    return () => {
      dead = true;
      s.remove();
      o.remove();
      wrap?.classList.remove('podcast-search-row');
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('podcast-searching', active);
    return () => document.body.classList.remove('podcast-searching');
  }, [active]);

  const results = useMemo(() => {
    if (!eps || !active) return [];
    const needle = q.trim().toLowerCase();
    return eps.filter((e) =>
      e.t.toLowerCase().includes(needle) || e.e.toLowerCase().includes(needle));
  }, [eps, q, active]);

  const date = (d) => d && new Date(`${d}T00:00:00`).toLocaleDateString('en-US',
    { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      {slot && createPortal(
        <input
          type="search"
          className="podcast-search-input"
          placeholder={eps ? `Search ${eps.length} episodes…` : 'Search episodes…'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search podcast episodes"
        />,
        slot
      )}
      {out && createPortal(
        <>
          {active && (
            <p className="bs-count" role="status">
              {eps ? `${results.length} episode${results.length === 1 ? '' : 's'} found` : 'Loading…'}
            </p>
          )}
          {active && results.length > 0 && (
            <div className="bs-results">
              {results.slice(0, 60).map((e) => (
                <a key={e.p} className="bs-card" href={`/${e.p}/`}>
                  <span className="bs-title">{e.t}</span>
                  {e.e && <span className="bs-excerpt">{e.e.slice(0, 160)}{e.e.length > 160 ? '…' : ''}</span>}
                  {e.d && <span className="bs-date">{date(e.d)}</span>}
                </a>
              ))}
            </div>
          )}
        </>,
        out
      )}
    </>
  );
}
