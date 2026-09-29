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
