import * as ko6 from './ko6.js';

console.log('start');

function autoDefineComponent(def){

	if(def.name && def.empty){

		//empty definition
		delete def.empty;
		def.es6module = 'src/components/'+def.name+"Model.js";
	}
}

ko6.componentLoaders.unshift(autoDefineComponent);

var el = document.getElementById("main");
window.rootCtx = ko6.main(el, 'HomeView', {});


