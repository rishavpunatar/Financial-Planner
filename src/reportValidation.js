const isPlainObject = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

const isString = (value) => typeof value === 'string';

const isArray = (value) => Array.isArray(value);

const validateStrategyEntry = (strategy, label) => {
  if (!isPlainObject(strategy)) {
    throw new Error(`${label} is malformed.`);
  }
  if (!isString(strategy.strategyId)) {
    throw new Error(`${label} is missing strategyId.`);
  }
  if (!isPlainObject(strategy.decisionVector)) {
    throw new Error(`${label} is missing decisionVector.`);
  }
  if (!isPlainObject(strategy.metrics)) {
    throw new Error(`${label} is missing metrics.`);
  }
};

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
      if (!isPlainObject(variant.baseParams)) {
        throw new Error(`Optimizer variant ${index + 1} is missing baseParams.`);
      }
      if (!isPlainObject(variant.searchConfig)) {
        throw new Error(`Optimizer variant ${index + 1} is missing searchConfig.`);
      }
      if (!isPlainObject(variant.searchMeta)) {
        throw new Error(`Optimizer variant ${index + 1} is missing searchMeta.`);
      }
      if (!isArray(variant.caseResults)) {
        throw new Error(`Optimizer variant ${index + 1} is missing caseResults.`);
      }
      variant.caseResults.forEach((caseResult, caseIndex) => {
        if (!isPlainObject(caseResult)) {
          throw new Error(`Optimizer variant ${index + 1} caseResult ${caseIndex + 1} is malformed.`);
        }
        if (!isPlainObject(caseResult.assumptionCase)) {
          throw new Error(`Optimizer variant ${index + 1} caseResult ${caseIndex + 1} is missing assumptionCase.`);
        }
        if (!isPlainObject(caseResult.objectiveResults)) {
          throw new Error(`Optimizer variant ${index + 1} caseResult ${caseIndex + 1} is missing objectiveResults.`);
        }
      });
    });

    return payload;
  }

  if (!isString(payload.generatedAt)) {
    throw new Error('Optimizer payload is missing generatedAt.');
  }
  if (!isPlainObject(payload.baseParams)) {
    throw new Error('Optimizer payload is missing baseParams.');
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
  if (!isPlainObject(payload.baseParams)) {
    throw new Error('Robustness report is missing baseParams.');
  }
  if (!isPlainObject(payload.charts)) {
    throw new Error('Robustness report is missing charts.');
  }
  if (!isPlainObject(payload.recommendation)) {
    throw new Error('Robustness report is missing recommendation.');
  }
  if (!isPlainObject(payload.objectiveLeaders)) {
    throw new Error('Robustness report is missing objectiveLeaders.');
  }
  if (!isArray(payload.topStrategies)) {
    throw new Error('Robustness report is missing topStrategies.');
  }
  if (!isArray(payload.strategyCatalog)) {
    throw new Error('Robustness report is missing strategyCatalog.');
  }
  if (!isPlainObject(payload.meta.scenarioSampling)) {
    throw new Error('Robustness report is missing scenarioSampling metadata.');
  }
  if (!isPlainObject(payload.meta.strategySampling)) {
    throw new Error('Robustness report is missing strategySampling metadata.');
  }
  payload.topStrategies.forEach((strategy, index) => {
    validateStrategyEntry(strategy, `Robustness topStrategy ${index + 1}`);
  });
  payload.strategyCatalog.forEach((strategy, index) => {
    validateStrategyEntry(strategy, `Robustness strategyCatalog entry ${index + 1}`);
  });

  return payload;
};
