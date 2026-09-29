let activeControl = null;
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener(activeControl));
}

export function subscribeMediaControl(listener) {
  listeners.add(listener);
  listener(activeControl);
  return () => listeners.delete(listener);
}

export function registerMediaControl(control) {
  const id = Symbol(control.type);
  activeControl = { ...control, id };
  notify();
  const dispose = () => {
    if (activeControl?.id === id) {
      activeControl = null;
      notify();
    }
  };
  dispose.id = id;
  return dispose;
}

export function updateMediaControl(id, updates) {
  if (activeControl?.id !== id) return;
  activeControl = { ...activeControl, ...updates };
  notify();
}

export function stopActiveMediaControl() {
  const control = activeControl;
  activeControl = null;
  notify();
  control?.stop();
}
