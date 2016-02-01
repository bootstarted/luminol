export const unaccepted = (renewedModules, updatedModules) => {
  return updatedModules.filter(function(moduleId) {
    return renewedModules && renewedModules.indexOf(moduleId) < 0;
  });
};

export const empty = (renewedModules) => {
  return (!renewedModules || renewedModules.length === 0);
};
