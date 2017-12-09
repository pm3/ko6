webpackJsonp([0],{

/***/ 8:
/*!**************************************************************************!*\
  !*** c:/Users/pm/Downloads/react/js-framework-benchmark/ko6/app/main.js ***!
  \**************************************************************************/
/*! dynamic exports provided */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _ko = __webpack_require__(/*! ../src/ko6.js */ 4);\n\nvar ko6 = _interopRequireWildcard(_ko);\n\nfunction _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }\n\nconsole.log('start');\n\nfunction autoDefineComponent(def) {\n\n\tif (def.name && def.empty) {\n\n\t\t//empty definition\n\t\tdelete def.empty;\n\n\t\tif (window.webpackJsonp) {\n\t\t\t//source compiled in webpack\n\t\t\tdef.jsmodule = 'dist/' + def.name + \"Model.bundle.js\";\n\t\t\treturn;\n\t\t}\n\n\t\tdef.es6module = 'app/components/' + def.name + \"Model.js\";\n\t}\n}\n\nko6.componentLoaders.unshift(autoDefineComponent);\n\nvar el = document.getElementById(\"main\");\nwindow.rootCtx = ko6.main(el, 'HomeView', {});//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiOC5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9jOi9Vc2Vycy9wbS9Eb3dubG9hZHMvcmVhY3QvanMtZnJhbWV3b3JrLWJlbmNobWFyay9rbzYvYXBwL21haW4uanM/ZjMyNyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBrbzYgZnJvbSAnLi4vc3JjL2tvNi5qcyc7XHJcblxyXG5jb25zb2xlLmxvZygnc3RhcnQnKTtcclxuXHJcbmZ1bmN0aW9uIGF1dG9EZWZpbmVDb21wb25lbnQoZGVmKXtcclxuXHJcblx0aWYoZGVmLm5hbWUgJiYgZGVmLmVtcHR5KXtcclxuXHJcblx0XHQvL2VtcHR5IGRlZmluaXRpb25cclxuXHRcdGRlbGV0ZSBkZWYuZW1wdHk7XHJcblxyXG5cdFx0aWYod2luZG93LndlYnBhY2tKc29ucCl7XHJcblx0XHRcdC8vc291cmNlIGNvbXBpbGVkIGluIHdlYnBhY2tcclxuXHRcdFx0ZGVmLmpzbW9kdWxlID0gJ2Rpc3QvJytkZWYubmFtZStcIk1vZGVsLmJ1bmRsZS5qc1wiO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0ZGVmLmVzNm1vZHVsZSA9ICdhcHAvY29tcG9uZW50cy8nK2RlZi5uYW1lK1wiTW9kZWwuanNcIjtcclxuXHR9XHJcbn1cclxuXHJcbmtvNi5jb21wb25lbnRMb2FkZXJzLnVuc2hpZnQoYXV0b0RlZmluZUNvbXBvbmVudCk7XHJcblxyXG52YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW5cIik7XHJcbndpbmRvdy5yb290Q3R4ID0ga282Lm1haW4oZWwsICdIb21lVmlldycsIHt9KTtcclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIGM6L1VzZXJzL3BtL0Rvd25sb2Fkcy9yZWFjdC9qcy1mcmFtZXdvcmstYmVuY2htYXJrL2tvNi9hcHAvbWFpbi5qcyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBREE7QUFDQTs7O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///8\n");

/***/ })

},[8]);