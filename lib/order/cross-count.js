"use strict";

var _ = require("../lodash");

module.exports = crossCount;

/*
 * A function that takes a layering (an array of layers, each with an array of
 * ordererd nodes) and a graph and returns a weighted crossing count.
 *
 * Pre-conditions:
 *
 *    1. Input graph must be simple (not a multigraph), directed, and include
 *       only simple edges.
 *    2. Edges in the input graph must have assigned weights.
 *
 * Post-conditions:
 *
 *    1. The graph and layering matrix are left unchanged.
 *
 * This algorithm is derived from Barth, et al., "Bilayer Cross Counting."
 */
function crossCount(g, layering) {
  var cc = 0;
  for (var i = 0; i < layering.length; ++i) {
    cc += singleLayerCrossCount(g, layering[i]);
    if (i > 0) {
      cc += twoLayerCrossCount(g, layering[i-1], layering[i]);
    }
  }
  return cc;
}

function singleLayerCrossCount(g, layer) {
  var cc = 0;
  if (layer.length) {
    var layerRank = g.node(layer[0]).rank;
    var layerIndex = _.zipObject(
      layer,
       _.map(layer, function (v, i) { return i; })
    );

    _.forEach(layer, function(n, i) {
      _.forEach(g.inEdges(n), function(e) {
        if (g.node(e.v).rank == layerRank) {
          var otherPos = layerIndex[e.v];
          if (Math.abs(otherPos - i) > 1) {
            cc++;
          }
        }
      });
    });
  }
  return cc;
}

function twoLayerCrossCount(g, northLayer, southLayer) {
  // Sort all of the edges between the north and south layers by their position
  // in the north layer and then the south. Map these edges to the position of
  // their head in the south layer.
  var southPos = _.zipObject(southLayer,
    _.map(southLayer, function (v, i) { return i; }));
  var southEntries = _.flatten(_.map(northLayer, function(v) {
    return _.sortBy(_.map(g.outEdges(v), function(e) {
      return { pos: southPos[e.w], weight: g.edge(e).weight };
    }), "pos");
  }), true);

  // Build the accumulator tree
  var firstIndex = 1;
  while (firstIndex < southLayer.length) firstIndex <<= 1;
  var treeSize = 2 * firstIndex - 1;
  firstIndex -= 1;
  var tree = _.map(new Array(treeSize), function() { return 0; });

  // Calculate the weighted crossings
  var cc = 0;
  _.forEach(southEntries.forEach(function(entry) {
    var index = entry.pos + firstIndex;
    tree[index] += entry.weight;
    var weightSum = 0;
    while (index > 0) {
      if (index % 2) {
        weightSum += tree[index + 1];
      }
      index = (index - 1) >> 1;
      tree[index] += entry.weight;
    }
    cc += entry.weight * weightSum;
  }));

  return cc;
}
