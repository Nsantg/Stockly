/**
 * Configuración de referencia para ejecutores Cucumber nativos (@cucumber/cucumber).
 * La suite actual usa jest-cucumber; ejecutar con: npm run test:bdd
 */
module.exports = {
  default: {
    paths: ['__bdd__/features/**/*.feature'],
    require: ['__bdd__/steps/**/*.steps.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress-bar', 'html:__bdd__/reports/cucumber-report.html'],
    publishQuiet: true,
    language: 'es',
  },
};
