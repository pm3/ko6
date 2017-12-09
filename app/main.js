import * as ko6 from '../src/ko6.js';

console.log('start');

function autoDefineComponent(def){

	if(def.name && def.empty){

		//empty definition
		delete def.empty;

		if(window.webpackJsonp){
			//source compiled in webpack
			def.jsmodule = 'dist/'+def.name+"Model.bundle.js";
			return;
		}

		def.es6module = 'app/components/'+def.name+"Model.js";
	}
}

ko6.componentLoaders.unshift(autoDefineComponent);

var el = document.getElementById("main");
window.rootCtx = ko6.main(el, 'HomeView', {});
