export function enterView(): string {
  return `
<header class="topbar">
  <a class="brand" href="/">ArcadeWire</a>
  <nav class="nav">
    <a class="navlink" href="/create">Create</a>
  </nav>
</header>

<main class="main">
  <section class="card" data-view="enter">
    <h1 class="title">Enter ArcadeWire</h1>
    <p class="subtitle">Type or paste the code exactly as shown.</p>

    <div class="field">
      <input class="input" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false"
        placeholder="ember-laser-…"
        data-bind="codeInput" />
      <div class="status" data-bind="status"></div>
    </div>

    <div class="actions">
      <button class="btn primary" data-action="connect" disabled>Connect</button>
    </div>

    <div class="outcome" hidden data-bind="outcome"></div>
  </section>
</main>
`;
}

