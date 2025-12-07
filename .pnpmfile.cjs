module.exports = {
  hooks: {
    readPackage(pkg) {
      // Ensure pnpm 10 is being used
      if (pkg.engines && pkg.engines.pnpm) {
        pkg.engines.pnpm = '10.x';
      }
      return pkg;
    },
  },
};
