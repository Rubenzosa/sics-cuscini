// Swipe laterale tra le schede della pagina kit.
// Conta solo un trascinamento lungo e soprattutto orizzontale, così lo scorrimento verticale resta libero.
const SOGLIA_PX = 60;

export function tabDopoSwipe(tabs, corrente, dx, dy) {
  if (Math.abs(dx) < SOGLIA_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return corrente;
  const i = tabs.indexOf(corrente);
  const j = dx < 0 ? i + 1 : i - 1;
  return j >= 0 && j < tabs.length ? tabs[j] : corrente;
}

// Gestori touch da spargere sul contenitore delle schede: <div {...gestoriSwipe(...)}>.
export function gestoriSwipe(tabs, corrente, setTab) {
  let x0 = 0, y0 = 0;
  return {
    onTouchStart: e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; },
    onTouchEnd: e => {
      const t = e.changedTouches[0];
      const nuova = tabDopoSwipe(tabs, corrente, t.clientX - x0, t.clientY - y0);
      if (nuova !== corrente) setTab(nuova);
    },
  };
}
