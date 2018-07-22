import { unwrap, ignoreDependencies, computed }  from '../ko3/ko.js';
import { renderCtx }  from '../renderCtx.js';

export default function blockForeach(stamp, tpl, ctx){

	if(!(tpl && tpl.children && tpl.children.length>0)){
		console.warn("empty foreach" ,tpl);
		return;
	}

	if(tpl.params && tpl.params.call){

		let ctx0 = ctx.createChild();
		ctx.computed(function(){

			const value = ctx.expr(tpl.params, true);
			let items = [];
			if(Array.isArray(value)){
				items = value;
			} else if(value.items){
				let items2 = unwrap(value.items);
				if(Array.isArray(items2))
					items = items2;
			}
			ignoreDependencies(function(){
				renderItems(items, stamp, tpl, ctx0);
			});
			return value;
		});
	}
};

function renderItems(items2, stamp, tpl, ctx0){

	if(items2.length==0){
		//remove all
		console.log('removeAll');
		ctx0.dispose();
		return;
	}

	let eqMin = arrEq(ctx0.subscribers, items2);

	if(eqMin==ctx0.subscribers.length){
		//only Append
		console.log('onlyAppend', eqMin);
		for(let i=eqMin, max=items2.length; i<max; i++) appendItem(items2[i], stamp, tpl, ctx0);
		return;
	}
	if(ctx0.subscribers.length>items2.length && eqMin==items2.length){
		//only remove
		console.log('onlyRemove', eqMin, ctx0.subscribers.length, '<', items2.length);
		for(let i=ctx0.subscribers.length-1; i>=items2.length; i--) ctx0.subscribers[i].dispose();
		ctx0.subscribers = ctx0.subscribers.slice(0, items2.length);
		return;
	}

	if(Map && Map.call){
		//merge contenxt in Map
		mergeItemsMap(items2, eqMin, tpl, ctx0, stamp[0], stamp[1]);
		return;
	}

	//bad scenario, delete all old, add new
	ctx0.dispose();
	for(let i=0, max=items2.length; i<max; i++) appendItem(items2[i], stamp, tpl, ctx0);

};

function arrEq(contexts, items2, start){
	start = start || 0;
	const max = contexts.length<items2.length ? contexts.length : items2.length;
	for(let i = 0; i<max; i++){
		if(contexts[i].model!=items2[i]) return i;
	}
	return max;
}

function appendItem(m2, stamp, tpl, ctx0){
	const ctx2 = ctx0.createChild(m2);
	renderCtx(stamp, tpl.children, ctx2, 0);
	return ctx2;
}

function mergeItemsMap(items2, eqMin, tpl, ctx0, parent, stamp1){
	let oldMap = new Map();
	let old = ctx0.subscribers;
	//index old
	for(let i=eqMin; i<old.length; i++){
		const ctx2 = old[i];
		ctx2._oldIndex = i;
		ctx2._newIndex = -1;
		oldMap.set(ctx2.model, ctx2);
	}
	//index new
	let reusedCtx = [];
	for(let i=eqMin; i<items2.length; i++){
		const ctx2 = oldMap.get(items2[i]);
		if(ctx2) { 
			ctx2._newIndex = i; 
			reusedCtx[i] = ctx2; 
		}
	}

	ctx0.subscribers = ctx0.subscribers.slice(0, eqMin);
	let aktPosOld = nextOldPos(old, eqMin);
	for(let i=eqMin, max=items2.length; i<max; i++){
		const m2 = items2[i];
		if(aktPosOld<old.length && old[aktPosOld].model===m2) {
			//the same models, all is ok
			ctx0.subscribers.push(old[aktPosOld]);
			old[aktPosOld] = null;
			aktPosOld = nextOldPos(old, aktPosOld+1);
			continue;
		}
		const beforeNode = aktPosOld<old.length ? old[aktPosOld].rootNodes[0] : stamp1;
		let ctx2 = reusedCtx[i];
		if(ctx2){
			//reuse
			for(let i2=0, max2=ctx2.rootNodes.length; i2<max2; i2++){
				parent.insertBefore(ctx2.rootNodes[i2],beforeNode);
			};
			ctx0.subscribers.push(ctx2);
			old[ctx2._oldIndex] = null;
		} else {
			//create new
			ctx2 = appendItem(m2, [ parent, beforeNode], tpl, ctx0);
			ctx0.subscribers.push(ctx2);
		}
	}
}

function nextOldPos(old, aktPosOld){
	while(aktPosOld<old.length) {
		const v = old[aktPosOld];
		if(v!=null){
			if(v._newIndex>=0) return aktPosOld;
			v.dispose();
			old[aktPosOld] = null;
		}
		aktPosOld++;
	}
	return aktPosOld;
}