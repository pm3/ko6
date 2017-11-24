import { ko6c, renderCtx }  from './ko6.js';

import { HomeViewModel } from './components/HomeViewModel.js';

console.log('start');

renderCtx.registerComponent('HomeViewModel', { model:HomeViewModel, templateUrl:'src/components/HomeViewModel.html'});

/*
setInterval(function(){ 
	var raw = window.mainModel.step()+1;
	if(raw>5) raw = 1;
	window.mainModel.step(raw);
}, 1000);
*/

var el = document.getElementById("main");
window.rootCtx = ko6c(el, 'HomeViewModel', {});

//ko6(el, x, window.mainModel);

setTimeout(function(){ 
	
	var script = document.createElement('script');
	script.type = "module";
	script.textContent = `import test from './src/test.js'; console.log(test, test.a);`;
	document.getElementsByTagName('head')[0].appendChild(script);

}, 100);