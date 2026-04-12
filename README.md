# Gauntlet Arena

Browser-based arena RPG: zone-based combat, gear, crafting, and progression. Open [index.html](index.html) through a local web server (recommended).

## Run locally

From the project root:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/` in your browser.

If you use Node.js:

```bash
npx serve .
```

### Why not `file://`?

Opening `index.html` directly from disk can work for some assets, but **a local server is more reliable**: consistent behavior for media (video/WebM), fewer browser quirks with security policies, and the same setup you would use for deployment.

## Playtest / balance notes (static review)

These observations come from data and combat logic, not exhaustive tuning:

- **Late-game spike**: Final encounter **AETHELGARD** has very high HP (1200) and damage (85) relative to earlier steps; expect long fights unless the player’s build and gear are strong. Worth watching for slog vs tension.
- **Agile enemies**: Higher **dodge** on several tiers makes misses feel swingy; combined with zone blocking, new players may perceive unfairness until patterns click.
- **God Strike / fury**: Burst damage that ignores blocks is a strong comeback tool; if runs feel too easy after unlocking fury reliably, consider a small fury gain tweak or boss resistance.
- **Head zone (`1`)**: Attack multiplier (1.4×) rewards risky targeting; good skill expression—just ensure tutorial text makes that tradeoff obvious.

Use these as starting points when you play several full runs per archetype (STR / DEX / STA / LUCK).
