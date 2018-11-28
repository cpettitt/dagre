"use strict";

var _ = require("../lodash"),
  initOrder = require("./init-order"),
  crossCount = require("./cross-count"),
  sortSubgraph = require("./sort-subgraph"),
  buildLayerGraph = require("./build-layer-graph"),
  addSubgraphConstraints = require("./add-subgraph-constraints"),
  Graph = require("../graphlib").Graph,
  util = require("../util");

module.exports = order;

/*
 * Applies heuristics to minimize edge crossings in the graph and sets the best
 * order solution as an order attribute on each node.
 *
 * Pre-conditions:
 *
 *    1. Graph must be DAG
 *    2. Graph nodes must be objects with a "rank" attribute
 *    3. Graph edges must have the "weight" attribute
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have an "order" attribute based on the results of the
 *       algorithm.
 */
function order(g) {
  var bestCC = Number.POSITIVE_INFINITY,
    best;
  for (var j = 0; j < 4; j++) {
    var maxRank = util.maxRank(g),
      downLayerGraphs = buildLayerGraphs(g, _.range(1, maxRank + 1), "inEdges"),
      upLayerGraphs = buildLayerGraphs(g, _.range(maxRank - 1, -1, -1), "outEdges");

    var layering = initOrder(g);
    assignOrder(g, layering);

    for (var i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
      sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2);

      layering = util.buildLayerMatrix(g);
      var cc = crossCount(g, layering);
      if (cc < bestCC) {
        lastBest = 0;
        best = _.cloneDeep(layering);
        bestCC = cc;
      }
    }
  }
  assignOrder(g, best);
}

function buildLayerGraphs(g, ranks, relationship) {
  return _.map(ranks, function (rank) {
    return buildLayerGraph(g, rank, relationship);
  });
}

function sweepLayerGraphs(layerGraphs, biasRight) {
  var cg = new Graph();
  _.forEach(layerGraphs, function (lg) {
    var root = lg.graph().root;
    var sorted = sortSubgraph(lg, root, cg, biasRight);
    _.forEach(sorted.vs, function (v, i) {
      lg.node(v).order = i;
    });
    addSubgraphConstraints(lg, cg, sorted.vs);
  });
}

function assignOrder(g, layering) {
  var thisNode;
  _.each(layering, function (layer, j) {

    layering[j] = _.sortBy(layer, function (v) {

      thisNode = g.node(v);

      if (thisNode.edgeLabel) {
        return thisNode.edgeLabel.sortrank;
      } else {
        return thisNode.sortrank;
      }
    });

    _.each(layering[j], function (v2, i) {
      g.node(v2).order = i;
    });
  });
}

