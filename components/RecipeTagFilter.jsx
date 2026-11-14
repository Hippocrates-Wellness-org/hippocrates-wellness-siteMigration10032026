'use client';
import { useEffect, useMemo, useState } from 'react';

// Drives the scraped page's "Filter by tag" <select id="Filter_recipes_tag">,
// which is dead markup without WP's JS. When a tag is chosen the scraped loop
// grid + pagination + result counter are hidden (body.recipe-filtering, see
// globals.css) and every recipe carrying that recipes-tag is rendered instead.
export default function RecipeTagFilter() {
  const [recipes, setRecipes] = useState(null);
  const [tag, setTag] = useState('');
  const active = tag !== '';

  useEffect(() => {
    let dead = false;
    fetch('/search/recipes.json')
      .then((r) => r.json())
      .then((d) => { if (!dead) setRecipes(d); })
      .catch(() => {});
    const onChange = (e) => { if (e.target?.id === 'Filter_recipes_tag') setTag(e.target.value); };
    document.addEventListener('change', onChange);
    return () => {
      dead = true;
      document.removeEventListener('change', onChange);
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

  return (
    <div className="recipe-filter">
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
    </div>
  );
}
