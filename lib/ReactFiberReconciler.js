/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberReconciler
 * 
 */

'use strict';

var _require = require('./ReactFiberRoot');

var createFiberRoot = _require.createFiberRoot;

var ReactFiberScheduler = require('./ReactFiberScheduler');

var _require2 = require('./ReactPriorityLevel');

var LowPriority = _require2.LowPriority;


module.exports = function (config) {
  var _ReactFiberScheduler = ReactFiberScheduler(config);

  var scheduleLowPriWork = _ReactFiberScheduler.scheduleLowPriWork;


  return {
    mountContainer: function (element, containerInfo) {
      var root = createFiberRoot(containerInfo);
      var container = root.current;
      // TODO: Use pending work/state instead of props.
      container.pendingProps = element;
      container.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(root);

      // It may seem strange that we don't return the root here, but that will
      // allow us to have containers that are in the middle of the tree instead
      // of being roots.
      return container;
    },
    updateContainer: function (element, container) {
      // TODO: If this is a nested container, this won't be the root.
      var root = container.stateNode;
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = element;
      root.current.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(root);
    },
    unmountContainer: function (container) {
      // TODO: If this is a nested container, this won't be the root.
      var root = container.stateNode;
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = [];
      root.current.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(root);
    },
    getPublicRootInstance: function (container) {
      return null;
    }
  };
};