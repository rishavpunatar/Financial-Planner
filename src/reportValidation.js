const isPlainObject = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

const isString = (value) => typeof value === 'string';

const isArray = (value) => Array.isArray(value);

export const validatePrecomputedOptimizerPayload = (payload) => {
  if (!isPlainObject(payload)) {
    throw new Error('Optimizer payload is not an object.');
  }

  if (payload.variants != null) {
    if (!isPlainObject(payload.variants)) {
      throw new Error('Optimizer variants payload is malformed.');
    }

    const variants = Object.values(payload.variants);
    if (!variants.length) {
      throw new Error('Optimizer variants payload is empty.');
    }

    variants.forEach((variant, index) => {
      if (!isPlainObject(variant)) {
        throw new Error(`Optimizer variant ${index + 1} is malformed.`);
      }
      if (!isString(variant.generatedAt)) {
        throw new Error(`Optimizer variant ${index + 1} is missing generatedAt.`);
      }
      if (!isPlainObject(variant.searchMeta)) {
        throw new Error(`Optimizer variant ${index + 1} is missing searchMeta.`);
      }
      if (!isArray(variant.caseResults)) {
        throw new Error(`Optimizer variant ${index + 1} is missing caseResults.`);
      }
    });

    return payload;
  }

  if (!isString(payload.generatedAt)) {
    throw new Error('Optimizer payload is missing generatedAt.');
  }
  if (!isPlainObject(payload.searchMeta)) {
    throw new Error('Optimizer payload is missing searchMeta.');
  }
  if (!isArray(payload.caseResults)) {
    throw new Error('Optimizer payload is missing caseResults.');
  }

  return payload;
};

export const validateRobustnessReport = (payload) => {
  if (!isPlainObject(payload)) {
    throw new Error('Robustness report is not an object.');
  }
  if (!isString(payload.generatedAt)) {
    throw new Error('Robustness report is missing generatedAt.');
  }
  if (!isPlainObject(payload.meta)) {
    throw new Error('Robustness report is missing meta.');
  }
  if (!isPlainObject(payload.charts)) {
    throw new Error('Robustness report is missing charts.');
  }
  if (!isArray(payload.topStrategies)) {
    throw new Error('Robustness report is missing topStrategies.');
  }
  if (!isArray(payload.strategyCatalog)) {
    throw new Error('Robustness report is missing strategyCatalog.');
  }

  return payload;
};
