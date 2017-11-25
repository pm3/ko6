import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { computed }  from '../tko/tko.computed.js';
import { renderCtx }  from '../renderCtx.js';
import { templateParser }  from '../templateParser.js';

export function blockComponent(stamp, tpl, ctx0, level){

	if(tpl.children && tpl.children.length>0 && tpl.attrs && tpl.attrs['_name']){
		
		var _name = tpl.attrs['_name'];
		var val2 = unwrap(ctx0.expr(_name));

		if(val2==ctx0.cname) return;
		ctx0.cname = val2;

		ctx0.dispose();

		dependencyDetection.ignore(function(){

			var callback = function(modelFn, view) {
				var model = tpl.attrs;
				if(modelFn){
					model = new modelFn(tpl.attrs);
				}
				ctx0.model = model;
				ctx0.compoent = model;
				ctx0.subscribers.push(model);
				renderCtx(stamp, view, ctx0, 0);
			};

			renderCtx.registerComponent(val2, null, callback);

		});


	}

}

export var componentLoaders = [];

export function registerComponent(name, def0, callback){

	var def = registerComponent.componentMap[name];
	console.log('registerComponent ' + name, def0, def);
	
	//undefined component, undefined definition, create empty definition
	if(!def && !def0){
		def0 = { name:name, empty:true };
	}

	//merge definition
	if(def && def0){
		for (var name in def0) {
  			if (def0.hasOwnProperty(name)) def[name] = def0[name];
  		}
		if(def.asynchModel && def.model) delete def.asynchModel;
		if(def.asynchTemplate && def.template) delete def.asynchTemplate;
	}

	//create new definition
	if(!def && def0){
		def = def0;
		def.name = name;
		registerComponent.componentMap[name] = def;
	}

	//error, no continue
	if(def.error){
		console.log('registerComponent ' + name + ' exists error ' + def.error);
		return;
	}

	//definition was changed - run all loaders
	if(def0){
		componentLoaders.forEach( (f) => f(def) );
	}

	//check if is running loading model or template
	if(def.asynchModel || def.asynchTemplate) {
		if(callback){
			console.log('registerComponent ' + name+' loading', def.asynchModel, def.asynchTemplate);
			if(!def.waitingCallbacks) def.waitingCallbacks = [];
			def.waitingCallbacks.push(callback);
		}
		return;
	}

	if(def.template){
		
		//compile template
		if(typeof def.template == 'string'){
			def.template = templateParser(def.template);
		}
		
		//render waiting callbacks
		if(def.waitingCallbacks) {
			def.waitingCallbacks.forEach( (c) => c(def.model, def.template) );
			delete def.waitingCallbacks;
		} 

		//render callback
		if(callback) callback(def.model, def.template);
		return;
	}

	//no loading, no template, create error
	def.error = 'undefined template';
	console.log('registerComponent ' + name + ' error ' + def.error);
}
registerComponent.componentMap = {};

function templateAjaxLoader(def){
	//no template, no loading, and defined templateUrl
	if(!def.template && !def.asynchTemplate && def.templateUrl){

		//make note but template is loading with templateAjaxLoader
		def.asynchTemplate = 'templateAjaxLoader ' + def.templateUrl;

		//send ajax GET request
		var xhr = new XMLHttpRequest();
		xhr.open('GET', def.templateUrl);
		xhr.onload = function(){
			var def2 = (xhr.status==200) ? { template : xhr.responseText } : { error : 'templateAjaxLoader state=' + xhr.state };
			registerComponent(def.name, def2);
		};
		xhr.send();
	}
}
componentLoaders.push(templateAjaxLoader);

function es6loader(def){
	if (!def.model && !def.asynchModel && def.es6module) {

		def.asynchModel = "es6loader "+def.es6module;
		var script = document.createElement('script');
		script.src = def.es6module;
		script.type = "module";
		document.head.appendChild(script);
	}
}
componentLoaders.push(es6loader);

