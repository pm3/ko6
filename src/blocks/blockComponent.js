import { arrayForEach }  from '../tko/tko.utils.js';
import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { computed }  from '../tko/tko.computed.js';
import { renderCtx }  from '../renderCtx.js';
import { parserko6 }  from '../parserko6.js';

export default function blockComponent(stamp, tpl, ctx0, level){

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

			renderCtx.loadComponent(val2, callback);

		});


	}

}

renderCtx.componentMap = {};
renderCtx.componentConfigurators = [];

renderCtx.registerComponent = function(name, def){
	def.name = name;
	renderCtx.componentMap[name] = def;
};

renderCtx.loadComponent = function(name, callback){

	var def = renderCtx.componentMap[name];
	console.log(def);
	if(!def){
		def = { name: name };
		renderCtx.componentMap[name] = def;
	}

	if(def.error){
		console.log('loadComponent ' + name + ' error ' + def.error);
		return;
	}

	if(!def.configured){
		def.configured = true;
		renderCtx.componentConfigurators.forEach( (f) => f(def) );
	}

	if(def.loadModel || def.loadTemplate) {
		console.log('loadComponent ' + name+' loading ');
		if(!def.waitingCallbacks) def.waitingCallbacks = [];
		if(callback) def.waitingCallbacks.push(callback);
		return;
	}

	if(def.template){
		if(typeof def.template == 'string'){
			def.template = parserko6(def.template);
		}

		if(def.waitingCallbacks){
			def.waitingCallbacks.forEach( (c) => c(def.model, def.template) );
			delete def.waitingCallbacks;
		}
		if(callback) callback(def.model, def.template);
		return;
	}

	def.error = 'undefined template';
	console.log('loadComponent ' + name + ' error ' + def.error);
	delete def.waitingCallbacks;
};

function templateAjaxLoad(def){
	if(!def.loadTemplate && def.templateUrl){
		def.loadTemplate = 'templateAjaxLoad ' + def.templateUrl;
		console.log('loadComponent ' + name + ' ' + def.loadTemplate);
		ajaxGet(def.templateUrl, function(status,data){
			delete def.loadTemplate;
			if(status==200){
				def.template = data;
			} else {
				def.error = 'templateAjaxLoad state=' + state;
			}
			renderCtx.loadComponent(def.name);
		});
	}
}
renderCtx.componentConfigurators.push(templateAjaxLoad);

function ajaxGet(url, callback){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url);
	xhr.onload = function() {
        callback(xhr.status, xhr.responseText);
	};
	xhr.send();
}