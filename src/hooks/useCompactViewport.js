import { useEffect, useState } from "react";

const COMPACT_VIEWPORT_QUERY = "(max-width: 700px)";

function readCompactViewport() {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia === "function") {
    return window.matchMedia(COMPACT_VIEWPORT_QUERY).matches;
  }
  return window.innerWidth <= 700;
}

export default function useCompactViewport() {
  const [compact, setCompact] = useState(readCompactViewport);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const update = () => setCompact(readCompactViewport());
    const media = typeof window.matchMedia === "function"
      ? window.matchMedia(COMPACT_VIEWPORT_QUERY)
      : null;

    update();
    if (media?.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    if (media?.addListener) {
      media.addListener(update);
      return () => media.removeListener(update);
    }

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return compact;
}
