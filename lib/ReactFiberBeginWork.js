/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberBeginWork
 * 
 */

'use strict';

var ReactChildFiber = require('./ReactChildFiber');
var ReactTypeOfWork = require('./ReactTypeOfWork');
var IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent;
var FunctionalComponent = ReactTypeOfWork.FunctionalComponent;
var ClassComponent = ReactTypeOfWork.ClassComponent;
var HostContainer = ReactTypeOfWork.HostContainer;
var HostComponent = ReactTypeOfWork.HostComponent;
var CoroutineComponent = ReactTypeOfWork.CoroutineComponent;
var CoroutineHandlerPhase = ReactTypeOfWork.CoroutineHandlerPhase;
var YieldComponent = ReactTypeOfWork.YieldComponent;

var _require = require('./ReactPriorityLevel');

var NoWork = _require.NoWork;
var OffscreenPriority = _require.OffscreenPriority;

var _require2 = require('./ReactFiberPendingWork');

var findNextUnitOfWorkAtPriority = _require2.findNextUnitOfWorkAtPriority;


module.exports = function (config) {

  function reconcileChildren(current, workInProgress, nextChildren) {
    var priority = workInProgress.pendingWorkPriority;
    workInProgress.child = ReactChildFiber.reconcileChildFibers(workInProgress, current ? current.child : null, nextChildren, priority);
  }

  function updateFunctionalComponent(current, workInProgress) {
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;
    console.log('update fn:', fn.name);
    var nextChildren = fn(props);
    reconcileChildren(current, workInProgress, nextChildren);
    workInProgress.pendingWorkPriority = NoWork;
  }

  function updateHostComponent(current, workInProgress) {
    console.log('host component', workInProgress.type, typeof workInProgress.pendingProps.children === 'string' ? workInProgress.pendingProps.children : '');

    var nextChildren = workInProgress.pendingProps.children;

    var priority = workInProgress.pendingWorkPriority;
    if (workInProgress.pendingProps.hidden && priority !== OffscreenPriority) {
      // If this host component is hidden, we can reconcile its children at
      // the lowest priority and bail out from this particular pass. Unless, we're
      // currently reconciling the lowest priority.
      workInProgress.child = ReactChildFiber.reconcileChildFibers(workInProgress, current ? current.child : null, nextChildren, OffscreenPriority);
      workInProgress.pendingWorkPriority = OffscreenPriority;
      return null;
    } else {
      workInProgress.child = ReactChildFiber.reconcileChildFibers(workInProgress, current ? current.child : null, nextChildren, priority);
      workInProgress.pendingWorkPriority = NoWork;
      return workInProgress.child;
    }
  }

  function mountIndeterminateComponent(current, workInProgress) {
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;
    var value = fn(props);
    if (typeof value === 'object' && value && typeof value.render === 'function') {
      console.log('performed work on class:', fn.name);
      // Proceed under the assumption that this is a class instance
      workInProgress.tag = ClassComponent;
      if (workInProgress.alternate) {
        workInProgress.alternate.tag = ClassComponent;
      }
    } else {
      console.log('performed work on fn:', fn.name);
      // Proceed under the assumption that this is a functional component
      workInProgress.tag = FunctionalComponent;
      if (workInProgress.alternate) {
        workInProgress.alternate.tag = FunctionalComponent;
      }
    }
    reconcileChildren(current, workInProgress, value);
    workInProgress.pendingWorkPriority = NoWork;
  }

  function updateCoroutineComponent(current, workInProgress) {
    var coroutine = workInProgress.pendingProps;
    if (!coroutine) {
      throw new Error('Should be resolved by now');
    }
    console.log('begin coroutine', workInProgress.type.name);
    reconcileChildren(current, workInProgress, coroutine.children);
    workInProgress.pendingWorkPriority = NoWork;
  }

  function reuseChildren(returnFiber, firstChild) {
    // TODO: None of this should be necessary if structured better.
    // The returnFiber pointer only needs to be updated when we walk into this child
    // which we don't do right now. If the pending work priority indicated only
    // if a child has work rather than if the node has work, then we would know
    // by a single lookup on workInProgress rather than having to go through
    // each child.
    var child = firstChild;
    do {
      // Update the returnFiber of the child to the newest fiber.
      child['return'] = returnFiber;
      // Retain the priority if there's any work left to do in the children.
      if (child.pendingWorkPriority !== NoWork && (returnFiber.pendingWorkPriority === NoWork || returnFiber.pendingWorkPriority > child.pendingWorkPriority)) {
        returnFiber.pendingWorkPriority = child.pendingWorkPriority;
      }
    } while (child = child.sibling);
  }

  function beginWork(current, workInProgress) {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    if (current && workInProgress.pendingProps === current.memoizedProps) {
      // The most likely scenario is that the previous copy of the tree contains
      // the same props as the new one. In that case, we can just copy the output
      // and children from that node.
      workInProgress.memoizedProps = workInProgress.pendingProps;
      workInProgress.output = current.output;
      var priorityLevel = workInProgress.pendingWorkPriority;
      workInProgress.pendingProps = null;
      workInProgress.pendingWorkPriority = NoWork;
      workInProgress.stateNode = current.stateNode;
      if (current.child) {
        // If we bail out but still has work with the current priority in this
        // subtree, we need to go find it right now. If we don't, we won't flush
        // it until the next tick.
        workInProgress.child = current.child;
        reuseChildren(workInProgress, workInProgress.child);
        if (workInProgress.pendingWorkPriority <= priorityLevel) {
          // TODO: This passes the current node and reads the priority level and
          // pending props from that. We want it to read our priority level and
          // pending props from the work in progress. Needs restructuring.
          return findNextUnitOfWorkAtPriority(workInProgress.alternate, priorityLevel);
        } else {
          return null;
        }
      } else {
        workInProgress.child = null;
        return null;
      }
    }

    if (!workInProgress.hasWorkInProgress && workInProgress.pendingProps === workInProgress.memoizedProps && workInProgress.pendingWorkPriority === NoWork) {
      // If we started this work before, and finished it, or if we're in a
      // ping-pong update scenario, this version could already be what we're
      // looking for. In that case, we should be able to just bail out.
      workInProgress.pendingProps = null;
      // TODO: We should be able to bail out if there is remaining work at a lower
      // priority too. However, I don't know if that is safe or even better since
      // the other tree could've potentially finished that work.
      return null;
    }

    workInProgress.hasWorkInProgress = true;

    switch (workInProgress.tag) {
      case IndeterminateComponent:
        mountIndeterminateComponent(current, workInProgress);
        return workInProgress.child;
      case FunctionalComponent:
        updateFunctionalComponent(current, workInProgress);
        return workInProgress.child;
      case ClassComponent:
        console.log('class component', workInProgress.pendingProps.type.name);
        return workInProgress.child;
      case HostContainer:
        reconcileChildren(current, workInProgress, workInProgress.pendingProps);
        // A yield component is just a placeholder, we can just run through the
        // next one immediately.
        workInProgress.pendingWorkPriority = NoWork;
        if (workInProgress.child) {
          return beginWork(workInProgress.child.alternate, workInProgress.child);
        }
        return null;
      case HostComponent:
        return updateHostComponent(current, workInProgress);
      case CoroutineHandlerPhase:
        // This is a restart. Reset the tag to the initial phase.
        workInProgress.tag = CoroutineComponent;
      // Intentionally fall through since this is now the same.
      case CoroutineComponent:
        updateCoroutineComponent(current, workInProgress);
        // This doesn't take arbitrary time so we could synchronously just begin
        // eagerly do the work of workInProgress.child as an optimization.
        if (workInProgress.child) {
          return beginWork(workInProgress.child.alternate, workInProgress.child);
        }
        return workInProgress.child;
      case YieldComponent:
        // A yield component is just a placeholder, we can just run through the
        // next one immediately.
        workInProgress.pendingWorkPriority = NoWork;
        if (workInProgress.sibling) {
          return beginWork(workInProgress.sibling.alternate, workInProgress.sibling);
        }
        return null;
      default:
        throw new Error('Unknown unit of work tag');
    }
  }

  return {
    beginWork: beginWork
  };
};