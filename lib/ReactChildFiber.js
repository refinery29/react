/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactChildFiber
 * 
 */

'use strict';

var _require = require('./ReactElement');

var REACT_ELEMENT_TYPE = _require.REACT_ELEMENT_TYPE;

var _require2 = require('./ReactCoroutine');

var REACT_COROUTINE_TYPE = _require2.REACT_COROUTINE_TYPE;
var REACT_YIELD_TYPE = _require2.REACT_YIELD_TYPE;


var ReactFiber = require('./ReactFiber');
var ReactReifiedYield = require('./ReactReifiedYield');

function createSubsequentChild(returnFiber, existingChild, previousSibling, newChildren, priority) {
  if (typeof newChildren !== 'object' || newChildren === null) {
    return previousSibling;
  }

  switch (newChildren.$$typeof) {
    case REACT_ELEMENT_TYPE:
      {
        var element = newChildren;
        if (existingChild && element.type === existingChild.type && element.key === existingChild.key) {
          // TODO: This is not sufficient since previous siblings could be new.
          // Will fix reconciliation properly later.
          var clone = ReactFiber.cloneFiber(existingChild, priority);
          clone.pendingProps = element.props;
          clone.child = existingChild.child;
          clone.sibling = null;
          clone['return'] = returnFiber;
          previousSibling.sibling = clone;
          return clone;
        }
        var child = ReactFiber.createFiberFromElement(element, priority);
        previousSibling.sibling = child;
        child['return'] = returnFiber;
        return child;
      }

    case REACT_COROUTINE_TYPE:
      {
        var coroutine = newChildren;
        var _child = ReactFiber.createFiberFromCoroutine(coroutine, priority);
        previousSibling.sibling = _child;
        _child['return'] = returnFiber;
        return _child;
      }

    case REACT_YIELD_TYPE:
      {
        var yieldNode = newChildren;
        var reifiedYield = ReactReifiedYield.createReifiedYield(yieldNode);
        var _child2 = ReactFiber.createFiberFromYield(yieldNode, priority);
        _child2.output = reifiedYield;
        previousSibling.sibling = _child2;
        _child2['return'] = returnFiber;
        return _child2;
      }
  }

  if (Array.isArray(newChildren)) {
    var prev = previousSibling;
    var existing = existingChild;
    for (var i = 0; i < newChildren.length; i++) {
      prev = createSubsequentChild(returnFiber, existing, prev, newChildren[i], priority);
      if (prev && existing) {
        // TODO: This is not correct because there could've been more
        // than one sibling consumed but I don't want to return a tuple.
        existing = existing.sibling;
      }
    }
    return prev;
  } else {
    console.log('Unknown child', newChildren);
    return previousSibling;
  }
}

function createFirstChild(returnFiber, existingChild, newChildren, priority) {
  if (typeof newChildren !== 'object' || newChildren === null) {
    return null;
  }

  switch (newChildren.$$typeof) {
    case REACT_ELEMENT_TYPE:
      {
        var element = newChildren;
        if (existingChild && element.type === existingChild.type && element.key === existingChild.key) {
          // Get the clone of the existing fiber.
          var clone = ReactFiber.cloneFiber(existingChild, priority);
          clone.pendingProps = element.props;
          clone.child = existingChild.child;
          clone.sibling = null;
          clone['return'] = returnFiber;
          return clone;
        }
        var child = ReactFiber.createFiberFromElement(element, priority);
        child['return'] = returnFiber;
        return child;
      }

    case REACT_COROUTINE_TYPE:
      {
        var coroutine = newChildren;
        var _child3 = ReactFiber.createFiberFromCoroutine(coroutine, priority);
        _child3['return'] = returnFiber;
        return _child3;
      }

    case REACT_YIELD_TYPE:
      {
        // A yield results in a fragment fiber whose output is the continuation.
        // TODO: When there is only a single child, we can optimize this to avoid
        // the fragment.
        var yieldNode = newChildren;
        var reifiedYield = ReactReifiedYield.createReifiedYield(yieldNode);
        var _child4 = ReactFiber.createFiberFromYield(yieldNode, priority);
        _child4.output = reifiedYield;
        _child4['return'] = returnFiber;
        return _child4;
      }
  }

  if (Array.isArray(newChildren)) {
    var first = null;
    var prev = null;
    var existing = existingChild;
    for (var i = 0; i < newChildren.length; i++) {
      if (prev == null) {
        prev = createFirstChild(returnFiber, existing, newChildren[i], priority);
        first = prev;
      } else {
        prev = createSubsequentChild(returnFiber, existing, prev, newChildren[i], priority);
      }
      if (prev && existing) {
        // TODO: This is not correct because there could've been more
        // than one sibling consumed but I don't want to return a tuple.
        existing = existing.sibling;
      }
    }
    return first;
  } else {
    console.log('Unknown child', newChildren);
    return null;
  }
}

// TODO: This API won't work because we'll need to transfer the side-effects of
// unmounting children to the returnFiber.
exports.reconcileChildFibers = function (returnFiber, currentFirstChild, newChildren, priority) {
  return createFirstChild(returnFiber, currentFirstChild, newChildren, priority);
};