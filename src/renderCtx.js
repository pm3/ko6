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
		if(tpl.tag.indexOf('-')>=0){
	   		//is block
	   		const stamp = insertNode(parentEl, document.createComment(tpl.tag));
	   		bindBlock(stamp, tpl, ctx);
		} else {
			//is html element
			const el = document.createElement(tpl.tag);
			for (let key in tpl.attrs) {
				const val = tpl.attrs[key];
				if(val.call){
					bindAttr(el, key, val, ctx);
				} else {
					el.setAttribute(key, val);
				}
			}
			if(level==0) ctx.rootNodes.push(el);
			insertNode(parentEl, el);
			if(tpl.children) {
				for(let i=0, max=tpl.children.length; i<max; i++){
					renderCtx(el, tpl.children[i], ctx, level+1)
				}
			}
		}
	} else if(tpl && tpl.call){
		//is text expresssion
		const n = document.createTextNode("");
		if(level==0) ctx.rootNodes.push(n);
		insertNode(parentEl, n);
		bindText(n, tpl, ctx);
	} else if(tpl !== undefined || tpl !== null){
		//is static text
		const n = document.createTextNode(""+tpl);
		if(level==0) ctx.rootNodes.push(n);
		insertNode(parentEl, n);
	}
}

function bindAttr(el, key, val, ctx){
	const binding = renderCtx.bindingHandlers[key];
	if(binding){
		//binding definition
		if(binding.init){
			const val2 = ctx.expr(val);
			binding.init(el, val2, ctx);
		}
		if(binding.update){
			ctx.computed(function(){
				const val2 = ctx.expr(val);
				binding.update(el, val2, ctx);
				return val2;
			});
		}
		if(binding.dispose && binding.dispose.call){
			const disposer = { dispose: function(){ binding.dispose(el, ctx); }};
			ctx.subscribers.push(disposer);
		}
	} else {
		ctx.computed(function(){
			let val2 = ctx.expr(val);
			val2 = unwrap(val2);
			el.setAttribute(key, val2);
			return val2;
		});
	}
}

function bindText(node, val, ctx) {
	ctx.computed(function(){
		let val2 = ctx.expr(val);
		val2 = unwrap(val2);
		node.nodeValue = ""+val2;
		return val2;
	});
}

function bindBlock(stamp, tpl, ctx) {
	const blockFn = renderCtx.blocks[tpl.tag];
	const ctx0 = ctx.createChild();
	ctx.computed(function(){
		blockFn(stamp, tpl, ctx0);
	});
}

function insertNode(parentEl, n) {
	if(parentEl.nodeType) {
		parentEl.appendChild(n);
		return [parentEl, n];
	} else{
		parentEl[0].insertBefore(n, parentEl[1]);
		return [parentEl[0], n];
	}
}

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

Ctx.prototype.computed = function(f){
	const kv = computed(f, this);
	kv();
	if(kv.getDependenciesCount()>0){
		this.subscribers.push(kv);
	} else {
		kv.dispose();
	}
}

export {
	renderCtx, bindAttr, bindText, bindBlock,
	Ctx,
	insertNode
};