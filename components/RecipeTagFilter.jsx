'use client';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

// Drives the scraped page's "Filter by tag" <select id="Filter_recipes_tag">,
// which is dead markup without WP's JS. Results are portaled into a slot
// inserted at the loop grid's position so filtered recipes appear where the
// grid was; while active the grid/pagination/counter hide via
// body.recipe-filtering (see globals.css).
export default function RecipeTagFilter() {
  const [recipes, setRecipes] = useState(null);
  const [tag, setTag] = useState('');
  const [slot, setSlot] = useState(null);
  const active = tag !== '';

  useEffect(() => {
    let dead = false;
    fetch('/search/recipes.json')
      .then((r) => r.json())
      .then((d) => { if (!dead) setRecipes(d); })
      .catch(() => {});
    const onChange = (e) => { if (e.target?.id === 'Filter_recipes_tag') setTag(e.target.value); };
    document.addEventListener('change', onChange);
    // Mount point for results: right where the scraped recipe grid sits.
    const grid = document.querySelector('.elementor-loop-container');
    const el = document.createElement('div');
    el.className = 'recipe-filter';
    if (grid) grid.parentNode.insertBefore(el, grid);
    setSlot(el);
    return () => {
      dead = true;
      document.removeEventListener('change', onChange);
      el.remove();
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('recipe-filtering', active);
    return () => document.body.classList.remove('recipe-filtering');
  }, [active]);

  const results = useMemo(
    () => (!recipes || !active ? [] : recipes.filter((r) => r.c.includes(tag))),
    [recipes, tag, active]
  );

  const label = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (!slot) return null;
  return createPortal(
    <>
      {active && (
        <p className="bs-count" role="status">
          {recipes ? `${results.length} recipe${results.length === 1 ? '' : 's'} tagged “${label(tag)}”` : 'Loading…'}
        </p>
      )}
      {active && results.length > 0 && (
        <div className="bs-results">
          {results.map((r) => (
            <a key={r.p} className="bs-card" href={`/${r.p}/`}>
              {r.i && <img className="bs-img" src={r.i} alt="" loading="lazy" />}
              <span className="bs-cat">{r.c.map(label).join(' · ')}</span>
              <span className="bs-title">{r.t}</span>
              {r.e && <span className="bs-excerpt">{r.e.slice(0, 160)}{r.e.length > 160 ? '…' : ''}</span>}
            </a>
          ))}
        </div>
      )}
    </>,
    slot
  );
}
