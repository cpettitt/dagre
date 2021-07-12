// eslint-disable-next-line no-redeclare
/* global window */

var graphlib;

if (typeof require === "function") {
  try {
    graphlib = require("graphlib/index");
  } catch (e) {
    // continue regardless of error
  }
}

if (!graphlib) {
  graphlib = window.graphlib;
}

module.exports = graphlib;
