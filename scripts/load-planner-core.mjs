export const loadPlannerCore = async ({
  moduleName = 'planner-core',
  extraExports = [],
} = {}) => {
  void moduleName;
  void extraExports;
  return import('../src/plannerModel.js');
};

export default loadPlannerCore;
