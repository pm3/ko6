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
window.ko2json = ko6.ko2json;

ko6.registerComponent('component-name', { template: '<p> cn1 <!--ko-text window.ko2json(m)--></p>' });
ko6.registerComponent('component-name2', { template: '<p> cn2 <!--ko-text window.ko2json(m)--></p>' });

function TemplatesModel(){
	let self = this;
	self.name = ko6.observable('aa');
	self.className = ko6.observable('aaa');
	self.componentName = ko6.observable('component-name2');
	self.count = ko6.observable(4);
	self.rows = ko6.observableArray(['a', 'b', 'c']);
	self.change = function(){
		self.name('aaa');
		self.className('aaaa');
		self.componentName('component-name');
		self.count(1);
		self.rows(['a', 'b', 'c', 'd']);
	}
}

ko6.registerComponent('base-templates', { model:TemplatesModel, templateUrl: 'spec/templates.html' });

var el = document.getElementById("main");
window.rootCtx = ko6.main(el, 'HomeView', {});
