//
// Array utilities
//
/* eslint no-cond-assign: 0 */

function arrayForEach(array, action) {
    for (var i = 0, j = array.length; i < j; i++)
        action(array[i], i);
}

function arrayIndexOf(array, item) {
    // IE9
    if (typeof Array.prototype.indexOf == "function")
        return Array.prototype.indexOf.call(array, item);
    for (var i = 0, j = array.length; i < j; i++)
        if (array[i] === item)
            return i;
    return -1;
}

function arrayFirst(array, predicate, predicateOwner) {
    for (var i = 0, j = array.length; i < j; i++)
        if (predicate.call(predicateOwner, array[i], i))
            return array[i];
    return null;
}

function arrayRemoveItem(array, itemToRemove) {
    var index = arrayIndexOf(array, itemToRemove);
    if (index > 0) {
        array.splice(index, 1);
    }
    else if (index === 0) {
        array.shift();
    }
}

function arrayGetDistinctValues(array) {
    array = array || [];
    var result = [];
    for (var i = 0, j = array.length; i < j; i++) {
        if (arrayIndexOf(result, array[i]) < 0)
            result.push(array[i]);
    }
    return result;
}

function arrayMap(array, mapping) {
    array = array || [];
    var result = [];
    for (var i = 0, j = array.length; i < j; i++)
        result.push(mapping(array[i], i));
    return result;
}

function arrayFilter(array, predicate) {
    array = array || [];
    var result = [];
    for (var i = 0, j = array.length; i < j; i++)
        if (predicate(array[i], i))
            result.push(array[i]);
    return result;
}

function arrayPushAll(array, valuesToPush) {
    if (valuesToPush instanceof Array)
        array.push.apply(array, valuesToPush);
    else
        for (var i = 0, j = valuesToPush.length; i < j; i++)
            array.push(valuesToPush[i]);
    return array;
}

function addOrRemoveItem(array, value, included) {
    var existingEntryIndex = arrayIndexOf(typeof array.peek === 'function' ? array.peek() : array, value);
    if (existingEntryIndex < 0) {
        if (included)
            array.push(value);
    } else {
        if (!included)
            array.splice(existingEntryIndex, 1);
    }
}


function makeArray(arrayLikeObject) {
    var result = [];
    for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
        result.push(arrayLikeObject[i]);
    }
    return result;
}


function range(min, max) {
    min = typeof min === 'function' ? min() : min;
    max = typeof max === 'function' ? max() : max;
    var result = [];
    for (var i = min; i <= max; i++)
        result.push(i);
    return result;
}

// Go through the items that have been added and deleted and try to find matches between them.
function findMovesInArrayComparison(left, right, limitFailedCompares) {
    if (left.length && right.length) {
        var failedCompares, l, r, leftItem, rightItem;
        for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
            for (r = 0; rightItem = right[r]; ++r) {
                if (leftItem['value'] === rightItem['value']) {
                    leftItem['moved'] = rightItem['index'];
                    rightItem['moved'] = leftItem['index'];
                    right.splice(r, 1);         // This item is marked as moved; so remove it from right list
                    failedCompares = r = 0;     // Reset failed compares count because we're checking for consecutive failures
                    break;
                }
            }
            failedCompares += r;
        }
    }
}



var statusNotInOld = 'added';
var statusNotInNew = 'deleted';

    // Simple calculation based on Levenshtein distance.
function compareArrays(oldArray, newArray, options) {
    // For backward compatibility, if the third arg is actually a bool, interpret
    // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
    options = (typeof options === 'boolean') ? { 'dontLimitMoves': options } : (options || {});
    oldArray = oldArray || [];
    newArray = newArray || [];

    if (oldArray.length < newArray.length)
        return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);
    else
        return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
}


function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, options) {
    var myMin = Math.min,
        myMax = Math.max,
        editDistanceMatrix = [],
        smlIndex, smlIndexMax = smlArray.length,
        bigIndex, bigIndexMax = bigArray.length,
        compareRange = (bigIndexMax - smlIndexMax) || 1,
        maxDistance = smlIndexMax + bigIndexMax + 1,
        thisRow, lastRow,
        bigIndexMaxForRow, bigIndexMinForRow;

    for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
        lastRow = thisRow;
        editDistanceMatrix.push(thisRow = []);
        bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
        bigIndexMinForRow = myMax(0, smlIndex - 1);
        for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
            if (!bigIndex)
                thisRow[bigIndex] = smlIndex + 1;
            else if (!smlIndex)  // Top row - transform empty array into new array via additions
                thisRow[bigIndex] = bigIndex + 1;
            else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1])
                thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
            else {
                var northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                var westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
            }
        }
    }

    var editScript = [], meMinusOne, notInSml = [], notInBig = [];
    for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
        meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
        if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex-1]) {
            notInSml.push(editScript[editScript.length] = {     // added
                'status': statusNotInSml,
                'value': bigArray[--bigIndex],
                'index': bigIndex });
        } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
            notInBig.push(editScript[editScript.length] = {     // deleted
                'status': statusNotInBig,
                'value': smlArray[--smlIndex],
                'index': smlIndex });
        } else {
            --bigIndex;
            --smlIndex;
            if (!options['sparse']) {
                editScript.push({
                    'status': "retained",
                    'value': bigArray[bigIndex] });
            }
        }
    }

    // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
    // smlIndexMax keeps the time complexity of this algorithm linear.
    findMovesInArrayComparison(notInBig, notInSml, !options['dontLimitMoves'] && smlIndexMax * 10);

    return editScript.reverse();
}

//
// This becomes ko.options
// --
//
// This is the root 'options', which must be extended by others.

var _global;

try { _global = window; } catch (e) { _global = global; }

var options = {
  deferUpdates: false,

  useOnlyNativeEvents: false,

  protoProperty: '__ko_proto__',

    // Modify the default attribute from `data-bind`.
  defaultBindingAttribute: 'data-bind',

    // Enable/disable <!-- ko binding: ... -> style bindings
  allowVirtualElements: true,

    // Global variables that can be accessed from bindings.
  bindingGlobals: _global,

    // An instance of the binding provider.
  bindingProviderInstance: null,

    // jQuery will be automatically set to _global.jQuery in applyBindings
    // if it is (strictly equal to) undefined.  Set it to false or null to
    // disable automatically setting jQuery.
  jQuery: _global && _global.jQuery,

  Promise: _global && _global.Promise,

  taskScheduler: null,

  debug: false,

  global: _global,
  document: _global.document,

    // Filters for bindings
    //   data-bind="expression | filter_1 | filter_2"
  filters: {},

  onError: function (e) { throw e },

  set: function (name, value) {
    options[name] = value;
  }
};

Object.defineProperty(options, '$', {
  get: function () { return options.jQuery }
});

//
// Error handling
// ---
//
// The default onError handler is to re-throw.
function catchFunctionErrors(delegate) {
    return options.onError ? function () {
        try {
            return delegate.apply(this, arguments);
        } catch (e) {
            options.onError(e);
        }
    } : delegate;
}

function deferError(error) {
    safeSetTimeout(function () { options.onError(error); }, 0);
}


function safeSetTimeout(handler, timeout) {
    return setTimeout(catchFunctionErrors(handler), timeout);
}

//
// Asynchronous functionality
// ---
function throttle(callback, timeout) {
    var timeoutInstance;
    return function () {
        if (!timeoutInstance) {
            timeoutInstance = safeSetTimeout(function () {
                timeoutInstance = undefined;
                callback();
            }, timeout);
        }
    };
}

function debounce(callback, timeout) {
    var timeoutInstance;
    return function () {
        clearTimeout(timeoutInstance);
        timeoutInstance = safeSetTimeout(callback, timeout);
    };
}

//
// Detection and Workarounds for Internet Explorer
//
// Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
// Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
// Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
// If there is a future need to detect specific versions of IE10+, we will amend this.
var ieVersion = options.document && (function () {
  var version = 3, div = options.document.createElement('div'), iElems = div.getElementsByTagName('i');

    // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
  while (
        div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
        iElems[0]
    ) {}
  return version > 4 ? version : undefined
}());

var isIe6 = ieVersion === 6;
var isIe7 = ieVersion === 7;

//
// Object functions
//

function extend(target, source) {
    if (source) {
        for(var prop in source) {
            if(source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }
    }
    return target;
}

function objectForEach(obj, action) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            action(prop, obj[prop]);
        }
    }
}


function objectMap(source, mapping) {
    if (!source)
        return source;
    var target = {};
    for (var prop in source) {
        if (source.hasOwnProperty(prop)) {
            target[prop] = mapping(source[prop], prop, source);
        }
    }
    return target;
}


function getObjectOwnProperty(obj, propName) {
    return obj.hasOwnProperty(propName) ? obj[propName] : undefined;
}


function clonePlainObjectDeep(obj, seen) {
    if (!seen) { seen = []; }

    if (!obj || typeof obj !== 'object'
        || obj.constructor !== Object
        || seen.indexOf(obj) !== -1) {
        return obj;
    }

    // Anything that makes it below is a plain object that has not yet
    // been seen/cloned.
    seen.push(obj);

    var result = {};
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            result[prop] = clonePlainObjectDeep(obj[prop], seen);
        }
    }
    return result;
}

//
// Prototype Functions
//
var protoProperty = options.protoProperty;

var canSetPrototype = ({ __proto__: [] } instanceof Array);

function setPrototypeOf(obj, proto) {
    obj.__proto__ = proto;
    return obj;
}

var setPrototypeOfOrExtend = canSetPrototype ? setPrototypeOf : extend;

function hasPrototype(instance, prototype) {
    if ((instance === null) || (instance === undefined) || (instance[protoProperty] === undefined)) return false;
    if (instance[protoProperty] === prototype) return true;
    return hasPrototype(instance[protoProperty], prototype); // Walk the prototype chain
}

//
// String (and JSON)
//


function stringTrim (string) {
    return string === null || string === undefined ? '' :
        string.trim ?
            string.trim() :
            string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
}


function stringStartsWith (string, startsWith) {
    string = string || "";
    if (startsWith.length > string.length)
        return false;
    return string.substring(0, startsWith.length) === startsWith;
}


function parseJson (jsonString) {
    if (typeof jsonString == "string") {
        jsonString = stringTrim(jsonString);
        if (jsonString) {
            if (JSON && JSON.parse) // Use native parsing where available
                return JSON.parse(jsonString);
            return (new Function("return " + jsonString))(); // Fallback on less safe parsing for older browsers
        }
    }
    return null;
}


function stringifyJson (data, replacer, space) {   // replacer and space are optional
    if (!JSON || !JSON.stringify)
        throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
    return JSON.stringify(typeof data === 'function' ? data() : data, replacer, space);
}

//
// ES6 Symbols
//

var useSymbols = typeof Symbol === 'function';

function createSymbolOrString(identifier) {
    return useSymbols ? Symbol(identifier) : identifier;
}

//
// DOM - CSS
//

// For details on the pattern for changing node classes
// see: https://github.com/knockout/knockout/issues/1597
var cssClassNameRegex = /\S+/g;


function toggleDomNodeCssClass(node, classNames, shouldHaveClass) {
    var addOrRemoveFn;
    if (!classNames) { return; }
    if (typeof node.classList === 'object') {
        addOrRemoveFn = node.classList[shouldHaveClass ? 'add' : 'remove'];
        arrayForEach(classNames.match(cssClassNameRegex), function(className) {
            addOrRemoveFn.call(node.classList, className);
        });
    } else if (typeof node.className['baseVal'] === 'string') {
        // SVG tag .classNames is an SVGAnimatedString instance
        toggleObjectClassPropertyString(node.className, 'baseVal', classNames, shouldHaveClass);
    } else {
        // node.className ought to be a string.
        toggleObjectClassPropertyString(node, 'className', classNames, shouldHaveClass);
    }
}


function toggleObjectClassPropertyString(obj, prop, classNames, shouldHaveClass) {
    // obj/prop is either a node/'className' or a SVGAnimatedString/'baseVal'.
    var currentClassNames = obj[prop].match(cssClassNameRegex) || [];
    arrayForEach(classNames.match(cssClassNameRegex), function(className) {
        addOrRemoveItem(currentClassNames, className, shouldHaveClass);
    });
    obj[prop] = currentClassNames.join(" ");
}

//
// jQuery
//
// TODO: deprecate in favour of options.$

var jQueryInstance = options.global && options.global.jQuery;

function jQuerySetInstance(jquery) {
    options.jQuery = jQueryInstance = jquery;
}

//
//  Tasks Micro-scheduler
//  ===
//
/* eslint no-cond-assign: 0 */
var taskQueue = [];
var taskQueueLength = 0;
var nextHandle = 1;
var nextIndexToProcess = 0;
var w = options.global;

if (w && w.MutationObserver && !(w.navigator && w.navigator.standalone)) {
    // Chrome 27+, Firefox 14+, IE 11+, Opera 15+, Safari 6.1+, node
    // From https://github.com/petkaantonov/bluebird * Copyright (c) 2014 Petka Antonov * License: MIT
    options.taskScheduler = (function (callback) {
        var div = w.document.createElement("div");
        new MutationObserver(callback).observe(div, {attributes: true});
        return function () { div.classList.toggle("foo"); };
    })(scheduledProcess);
} else if (w && w.document && "onreadystatechange" in w.document.createElement("script")) {
    // IE 6-10
    // From https://github.com/YuzuJS/setImmediate * Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola * License: MIT
    options.taskScheduler = function (callback) {
        var script = document.createElement("script");
        script.onreadystatechange = function () {
            script.onreadystatechange = null;
            document.documentElement.removeChild(script);
            script = null;
            callback();
        };
        document.documentElement.appendChild(script);
    };
} else {
    options.taskScheduler = function (callback) {
        setTimeout(callback, 0);
    };
}

function processTasks() {
    if (taskQueueLength) {
        // Each mark represents the end of a logical group of tasks and the number of these groups is
        // limited to prevent unchecked recursion.
        var mark = taskQueueLength, countMarks = 0;

        // nextIndexToProcess keeps track of where we are in the queue; processTasks can be called recursively without issue
        for (var task; nextIndexToProcess < taskQueueLength; ) {
            if (task = taskQueue[nextIndexToProcess++]) {
                if (nextIndexToProcess > mark) {
                    if (++countMarks >= 5000) {
                        nextIndexToProcess = taskQueueLength;   // skip all tasks remaining in the queue since any of them could be causing the recursion
                        deferError(Error("'Too much recursion' after processing " + countMarks + " task groups."));
                        break;
                    }
                    mark = taskQueueLength;
                }
                try {
                    task();
                } catch (ex) {
                    deferError(ex);
                }
            }
        }
    }
}

function scheduledProcess() {
    processTasks();

    // Reset the queue
    nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
}

function scheduleTaskProcessing() {
    options.taskScheduler(scheduledProcess);
}


function schedule(func) {
    if (!taskQueueLength) {
        scheduleTaskProcessing();
    }

    taskQueue[taskQueueLength++] = func;
    return nextHandle++;
}

function cancel(handle) {
    var index = handle - (nextHandle - taskQueueLength);
    if (index >= nextIndexToProcess && index < taskQueueLength) {
        taskQueue[index] = null;
    }
}

// For testing only: reset the queue and return the previous queue length
function resetForTesting() {
    var length = taskQueueLength - nextIndexToProcess;
    nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
    return length;
}




var tasks = Object.freeze({
	schedule: schedule,
	cancel: cancel,
	resetForTesting: resetForTesting,
	runEarly: processTasks
});

/*
  tko.util
  ===


*/
// DOM;
/*
export * from './dom/event.js';
export * from './dom/info.js';
export * from './dom/manipulation.js';
export * from './dom/fixes.js';
export * from './dom/html.js';
export * from './dom/disposal.js';

// Sub-Modules;
import * as memoization from './memoization';
import * as tasks from './tasks.js';
import * as virtualElements from './dom/virtualElements.js';
import * as domData from './dom/data.js';

export {tasks, virtualElements, domData, memoization};
*/

export { tasks, jQuerySetInstance, options, arrayForEach, arrayIndexOf, arrayFirst, arrayRemoveItem, arrayGetDistinctValues, arrayMap, arrayFilter, arrayPushAll, addOrRemoveItem, makeArray, range, findMovesInArrayComparison, compareArrays, throttle, debounce, catchFunctionErrors, deferError, safeSetTimeout, ieVersion, isIe6, isIe7, extend, objectForEach, objectMap, getObjectOwnProperty, clonePlainObjectDeep, canSetPrototype, setPrototypeOf, setPrototypeOfOrExtend, hasPrototype, stringTrim, stringStartsWith, parseJson, stringifyJson, useSymbols, createSymbolOrString, toggleDomNodeCssClass };
//# sourceMappingURL=tko.utils.js.map
