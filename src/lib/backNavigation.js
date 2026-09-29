export const OVERLAY_HISTORY_KEY = "chayOverlay";

export function createOverlayHistoryState(state) {
  const currentState =
    state && typeof state === "object" && !Array.isArray(state) ? state : {};
  const currentIndex = Number.isInteger(currentState.idx) ? currentState.idx : 0;

  return {
    ...currentState,
    [OVERLAY_HISTORY_KEY]: true,
    idx: currentIndex + 1,
  };
}

export function hasInAppHistory(state) {
  return Number.isInteger(state?.idx) && state.idx > 0;
}

export function hasNavigationOrigin(state, originKey) {
  return state?.usr?.[originKey] === true;
}

export function getBackAction({ hasOverlay, hasHistory, isNative, isPlaying }) {
  if (hasOverlay) return "close-overlay";
  if (hasHistory) return "navigate-back";
  if (isNative && isPlaying) return "minimize-app";
  return "fallback";
}

export function getBackFallback(pathname, search = "") {
  const params = new URLSearchParams(search);
  if (
    (pathname === "/media" && params.has("cat")) ||
    (pathname === "/bible" && (params.has("view") || params.has("ref"))) ||
    (pathname === "/messages" && params.has("c")) ||
    (pathname === "/games" && params.has("game"))
  ) {
    return pathname;
  }
  return "/";
}
