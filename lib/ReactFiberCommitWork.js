/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberCommitWork
 * 
 */

'use strict';

var ReactTypeOfWork = require('./ReactTypeOfWork');
var ClassComponent = ReactTypeOfWork.ClassComponent;
var HostContainer = ReactTypeOfWork.HostContainer;
var HostComponent = ReactTypeOfWork.HostComponent;


module.exports = function (config) {

  var updateContainer = config.updateContainer;
  var commitUpdate = config.commitUpdate;

  function commitWork(finishedWork) {
    switch (finishedWork.tag) {
      case ClassComponent:
        {
          // TODO: Fire componentDidMount/componentDidUpdate, update refs
          return;
        }
      case HostContainer:
        {
          // TODO: Attach children to root container.
          var children = finishedWork.output;
          var root = finishedWork.stateNode;
          var containerInfo = root.containerInfo;
          updateContainer(containerInfo, children);
          return;
        }
      case HostComponent:
        {
          if (finishedWork.stateNode == null || !finishedWork.alternate) {
            throw new Error('This should only be done during updates.');
          }
          // Commit the work prepared earlier.
          var child = finishedWork.child;
          var _children = child && !child.sibling ? child.output : child;
          var newProps = finishedWork.memoizedProps;
          var current = finishedWork.alternate;
          var oldProps = current.memoizedProps;
          var instance = finishedWork.stateNode;
          commitUpdate(instance, oldProps, newProps, _children);
          return;
        }
      default:
        throw new Error('This unit of work tag should not have side-effects.');
    }
  }

  return {
    commitWork: commitWork
  };
};