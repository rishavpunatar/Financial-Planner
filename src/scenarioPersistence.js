export const SCENARIO_SCHEMA_VERSION = 2;

const isPlainObject = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

const isScalar = (value) => (
  value == null
  || typeof value === 'string'
  || typeof value === 'boolean'
  || (typeof value === 'number' && Number.isFinite(value))
);

const unwrapScenarioPayload = (parsed) => {
  if (!isPlainObject(parsed)) return null;

  if ('payload' in parsed) {
    if (
      'schemaVersion' in parsed
      && parsed.schemaVersion !== SCENARIO_SCHEMA_VERSION
    ) {
      return null;
    }
    if (!isPlainObject(parsed.payload)) return null;
    return parsed.payload;
  }

  return parsed;
};

export const sanitizeScenarioPayload = (payload) => {
  if (!isPlainObject(payload)) return null;

  const sanitizedEntries = Object.entries(payload)
    .filter(([, value]) => isScalar(value));

  return sanitizedEntries.length > 0
    ? Object.fromEntries(sanitizedEntries)
    : null;
};

export const saveFiltersToURL = (filters) => {
  const payload = {
    schemaVersion: SCENARIO_SCHEMA_VERSION,
    payload: filters,
  };
  const encodedFilters = encodeURIComponent(JSON.stringify(payload));
  const newURL = `${window.location.origin}${window.location.pathname}?filters=${encodedFilters}`;
  window.history.replaceState(null, '', newURL);
};

export const loadFiltersFromURL = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const filters = params.get('filters');

    if (!filters) return null;

    const parsed = JSON.parse(decodeURIComponent(filters));
    return sanitizeScenarioPayload(unwrapScenarioPayload(parsed));
  } catch {
    return null;
  }
};

export const loadStoredScenario = () => {
  if (typeof window === 'undefined') return null;
  return loadFiltersFromURL();
};
