import { arrayForEach }  from './tko/tko.utils.js';
import { unwrap }  from './tko/tko.observable.js';
import { computed }  from './tko/tko.computed.js';

import blockComponent  from './blocks/blockComponent.js';

function renderCtx(parentEl, tpl, ctx, level){
	if(Array.isArray(tpl)){
		for(var i=0; i<tpl.length; i++){
			renderCtx(parentEl, tpl[i], ctx, level);
		}
	} else if(tpl.block){
		var blockFn = renderCtx.blocks[tpl.block];
		if(blockFn && blockFn.call){
			blockFn(parentEl, tpl, ctx, level, renderCtx);
		} else {
			tpl.attrs._name = () => tpl.block;
			blockComponent(parentEl, tpl, ctx, level, renderCtx);
		}
	} else if(tpl.tag){
		var el = document.createElement(tpl.tag);
		if(level==0) ctx.rootNodes.push(el);
		for (var key in tpl.attrs) {
			var val = tpl.attrs[key];
			if(typeof val == "function"){
				attrExpr(el, key, val, ctx);
			} else {
				el.setAttribute(key, val);
			}
		}
		insertNode(parentEl, el);
		if(tpl.children) arrayForEach(tpl.children, function(x){ renderCtx(el, x, ctx, level+1); });
	} else if(tpl && typeof tpl == "function"){
		var n = document.createTextNode("");
		if(level==0) ctx.rootNodes.push(n);
		insertNode(parentEl, n);
		textExpr(n, tpl, ctx, level);
	} else if(tpl !== undefined || tpl !== null){
		var n = document.createTextNode(""+tpl);
		if(level==0) ctx.rootNodes.push(n);
		insertNode(parentEl, n);
	}
}

function insertNode(parentEl, n) {
	if(parentEl.nodeType) {
		parentEl.appendChild(n);
	} else{
		parentEl[0].insertBefore(n, parentEl[1]);
	}
}

function createStamp(parentEl, name){
	var stamp =	document.createComment(name);
	if(parentEl.nodeType) {
		parentEl.appendChild(stamp);
		return [parentEl, stamp];
	} else{
		parentEl[0].insertBefore(stamp, parentEl[1]);
		return [parentEl[0], stamp];
	}
}

function attrExpr(el, key, val, ctx){
	var binding = renderCtx.bindingHandlers[key];
	if(binding){
		if(binding.init){
			var val2 = val(ctx.model, ctx);
			binding.init(el, val2, ctx);
		}
		if(binding.update){
			var kv = computed(function(){
				var val2 = val(ctx.model, ctx);
				binding.update(el, val2, ctx);
			},this);
			kv.extend({ notify: 'always' });
			kv();
			ctx.subscribers.push(kv);
		}
		if(binding.dispose && binding.dispose.call){
			var obj = {};
			obj.dispose = function(){
				binding.dispose(el, ctx);
			};
			ctx.subscribers.push(obj);
		}
	} else {
		var kv = computed(function(){
			var val2 = val(ctx.model, ctx);
			val2 = unwrap(val2);
			el.setAttribute(key, val2);
		},this);
		kv.extend({ notify: 'always' });
		kv();
		if(kv.getDependenciesCount()>0){
			ctx.subscribers.push(kv);
		} else {
			kv.dispose();
		}
	}
};

function textExpr(n, val, ctx, level){
	var kv = computed(function(){
		var val2 = val(ctx.model, ctx);
		val2 = unwrap(val2);
		n.nodeValue = ""+val2;
		return val2;
	}, this);
	kv.extend({ notify: 'always' });
	kv();
	if(kv.getDependenciesCount()>0){
		ctx.subscribers.push(kv);
	} else {
		kv.dispose();
	}
};

renderCtx.blocks = {
};

renderCtx.bindingHandlers = {
};

function createCtx(model, parentCtx, component){
	var ctx = {};
	ctx.model = model;
	ctx.componet = component ? component : parentCtx ? parentCtx.conponent : null;
	ctx.root = parentCtx ? parentCtx.root : model;
	ctx.parent = function(index){
		if(index<0){
			return ctx.root;
		}
		if(index==0){
			return ctx.model;	
		}
		var parent1 = ctx;
		while(index-->0){
			if(!parent1.parentCtx) return parent1.model;
			parent1 = parent1.parentCtx;
		}
		return parent1.model;
	};
	ctx.parentCtx = parentCtx;
	ctx.rootNodes = [];
	ctx.subscribers = [];
	ctx.dispose = function(removeNodes) {
		arrayForEach(ctx.subscribers, function(e) { if(e.dispose) e.dispose(); } );
		ctx.subscribers = [];
		if(!(removeNodes===false)) arrayForEach(ctx.rootNodes, function(n) { if(n.parentNode) n.parentNode.removeChild(n); });
		ctx.rootNodes = [];
	};

	return ctx;
}

function duplicateCtx(ctx){
	
	var ctx0 = {};
	for (var attr in ctx) if (ctx.hasOwnProperty(attr)) ctx0[attr] = ctx[attr];
	ctx0.subscribers = [];
	ctx0.rootNodes = [];
	ctx0.dispose = function() {
		arrayForEach(ctx0.subscribers, function(e) { if(e.dispose) e.dispose(); } );
		ctx0.subscribers = [];
		arrayForEach(ctx0.rootNodes, function(n) { if(n.parentNode) n.parentNode.removeChild(n); });
		ctx0.rootNodes = [];
	};
	return ctx0;
}

export {
	renderCtx,
	createCtx,
	duplicateCtx,
	insertNode,
	createStamp
};