export function homeView(): string {
  return `
<header class="topbar">
  <div class="brand">ArcadeWire</div>
</header>

<main class="main">
  <section class="card">
    <h1 class="title">Connect, calmly.</h1>
    <p class="subtitle">Create a single-use code. Someone else enters it. Done.</p>

    <div class="actions">
      <a class="btn primary" href="/create">Create ArcadeWire</a>
      <a class="btn" href="/enter">Enter Code</a>
    </div>
  </section>
</main>
`;
}

