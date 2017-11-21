import { arrayForEach, arrayIndexOf, arrayRemoveItem, canSetPrototype, compareArrays, createSymbolOrString, debounce, extend, findMovesInArrayComparison, hasPrototype, objectForEach, options, setPrototypeOf, setPrototypeOfOrExtend, stringifyJson, throttle } from './tko.utils.js';

//
//  Defer Updates
//  ===
//
function deferUpdates(target) {
    if (!target._deferUpdates) {
        target._deferUpdates = true;
        target.limit(function (callback) {
            var handle;
            return function () {
                tasks.cancel(handle);
                handle = tasks.schedule(callback);
                target.notifySubscribers(undefined, 'dirty');
            };
        });
    }
}

//
// Observable extenders
// ---
//
var primitiveTypes = {
  'undefined': 1, 'boolean': 1, 'number': 1, 'string': 1
};

function valuesArePrimitiveAndEqual (a, b) {
  var oldValueIsPrimitive = (a === null) || (typeof (a) in primitiveTypes);
  return oldValueIsPrimitive ? (a === b) : false
}

function applyExtenders (requestedExtenders) {
  var target = this;
  if (requestedExtenders) {
    objectForEach(requestedExtenders, function (key, value) {
      var extenderHandler = extenders[key];
      if (typeof extenderHandler === 'function') {
        target = extenderHandler(target, value) || target;
      } else {
        options.onError(new Error('Extender not found: ' + key));
      }
    });
  }
  return target
}

/*
                --- DEFAULT EXTENDERS ---
 */

// Change when notifications are published.
function notify (target, notifyWhen) {
  target.equalityComparer = notifyWhen == 'always' ?
        null :  // null equalityComparer means to always notify
        valuesArePrimitiveAndEqual;
}

function deferred (target, option) {
  if (option !== true) {
    throw new Error('The \'deferred\' extender only accepts the value \'true\', because it is not supported to turn deferral off once enabled.')
  }
  deferUpdates(target);
}

function rateLimit (target, options$$1) {
  var timeout, method, limitFunction;

  if (typeof options$$1 === 'number') {
    timeout = options$$1;
  } else {
    timeout = options$$1.timeout;
    method = options$$1.method;
  }

    // rateLimit supersedes deferred updates
  target._deferUpdates = false;

  limitFunction = method == 'notifyWhenChangesStop' ? debounce : throttle;

  target.limit(function (callback) {
    return limitFunction(callback, timeout)
  });
}

var extenders = {
  notify: notify,
  deferred: deferred,
  rateLimit: rateLimit
};

/* eslint no-cond-assign: 0 */
function subscription (target, callback, disposeCallback) {
  this._target = target;
  this.callback = callback;
  this.disposeCallback = disposeCallback;
  this.isDisposed = false;
  window.count++;
}

subscription.prototype.dispose = function () {
  this.isDisposed = true;
  this.disposeCallback();
  window.count--;
};

function subscribable () {
  setPrototypeOfOrExtend(this, ko_subscribable_fn);
  ko_subscribable_fn.init(this);
}

var defaultEvent = 'change';

var ko_subscribable_fn = {
  init (instance) {
    instance._subscriptions = {};
    instance._versionNumber = 1;
  },

  subscribe (callback, callbackTarget, event) {
    var self = this;

    event = event || defaultEvent;
    var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

    var subscriptionInstance = new subscription(self, boundCallback, function () {
      arrayRemoveItem(self._subscriptions[event], subscriptionInstance);
      if (self.afterSubscriptionRemove) {
        self.afterSubscriptionRemove(event);
      }
    });

    if (self.beforeSubscriptionAdd) {
      self.beforeSubscriptionAdd(event);
    }

    if (!self._subscriptions[event]) {
      self._subscriptions[event] = [];
    }
    self._subscriptions[event].push(subscriptionInstance);

    return subscriptionInstance
  },

  notifySubscribers (valueToNotify, event) {
    event = event || defaultEvent;
    if (event === defaultEvent) {
      this.updateVersion();
    }
    if (this.hasSubscriptionsForEvent(event)) {
      try {
        begin(); // Begin suppressing dependency detection (by setting the top frame to undefined)
        for (var a = this._subscriptions[event].slice(0), i = 0, subscriptionInstance; subscriptionInstance = a[i]; ++i) {
                    // In case a subscription was disposed during the arrayForEach cycle, check
                    // for isDisposed on each subscription before invoking its callback
          if (!subscriptionInstance.isDisposed) {
            subscriptionInstance.callback(valueToNotify);
          }
        }
      } finally {
        end(); // End suppressing dependency detection
      }
    }
  },

  getVersion () {
    return this._versionNumber
  },

  hasChanged (versionToCheck) {
    return this.getVersion() !== versionToCheck
  },

  updateVersion () {
    ++this._versionNumber;
  },

  hasSubscriptionsForEvent (event) {
    return this._subscriptions[event] && this._subscriptions[event].length
  },

  getSubscriptionsCount (event) {
    if (event) {
      return this._subscriptions[event] && this._subscriptions[event].length || 0
    } else {
      var total = 0;
      objectForEach(this._subscriptions, function (eventName, subscriptions) {
        if (eventName !== 'dirty') {
          total += subscriptions.length;
        }
      });
      return total
    }
  },

  isDifferent (oldValue, newValue) {
    return !this.equalityComparer ||
               !this.equalityComparer(oldValue, newValue)
  },

  once (cb) {
    const subs = this.subscribe((nv) => {
      subs.dispose();
      cb(nv);
    });
  },

  when (test, returnValue) {
    const current = this.peek();
    const givenRv = arguments.length > 1;
    const testFn = typeof test === 'function' ? test : v => v === test;
    if (testFn(current)) {
      return options.Promise.resolve(givenRv ? returnValue : current)
    }
    return new options.Promise((resolve, reject) => {
      const subs = this.subscribe(newValue => {
        if (testFn(newValue)) {
          subs.dispose();
          resolve(givenRv ? returnValue : newValue);
        }
      });
    })
  },

  yet (test, ...args) {
    const testFn = typeof test === 'function' ? test : v => v === test;
    const negated = v => !testFn(v);
    return this.when(negated, ...args)
  },

  next () { return new Promise(resolve => this.once(resolve)) },

  extend: applyExtenders
};

// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
if (canSetPrototype) {
  setPrototypeOf(ko_subscribable_fn, Function.prototype);
}

subscribable.fn = ko_subscribable_fn;

function isSubscribable (instance) {
  return instance != null && typeof instance.subscribe === 'function' && typeof instance.notifySubscribers === 'function'
}

//
// dependencyDetection
// ---
//
// In KO 3.x, dependencyDetection was also known as computedContext.
//
const outerFrames = [];
let currentFrame;
let lastId = 0;

// Return a unique ID that can be assigned to an observable for dependency tracking.
// Theoretically, you could eventually overflow the number storage size, resulting
// in duplicate IDs. But in JavaScript, the largest exact integral value is 2^53
// or 9,007,199,254,740,992. If you created 1,000,000 IDs per second, it would
// take over 285 years to reach that number.
// Reference http://blog.vjeux.com/2010/javascript/javascript-max_int-number-limits.html
function getId () {
  return ++lastId
}

function begin (options$$1) {
  outerFrames.push(currentFrame);
  currentFrame = options$$1;
}

function end () {
  currentFrame = outerFrames.pop();
}

function registerDependency (subscribable$$1) {
  if (currentFrame) {
    if (!isSubscribable(subscribable$$1)) { throw new Error('Only subscribable things can act as dependencies') }
    currentFrame.callback.call(currentFrame.callbackTarget, subscribable$$1, subscribable$$1._id || (subscribable$$1._id = getId()));
  }
}

function ignore (callback, callbackTarget, callbackArgs) {
  try {
    begin();
    return callback.apply(callbackTarget, callbackArgs || [])
  } finally {
    end();
  }
}

function getDependenciesCount () {
  if (currentFrame) { return currentFrame.computed.getDependenciesCount() }
}

function isInitial () {
  if (currentFrame) { return currentFrame.isInitial }
}




var dependencyDetection = Object.freeze({
	begin: begin,
	end: end,
	registerDependency: registerDependency,
	ignore: ignore,
	getDependenciesCount: getDependenciesCount,
	isInitial: isInitial,
	ignoreDependencies: ignore
});

//
//  Observable values
//  ---
//
var observableLatestValue = createSymbolOrString('_latestValue');

function observable (initialValue) {
  function Observable () {
    if (arguments.length > 0) {
            // Write
            // Ignore writes if the value hasn't changed
      if (Observable.isDifferent(Observable[observableLatestValue], arguments[0])) {
        Observable.valueWillMutate();
        Observable[observableLatestValue] = arguments[0];
        Observable.valueHasMutated();
      }
      return this // Permits chained assignments
    } else {
            // Read
      registerDependency(Observable); // The caller only needs to be notified of changes if they did a "read" operation
      return Observable[observableLatestValue]
    }
  }

  Observable[observableLatestValue] = initialValue;

    // Inherit from 'subscribable'
  if (!canSetPrototype) {
        // 'subscribable' won't be on the prototype chain unless we put it there directly
    extend(Observable, subscribable.fn);
  }
  subscribable.fn.init(Observable);

    // Inherit from 'observable'
  setPrototypeOfOrExtend(Observable, observable.fn);

  if (options.deferUpdates) {
    deferUpdates(Observable);
  }

  return Observable
}

// Define prototype for observables
observable.fn = {
  equalityComparer: valuesArePrimitiveAndEqual,
  peek () { return this[observableLatestValue] },
  valueHasMutated () { this.notifySubscribers(this[observableLatestValue]); },
  valueWillMutate () {
    this.notifySubscribers(this[observableLatestValue], 'beforeChange');
  },
  then (res, rej) { try { res(this()); } catch (e) { rej(e); } },
};

// Moved out of "limit" to avoid the extra closure
function limitNotifySubscribers (value, event) {
  if (!event || event === defaultEvent) {
    this._limitChange(value);
  } else if (event === 'beforeChange') {
    this._limitBeforeChange(value);
  } else {
    this._origNotifySubscribers(value, event);
  }
}

// Add `limit` function to the subscribable prototype
subscribable.fn.limit = function limit (limitFunction) {
  var self = this;
  var selfIsObservable = isObservable(self);
  var beforeChange = 'beforeChange';
  var ignoreBeforeChange, previousValue, pendingValue;

  if (!self._origNotifySubscribers) {
    self._origNotifySubscribers = self.notifySubscribers;
    self.notifySubscribers = limitNotifySubscribers;
  }

  var finish = limitFunction(function () {
    self._notificationIsPending = false;

        // If an observable provided a reference to itself, access it to get the latest value.
        // This allows computed observables to delay calculating their value until needed.
    if (selfIsObservable && pendingValue === self) {
      pendingValue = self();
    }
    ignoreBeforeChange = false;
    if (self.isDifferent(previousValue, pendingValue)) {
      self._origNotifySubscribers(previousValue = pendingValue);
    }
  });

  self._limitChange = function (value) {
    self._notificationIsPending = ignoreBeforeChange = true;
    pendingValue = value;
    finish();
  };
  self._limitBeforeChange = function (value) {
    if (!ignoreBeforeChange) {
      previousValue = value;
      self._origNotifySubscribers(value, beforeChange);
    }
  };
};

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the observable constructor
if (canSetPrototype) {
  setPrototypeOf(observable.fn, subscribable.fn);
}

var protoProperty = observable.protoProperty = options.protoProperty;
observable.fn[protoProperty] = observable;

function isObservable (instance) {
  return hasPrototype(instance, observable)
}

function unwrap (value) {
  return isObservable(value) ? value() : value
}

function peek (value) {
  return isObservable(value) ? value.peek() : value
}

function isWriteableObservable (instance) {
    // Observable
  if ((typeof instance === 'function') && instance[protoProperty] === observable) {
    return true
  }
    // Writeable dependent observable
  if ((typeof instance === 'function') /* && (instance[protoProperty] === ko.dependentObservable) */ && (instance.hasWriteFunction)) {
    return true
  }
    // Anything else
  return false
}

//
// Observable Array - Change Tracking Extender
// ---
//
/* eslint no-fallthrough: 0*/

var arrayChangeEventName = 'arrayChange';


function trackArrayChanges(target, options$$1) {
    // Use the provided options--each call to trackArrayChanges overwrites the previously set options
    target.compareArrayOptions = {};
    if (options$$1 && typeof options$$1 == "object") {
        extend(target.compareArrayOptions, options$$1);
    }
    target.compareArrayOptions.sparse = true;

    // Only modify the target observable once
    if (target.cacheDiffForKnownOperation) {
        return;
    }
    var trackingChanges = false,
        cachedDiff = null,
        arrayChangeSubscription,
        pendingNotifications = 0,
        underlyingBeforeSubscriptionAddFunction = target.beforeSubscriptionAdd,
        underlyingAfterSubscriptionRemoveFunction = target.afterSubscriptionRemove;

    // Watch "subscribe" calls, and for array change events, ensure change tracking is enabled
    target.beforeSubscriptionAdd = function (event) {
        if (underlyingBeforeSubscriptionAddFunction)
            underlyingBeforeSubscriptionAddFunction.call(target, event);
        if (event === arrayChangeEventName) {
            trackChanges();
        }
    };

    // Watch "dispose" calls, and for array change events, ensure change tracking is disabled when all are disposed
    target.afterSubscriptionRemove = function (event) {
        if (underlyingAfterSubscriptionRemoveFunction)
            underlyingAfterSubscriptionRemoveFunction.call(target, event);
        if (event === arrayChangeEventName && !target.hasSubscriptionsForEvent(arrayChangeEventName)) {
            if (arrayChangeSubscription) {
                arrayChangeSubscription.dispose();
            }
            arrayChangeSubscription = null;
            trackingChanges = false;
        }
    };

    function trackChanges() {
        // Calling 'trackChanges' multiple times is the same as calling it once
        if (trackingChanges) {
            return;
        }

        trackingChanges = true;

        // Intercept "notifySubscribers" to track how many times it was called.
        var underlyingNotifySubscribersFunction = target['notifySubscribers'];
        target['notifySubscribers'] = function(valueToNotify, event) {
            if (!event || event === defaultEvent) {
                ++pendingNotifications;
            }
            return underlyingNotifySubscribersFunction.apply(this, arguments);
        };

        // Each time the array changes value, capture a clone so that on the next
        // change it's possible to produce a diff
        var previousContents = [].concat(target.peek() || []);
        cachedDiff = null;
        arrayChangeSubscription = target.subscribe(function(currentContents) {
            // Make a copy of the current contents and ensure it's an array
            currentContents = [].concat(currentContents || []);

            // Compute the diff and issue notifications, but only if someone is listening
            if (target.hasSubscriptionsForEvent(arrayChangeEventName)) {
                var changes = getChanges(previousContents, currentContents);
            }

            // Eliminate references to the old, removed items, so they can be GCed
            previousContents = currentContents;
            cachedDiff = null;
            pendingNotifications = 0;

            if (changes && changes.length) {
                target['notifySubscribers'](changes, arrayChangeEventName);
            }
        });
    }

    function getChanges(previousContents, currentContents) {
        // We try to re-use cached diffs.
        // The scenarios where pendingNotifications > 1 are when using rate-limiting or the Deferred Updates
        // plugin, which without this check would not be compatible with arrayChange notifications. Normally,
        // notifications are issued immediately so we wouldn't be queueing up more than one.
        if (!cachedDiff || pendingNotifications > 1) {
            cachedDiff = trackArrayChanges.compareArrays(previousContents, currentContents, target.compareArrayOptions);
        }

        return cachedDiff;
    }

    target.cacheDiffForKnownOperation = function(rawArray, operationName, args) {
        var index, argsIndex;
        // Only run if we're currently tracking changes for this observable array
        // and there aren't any pending deferred notifications.
        if (!trackingChanges || pendingNotifications) {
            return;
        }
        var diff = [],
            arrayLength = rawArray.length,
            argsLength = args.length,
            offset = 0;

        function pushDiff(status, value, index) {
            return diff[diff.length] = { 'status': status, 'value': value, 'index': index };
        }
        switch (operationName) {
        case 'push':
            offset = arrayLength;
        case 'unshift':
            for (index = 0; index < argsLength; index++) {
                pushDiff('added', args[index], offset + index);
            }
            break;

        case 'pop':
            offset = arrayLength - 1;
        case 'shift':
            if (arrayLength) {
                pushDiff('deleted', rawArray[offset], offset);
            }
            break;

        case 'splice':
            // Negative start index means 'from end of array'. After that we clamp to [0...arrayLength].
            // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
            var startIndex = Math.min(Math.max(0, args[0] < 0 ? arrayLength + args[0] : args[0]), arrayLength),
                endDeleteIndex = argsLength === 1 ? arrayLength : Math.min(startIndex + (args[1] || 0), arrayLength),
                endAddIndex = startIndex + argsLength - 2,
                endIndex = Math.max(endDeleteIndex, endAddIndex),
                additions = [], deletions = [];
            for (index = startIndex, argsIndex = 2; index < endIndex; ++index, ++argsIndex) {
                if (index < endDeleteIndex)
                    deletions.push(pushDiff('deleted', rawArray[index], index));
                if (index < endAddIndex)
                    additions.push(pushDiff('added', args[argsIndex], index));
            }
            findMovesInArrayComparison(deletions, additions);
            break;

        default:
            return;
        }
        cachedDiff = diff;
    };
}


// Expose compareArrays for testing.
trackArrayChanges.compareArrays = compareArrays;


// Add the trackArrayChanges extender so we can use
// obs.extend({ trackArrayChanges: true })
extenders.trackArrayChanges = trackArrayChanges;

//
// Observable Arrays
// ===
//
function observableArray (initialValues) {
  initialValues = initialValues || [];

  if (typeof initialValues !== 'object' || !('length' in initialValues)) { throw new Error('The argument passed when initializing an observable array must be an array, or null, or undefined.') }

  var result = observable(initialValues);
  setPrototypeOfOrExtend(result, observableArray.fn);
  trackArrayChanges(result);
        // ^== result.extend({ trackArrayChanges: true })
  return result
}

observableArray.fn = {
  remove: function (valueOrPredicate) {
    var underlyingArray = this.peek();
    var removedValues = [];
    var predicate = typeof valueOrPredicate === 'function' && !isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate };
    for (var i = 0; i < underlyingArray.length; i++) {
      var value = underlyingArray[i];
      if (predicate(value)) {
        if (removedValues.length === 0) {
          this.valueWillMutate();
        }
        removedValues.push(value);
        underlyingArray.splice(i, 1);
        i--;
      }
    }
    if (removedValues.length) {
      this.valueHasMutated();
    }
    return removedValues
  },

  removeAll: function (arrayOfValues) {
        // If you passed zero args, we remove everything
    if (arrayOfValues === undefined) {
      var underlyingArray = this.peek();
      var allValues = underlyingArray.slice(0);
      this.valueWillMutate();
      underlyingArray.splice(0, underlyingArray.length);
      this.valueHasMutated();
      return allValues
    }
        // If you passed an arg, we interpret it as an array of entries to remove
    if (!arrayOfValues) {
      return []
    }
    return this['remove'](function (value) {
      return arrayIndexOf(arrayOfValues, value) >= 0
    })
  },

  destroy: function (valueOrPredicate) {
    var underlyingArray = this.peek();
    var predicate = typeof valueOrPredicate === 'function' && !isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate };
    this.valueWillMutate();
    for (var i = underlyingArray.length - 1; i >= 0; i--) {
      var value = underlyingArray[i];
      if (predicate(value)) {
        underlyingArray[i]['_destroy'] = true;
      }
    }
    this.valueHasMutated();
  },

  destroyAll: function (arrayOfValues) {
        // If you passed zero args, we destroy everything
    if (arrayOfValues === undefined) { return this.destroy(function () { return true }) }

        // If you passed an arg, we interpret it as an array of entries to destroy
    if (!arrayOfValues) {
      return []
    }
    return this.destroy(function (value) {
      return arrayIndexOf(arrayOfValues, value) >= 0
    })
  },

  indexOf: function (item) {
    var underlyingArray = this();
    return arrayIndexOf(underlyingArray, item)
  },

  replace: function (oldItem, newItem) {
    var index = this.indexOf(oldItem);
    if (index >= 0) {
      this.valueWillMutate();
      this.peek()[index] = newItem;
      this.valueHasMutated();
    }
  }
};

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observableArray constructor
if (canSetPrototype) {
  setPrototypeOf(observableArray.fn, observable.fn);
}

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
arrayForEach(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (methodName) {
  observableArray.fn[methodName] = function () {
        // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
        // (for consistency with mutating regular observables)
    var underlyingArray = this.peek();
    this.valueWillMutate();
    this.cacheDiffForKnownOperation(underlyingArray, methodName, arguments);
    var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
    this.valueHasMutated();
        // The native sort and reverse methods return a reference to the array, but it makes more sense to return the observable array instead.
    return methodCallResult === underlyingArray ? this : methodCallResult
  };
});

// Populate ko.observableArray.fn with read-only functions from native arrays
arrayForEach(['slice'], function (methodName) {
  observableArray.fn[methodName] = function () {
    var underlyingArray = this();
    return underlyingArray[methodName].apply(underlyingArray, arguments)
  };
});

//
// Helpers
// ---
// toJS & toJSON
//
var maxNestedObservableDepth = 10; // Escape the (unlikely) pathalogical case where an observable's current value is itself (or similar reference cycle)

function toJS(rootObject) {
    if (arguments.length == 0)
        throw new Error("When calling ko.toJS, pass the object you want to convert.");

    // We just unwrap everything at every level in the object graph
    return mapJsObjectGraph(rootObject, function(valueToMap) {
        // Loop because an observable's value might in turn be another observable wrapper
        for (var i = 0; isObservable(valueToMap) && (i < maxNestedObservableDepth); i++)
            valueToMap = valueToMap();
        return valueToMap;
    });
}

function toJSON(rootObject, replacer, space) {     // replacer and space are optional
    var plainJavaScriptObject = toJS(rootObject);
    return stringifyJson(plainJavaScriptObject, replacer, space);
}

function mapJsObjectGraph(rootObject, mapInputCallback, visitedObjects) {
    visitedObjects = visitedObjects || new objectLookup();

    rootObject = mapInputCallback(rootObject);
    var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined) && (!(rootObject instanceof RegExp)) && (!(rootObject instanceof Date)) && (!(rootObject instanceof String)) && (!(rootObject instanceof Number)) && (!(rootObject instanceof Boolean));
    if (!canHaveProperties)
        return rootObject;

    var outputProperties = rootObject instanceof Array ? [] : {};
    visitedObjects.save(rootObject, outputProperties);

    visitPropertiesOrArrayEntries(rootObject, function(indexer) {
        var propertyValue = mapInputCallback(rootObject[indexer]);

        switch (typeof propertyValue) {
        case "boolean":
        case "number":
        case "string":
        case "function":
            outputProperties[indexer] = propertyValue;
            break;
        case "object":
        case "undefined":
            var previouslyMappedValue = visitedObjects.get(propertyValue);
            outputProperties[indexer] = (previouslyMappedValue !== undefined)
                ? previouslyMappedValue
                : mapJsObjectGraph(propertyValue, mapInputCallback, visitedObjects);
            break;
        }
    });

    return outputProperties;
}

function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
    if (rootObject instanceof Array) {
        for (var i = 0; i < rootObject.length; i++)
            visitorCallback(i);

        // For arrays, also respect toJSON property for custom mappings (fixes #278)
        if (typeof rootObject['toJSON'] == 'function')
            visitorCallback('toJSON');
    } else {
        for (var propertyName in rootObject) {
            visitorCallback(propertyName);
        }
    }
}

function objectLookup() {
    this.keys = [];
    this.values = [];
}

objectLookup.prototype = {
    constructor: objectLookup,
    save: function(key, value) {
        var existingIndex = arrayIndexOf(this.keys, key);
        if (existingIndex >= 0)
            this.values[existingIndex] = value;
        else {
            this.keys.push(key);
            this.values.push(value);
        }
    },
    get: function(key) {
        var existingIndex = arrayIndexOf(this.keys, key);
        return (existingIndex >= 0) ? this.values[existingIndex] : undefined;
    }
};

//
// Observables.
// ---
//
// The following are added to the root `[t]ko` object.
//

export { dependencyDetection, observable, isObservable, unwrap, peek, isWriteableObservable, isWriteableObservable as isWritableObservable, isSubscribable, subscribable, observableArray, trackArrayChanges, arrayChangeEventName, toJS, toJSON, deferUpdates, valuesArePrimitiveAndEqual, applyExtenders, extenders };
