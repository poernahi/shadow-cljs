goog.provide("shadow.js");
goog.require("shadow.process");

// since we only run JS through :simple we need to keep these as is.
goog.exportSymbol("process.env.NODE_ENV", process.env.NODE_ENV);
goog.exportSymbol("process.browser", process.browser);

/**
 * @dict
 */
shadow.js.files = {};

/**
 * @return {ShadowJS}
 */
shadow.js.require = function(name, opts) {
  var exports = shadow.js.files[name];
  if (exports === undefined) {
    exports = shadow.js.files[name] = {};
  }

  var moduleFn = shadow$provide[name];
  if (moduleFn) {
    delete shadow$provide[name];

    var module = {};

    // FIXME: should this use an empty {} for exports
    // and copy onto the actual exports after? circular dependencies are weird
    // I'm not sure all references work properly like this

    // must use string accessors, otherwise :advanced will rename them
    // but the JS is not optimized so it wont map properly
    module["exports"] = exports;

    // FIXME: is the call necessary? only ensures that this equals the module
    // which should match node? not entirely sure how others do it.

    try {
      moduleFn.call(module, goog.global, shadow.js.require, module, module["exports"]);
    } catch (e) {
      console.warn("shadow-cljs - failed to load", name);
      throw e;
    }

    exports = module["exports"];

    // FIXME: working around the impl of CLJS-1620
    // https://dev.clojure.org/jira/browse/CLJS-1620
    // not exactly certain why it doesnt work but sometimes
    // CLJS continues to rewrite thing.default to thing.default$
    //
    // this is a pattern done by babel when converted from ES6
    // so its very isolated and should be reliable enough
    if (typeof(exports) == 'object' && exports["__esModule"] === true) {
      exports["default$"] = exports["default"];
    }

    shadow.js.files[name] = exports;

    if (opts) {
      var globals = opts["globals"];
      if (globals) {
        for (var i = 0; i < globals.length; i++) {
          window[globals[i]] = exports;
        }
      }
    }
  }

  return exports;
};

