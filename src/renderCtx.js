import { unwrap }  from './tko/tko.observable.js';
import { computed }  from './tko/tko.computed.js';

import { blockComponent }   from './blocks/blockComponent.js';

function renderCtx(parentEl, tpl, ctx, level){
	if(Array.isArray(tpl)){
		//is array
		for(let i=0, max=tpl.length; i<max; i++){
			renderCtx(parentEl, tpl[i], ctx, level);
		}
	} else if(tpl.tag){
		if(tpl.tag.toLowerCase()!=tpl.tag || tpl.tag.indexOf('-')>0){
	   		//is block
	   		renderBlock(parentEl, tpl, ctx, level);
		} else {
			//is html element
			renderElement(parentEl, tpl, ctx, level)
		}
	} else if(tpl && typeof tpl == "function"){
		//is text expresssion
		const n = document.createTextNode("");
		if(level==0) ctx.rootNodes.push(n);
		insertNode(parentEl, n);
		textExpr(n, tpl, ctx, level);
	} else if(tpl !== undefined || tpl !== null){
		//is text
		const n = document.createTextNode(""+tpl);
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
	const stamp = document.createComment(name);
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
			var val2 = ctx.expr(val);
			binding.init(el, val2, ctx);
		}
		if(binding.update){
			var kv = computed(function(){
				var val2 = ctx.expr(val);
				binding.update(el, val2, ctx);
			},this);
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
			var val2 = ctx.expr(val);
			val2 = unwrap(val2);
			el.setAttribute(key, val2);
		},this);
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
		var val2 = ctx.expr(val);
		val2 = unwrap(val2);
		n.nodeValue = ""+val2;
		return val2;
	}, this);
	kv();
	if(kv.getDependenciesCount()>0){
		ctx.subscribers.push(kv);
	} else {
		kv.dispose();
	}
};

function renderElement(parentEl, tpl, ctx, level){
	const el = document.createElement(tpl.tag);
	if(level==0) ctx.rootNodes.push(el);
	for (let key in tpl.attrs) {
		const val = tpl.attrs[key];
		if(val.call){
			attrExpr(el, key, val, ctx);
		} else {
			el.setAttribute(key, val);
		}
	}
	insertNode(parentEl, el);
	if(tpl.children) {
		for(let i=0, max=tpl.children.length; i<max; i++){
			renderCtx(el, tpl.children[i], ctx, level+1)
		}
	}
};

function renderBlock(parentEl, tpl, ctx, level){
	var blockFn = renderCtx.blocks[tpl.tag];
	if(!(blockFn && blockFn.call)){
		blockFn = blockComponent;
		tpl.attrs._name = () => tpl.tag;
	}

	var stamp =	createStamp(parentEl, tpl.tag);
	if(level==0) ctx.rootNodes.push(stamp[1]);

	var ctx0 = ctx.createChild();

	var kv = computed(function(){
		blockFn(stamp, tpl, ctx0, level);
	}, this);
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

function Ctx(model, parent, root, component){
	this.model = model;
	this.parent = parent;
	this.root = root;
	this.component = component;
	this.rootNodes = [];
	this.subscribers = [];
}
Ctx.prototype.dispose = function(){
	for(let i=0, max=this.subscribers.length; i<max; i++) {
		const e = this.subscribers[i];
		if(e.dispose) e.dispose();	
	} 
	this.subscribers = [];
	for(let i=0, max=this.rootNodes.length; i<max; i++) {
		const n = this.rootNodes[i];
		if(n.parentNode) n.parentNode.removeChild(n);
	} 
	this.rootNodes = [];
}
Ctx.prototype.createChild = function(model){
	const ctx0 = new Ctx(model || this.model, this.parent, this.root, this.component);
	this.subscribers.push(ctx0);
	return ctx0;
}
Ctx.prototype.expr = function(f){
	return f(this.model, this);
}

export {
	renderCtx, renderElement, renderBlock,
	Ctx,
	insertNode, createStamp
};