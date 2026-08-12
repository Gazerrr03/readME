export const ENVIRONMENT_CAPABILITY = Object.freeze({
  OFF: 'off',
  PHONE_STATIC: 'phone-static',
  STATIC: 'static',
  ANIMATED: 'animated',
});

export const ENVIRONMENT_MOTION = Object.freeze({
  RUNNING: 'running',
  FOCUSED: 'focused',
  STATIC: 'static',
});

export const ENVIRONMENT_VIEWS = Object.freeze(['time', 'weather', 'tide-wind']);

export function getEnvironmentCapability({
  mode,
  width = 0,
  coarsePointer = false,
  reducedMotion = false,
}) {
  if (width <= 760) return ENVIRONMENT_CAPABILITY.PHONE_STATIC;
  if (width < 1024 || coarsePointer || reducedMotion) return ENVIRONMENT_CAPABILITY.STATIC;
  return ENVIRONMENT_CAPABILITY.ANIMATED;
}

export function getEnvironmentMotionState({
  capability,
  hasVisibleWindow = false,
  documentHidden = false,
}) {
  if (capability !== ENVIRONMENT_CAPABILITY.ANIMATED || documentHidden) {
    return ENVIRONMENT_MOTION.STATIC;
  }
  return hasVisibleWindow ? ENVIRONMENT_MOTION.FOCUSED : ENVIRONMENT_MOTION.RUNNING;
}

export function nextEnvironmentView(current) {
  const index = ENVIRONMENT_VIEWS.indexOf(current);
  return ENVIRONMENT_VIEWS[(index + 1) % ENVIRONMENT_VIEWS.length] ?? ENVIRONMENT_VIEWS[0];
}

export function formatEnvironmentClock(date, locale) {
  const timeParts = Object.fromEntries(new Intl.DateTimeFormat(locale, {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return {
    time: `${timeParts.hour}:${timeParts.minute}`,
    date: new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(date),
  };
}

export function getQuietZoneOpacity({ x, y }, zones = []) {
  return zones.reduce((opacity, zone) => {
    const deltaX = Math.max(zone.left - x, 0, x - zone.right);
    const deltaY = Math.max(zone.top - y, 0, y - zone.bottom);
    const distance = Math.hypot(deltaX, deltaY);
    const feather = Math.max(1, zone.feather);
    return Math.min(opacity, Math.min(1, distance / feather));
  }, 1);
}
