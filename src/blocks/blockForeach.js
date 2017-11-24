import { arrayForEach }  from '../tko/tko.utils.js';
import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { computed }  from '../tko/tko.computed.js';
import { renderCtx }  from '../renderCtx.js';

export default function blockForeach(stamp, tpl, ctx0, level){
	if(!(tpl && tpl.children && tpl.children.length>0)){

		console.log("empty foreach" ,tpl);
		return;
	}
	if(tpl.attrs && tpl.attrs['items'] && tpl.attrs['items'].call){

		var items = tpl.attrs['items'];
		var val2 = ctx0.expr(items);
		val2 = unwrap(val2);
		dependencyDetection.ignore(function(){
			renderItems(val2, stamp, tpl, ctx0);
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

	var eqMin = arrEq(ctx0.subscribers, items2);

	if(eqMin==ctx0.subscribers.length){
		//only Append
		console.log('onlyAppend', eqMin);
		for(var i=eqMin; i<items2.length; i++) appendItem(items2[i], stamp, tpl, ctx0);
		return;
	}
	if(ctx0.subscribers.length>items2.length && eqMin==items2.length){
		//only remove
		console.log('onlyRemove', eqMin, ctx0.subscribers.length, '<', items2.length);
		for(var i=ctx0.subscribers.length-1; i>=items2.length; i--) ctx0.subscribers[i].dispose();
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
	for(var i=0; i<items2.length; i++) appendItem(items2[i], stamp, tpl, ctx0);

};

function arrEq(contexts, items2, start){
	start = start || 0;
	var max = contexts.length<items2.length ? contexts.length : items2.length;
	for(var i = 0; i<max; i++){
		if(contexts[i].model!=items2[i]) return i;
	}
	return max;
}

function appendItem(m2, stamp, tpl, ctx0){
	var ctx2 = ctx0.createChild(m2);
	renderCtx(stamp, tpl.children, ctx2, 0);
	return ctx2;
}

function mergeItemsMap(items2, eqMin, tpl, ctx0, parent, stamp1){
	var oldMap = new Map();
	var old = ctx0.subscribers;
	//index old
	for(var i=eqMin; i<old.length; i++){
		var ctx2 = old[i];
		ctx2._oldIndex = i;
		ctx2._newIndex = -1;
		oldMap.set(ctx2.model, ctx2);
	}
	//index new
	var reusedCtx = [];
	for(var i=eqMin; i<items2.length; i++){
		var ctx2 = oldMap.get(items2[i]);
		if(ctx2) { 
			ctx2._newIndex = i; 
			reusedCtx[i] = ctx2; 
		}
	}

	ctx0.subscribers = ctx0.subscribers.slice(0, eqMin);
	var aktPosOld = nextOldPos(old, eqMin);
	for(var i=eqMin; i<items2.length; i++){
		var m2 = items2[i];
		if(aktPosOld<old.length && old[aktPosOld].model===m2) {
			//the same models, all is ok
			ctx0.subscribers.push(old[aktPosOld]);
			old[aktPosOld] = null;
			aktPosOld = nextOldPos(old, aktPosOld+1);
			continue;
		}
		var beforeNode = aktPosOld<old.length ? old[aktPosOld].rootNodes[0] : stamp1;
		var ctx2 = reusedCtx[i];
		if(ctx2){
			//reuse
			arrayForEach(ctx2.rootNodes, function(n) { 
				parent.insertBefore(n,beforeNode);
			});
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
		var v = old[aktPosOld];
		if(v!=null){
			if(v._newIndex>=0) return aktPosOld;
			v.dispose();
			old[aktPosOld] = null;
		}
		aktPosOld++;
	}
	return aktPosOld;
}