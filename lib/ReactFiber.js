/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiber
 * 
 */

'use strict';

var ReactTypeOfWork = require('./ReactTypeOfWork');
var IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent;
var ClassComponent = ReactTypeOfWork.ClassComponent;
var HostContainer = ReactTypeOfWork.HostContainer;
var HostComponent = ReactTypeOfWork.HostComponent;
var CoroutineComponent = ReactTypeOfWork.CoroutineComponent;
var YieldComponent = ReactTypeOfWork.YieldComponent;


var ReactElement = require('./ReactElement');

var _require = require('./ReactPriorityLevel');

var NoWork = _require.NoWork;

// An Instance is shared between all versions of a component. We can easily
// break this out into a separate object to avoid copying so much to the
// alternate versions of the tree. We put this on a single object for now to
// minimize the number of objects created during the initial render.


// Conceptual aliases
// parent : Instance -> return The parent happens to be the same as the
// return fiber since we've merged the fiber and instance.

// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.

// Conceptual aliases
// workInProgress : Fiber ->  alternate The alternate used for reuse happens
// to be the same as work in progress.

var createFiber = function (tag, key) {
  return {

    // Instance

    tag: tag,

    key: key,

    type: null,

    stateNode: null,

    // Fiber

    'return': null,

    child: null,
    sibling: null,

    ref: null,

    pendingProps: null,
    memoizedProps: null,
    output: null,

    nextEffect: null,
    firstEffect: null,
    lastEffect: null,

    pendingWorkPriority: NoWork,

    hasWorkInProgress: false,

    alternate: null

  };
};

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

// This is used to create an alternate fiber to do work on.
exports.cloneFiber = function (fiber, priorityLevel) {
  // We use a double buffering pooling technique because we know that we'll only
  // ever need at most two versions of a tree. We pool the "other" unused node
  // that we're free to reuse. This is lazily created to avoid allocating extra
  // objects for things that are never updated. It also allow us to reclaim the
  // extra memory if needed.
  var alt = fiber.alternate;
  if (alt) {
    alt.stateNode = fiber.stateNode;
    alt.child = fiber.child;
    alt.sibling = fiber.sibling;
    alt.ref = alt.ref;
    alt.pendingProps = fiber.pendingProps;
    alt.pendingWorkPriority = priorityLevel;

    // Whenever we clone, we do so to get a new work in progress.
    // This ensures that we've reset these in the new tree.
    alt.nextEffect = null;
    alt.firstEffect = null;
    alt.lastEffect = null;

    return alt;
  }

  // This should not have an alternate already
  alt = createFiber(fiber.tag, fiber.key);
  alt.type = fiber.type;
  alt.stateNode = fiber.stateNode;
  alt.child = fiber.child;
  alt.sibling = fiber.sibling;
  alt.ref = alt.ref;
  alt.pendingWorkPriority = priorityLevel;

  alt.alternate = fiber;
  fiber.alternate = alt;
  return alt;
};

exports.createHostContainerFiber = function () {
  var fiber = createFiber(HostContainer, null);
  return fiber;
};

exports.createFiberFromElement = function (element, priorityLevel) {
  var fiber = exports.createFiberFromElementType(element.type, element.key);
  fiber.pendingProps = element.props;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromElementType = function (type, key) {
  var fiber = void 0;
  if (typeof type === 'function') {
    fiber = shouldConstruct(type) ? createFiber(ClassComponent, key) : createFiber(IndeterminateComponent, key);
    fiber.type = type;
  } else if (typeof type === 'string') {
    fiber = createFiber(HostComponent, key);
    fiber.type = type;
  } else if (typeof type === 'object' && type !== null) {
    // Currently assumed to be a continuation and therefore is a fiber already.
    fiber = type;
  } else {
    throw new Error('Unknown component type: ' + typeof type);
  }
  return fiber;
};

exports.createFiberFromCoroutine = function (coroutine, priorityLevel) {
  var fiber = createFiber(CoroutineComponent, coroutine.key);
  fiber.type = coroutine.handler;
  fiber.pendingProps = coroutine;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromYield = function (yieldNode, priorityLevel) {
  var fiber = createFiber(YieldComponent, yieldNode.key);
  fiber.pendingProps = {};
  return fiber;
};