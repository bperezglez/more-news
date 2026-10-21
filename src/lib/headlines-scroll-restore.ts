export type HeadlinesScrollSnapshot = {
  scrollY: number;
  headlineId?: string;
};

const SCROLL_KEY = "more-news:headlines-scroll";
const RESTORE_FLAG = "more-news:restore-headlines-scroll";

/** Guarda la posición del listado al abrir una noticia (solo se restaura al volver). */
export function saveHeadlinesScrollForReturn(headlineId?: string) {
  if (typeof window === "undefined") return;
  try {
    const snapshot: HeadlinesScrollSnapshot = {
      scrollY: window.scrollY,
      headlineId,
    };
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(snapshot));
    sessionStorage.setItem(RESTORE_FLAG, "1");
  } catch {
    /* sessionStorage no disponible */
  }
}

/** Lee y borra el snapshot si el usuario vuelve desde un artículo al listado. */
export function consumeHeadlinesScrollRestore(): HeadlinesScrollSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    if (sessionStorage.getItem(RESTORE_FLAG) !== "1") return null;
    sessionStorage.removeItem(RESTORE_FLAG);
    const raw = sessionStorage.getItem(SCROLL_KEY);
    sessionStorage.removeItem(SCROLL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HeadlinesScrollSnapshot;
    if (!Number.isFinite(parsed.scrollY)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function restoreHeadlinesScroll(snapshot: HeadlinesScrollSnapshot) {
  if (snapshot.headlineId) {
    const el = document.querySelector(
      `[data-headline-id="${CSS.escape(snapshot.headlineId)}"]`,
    );
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "auto" });
      return;
    }
  }
  window.scrollTo({ top: snapshot.scrollY, left: 0, behavior: "auto" });
}
