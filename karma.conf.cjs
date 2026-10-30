// Configuración de Karma: corre las pruebas Jasmine en Chrome real.
// Webpack + Babel compilan el JSX; babel-plugin-istanbul instrumenta src/ para la cobertura.
const path = require("path");

module.exports = function (config) {
  config.set({
    frameworks: ["jasmine", "webpack"],

    // Cada *.spec.js(x) es una suite de pruebas.
    files: [
      { pattern: "src/tests/**/*.spec.@(js|jsx)", watched: false },
      // Archivos estáticos de public/ (el logo del Home), servidos pero no cargados como script.
      { pattern: "public/**", included: false, served: true, watched: false },
    ],

    proxies: {
      "/logo_trasnparente.png": "/base/public/logo_trasnparente.png",
    },

    preprocessors: {
      "src/tests/**/*.spec.@(js|jsx)": ["webpack"],
    },

    webpack: {
      mode: "development",
      devtool: "inline-source-map",
      resolve: { extensions: [".js", ".jsx"] },
      module: {
        rules: [
          {
            // El proyecto es "type": "module"; permite imports sin extensión como en Vite.
            test: /\.m?jsx?$/,
            resolve: { fullySpecified: false },
          },
          {
            test: /\.jsx?$/,
            include: path.resolve(__dirname, "src"),
            use: {
              loader: "babel-loader",
              options: {
                babelrc: false,
                configFile: false,
                presets: [
                  ["@babel/preset-env", { targets: { chrome: "100" } }],
                  ["@babel/preset-react", { runtime: "automatic" }],
                ],
                plugins: [
                  // Mide cobertura solo del código de la app, no de las pruebas.
                  ["istanbul", { include: ["src/**"], exclude: ["src/tests/**", "src/main.jsx"] }],
                ],
              },
            },
          },
        ],
      },
    },

    client: {
      jasmine: { random: true }, // orden aleatorio: asegura que las pruebas sean independientes
    },

    reporters: ["spec", "coverage"],

    specReporter: {
      suppressSkipped: true,
      showSpecTiming: true,
    },

    coverageReporter: {
      dir: path.resolve(__dirname, "coverage"),
      reporters: [
        { type: "html", subdir: "html" },
        { type: "lcovonly", subdir: ".", file: "lcov.info" },
        { type: "text" },
        { type: "text-summary" },
      ],
    },

    browsers: ["ChromeHeadless"],
    singleRun: true,
  });
};
