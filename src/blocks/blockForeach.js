import { arrayForEach }  from '../tko/tko.utils.js';
import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { computed }  from '../tko/tko.computed.js';
import { renderCtx, createCtx, createStamp }  from '../renderCtx.js';

export default function blockForeach(parent, tpl, ctx, level){
	if(!(tpl && tpl.children && tpl.children.length>0)){
		console.log("empty foreach" ,tpl);
	}
	if(tpl.attrs && tpl.attrs['items'] && tpl.attrs['items'].call){

		var items = tpl.attrs['items'];
		var ctx0 = { subctx : [], tpl : tpl, ctx: ctx };
		ctx0.dispose = function() {
			arrayForEach(ctx0.subctx, function(e) { if(e.dispose) e.dispose(); } );
			ctx0.subctx = [];
		};
		ctx.subscribers.push(ctx0);

		var stamp =	createStamp(parent, 'foreach');
		if(level==0) ctx.rootNodes.push(stamp[1]);

		var renderItems = function(items2){

			if(items2.length==0){
				//remove all
				console.log('removeAll');
				arrayForEach(ctx0.subctx, function(e) { e.dispose(); });
				ctx0.subctx = [];
				return;
			}

			var eqMin = arrEq(ctx0.subctx, items2);

			if(eqMin==ctx0.subctx.length){
				//only Append
				console.log('onlyAppend', eqMin);
				for(var i=eqMin; i<items2.length; i++) appendItem(items2[i], stamp, ctx0);
				return;
			}
			if(ctx0.subctx.length>items2.length && eqMin==items2.length){
				//only remove
				console.log('onlyRemove', eqMin, ctx0.subctx.length, '<', items2.length);
				for(var i=ctx0.subctx.length-1; i>=items2.length; i--) ctx0.subctx[i].dispose();
				ctx0.subctx = ctx0.subctx.slice(0, items2.length);
				console.log('onlyRemove', eqMin, ctx0.subctx.length, '=', items2.length);
				return;
			}

			if(Map && Map.call){
				//merge contenxt in Map
				mergeItemsMap(ctx0, items2, eqMin, stamp[0], stamp[1], new Map());
				return;
			}

			arrayForEach(ctx0.subctx, function(e) { e.dispose(); });
			ctx0.subctx = [];
			for(var i=0; i<items2.length; i++) appendItem(items2[i], stamp, ctx0);
		};
		
		var kv = computed(function(){
				var val2 = items(ctx.model, ctx);
				val2 = unwrap(val2);
				dependencyDetection.ignore(function(){
					renderItems(val2);
				});
		}, this);
		kv();
		if(kv.getDependenciesCount()>0){
			ctx.subscribers.push(kv);
		} else {
			kv.dispose();
		}
	}
};

function arrEq(subctx, items2, start){
	start = start || 0;
	var max = subctx.length<items2.length ? subctx.length : items2.length;
	for(var i = 0; i<max; i++){
		if(subctx[i].model!=items2[i]) return i;
	}
	return max;
}

function appendItem(m2, parent, ctx0){
	var ctx2 = createCtx(m2, ctx0.ctx, null);
	renderCtx(parent, ctx0.tpl.children, ctx2, 0);
	ctx0.subctx.push(ctx2);
	return ctx2;
}

function mergeItemsMap(ctx0, items2, eqMin, parent, stamp, oldMap){
	var old = ctx0.subctx;
	//index old
	for(var i=eqMin; i<ctx0.subctx.length; i++){
		var ctx2 = ctx0.subctx[i];
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

	ctx0.subctx = ctx0.subctx.slice(0, eqMin);
	var aktPosOld = nextOldPos(old, eqMin);
	for(var i=eqMin; i<items2.length; i++){
		var m2 = items2[i];
		if(aktPosOld<old.length && old[aktPosOld].model===m2) {
			//the same models, all is ok
			ctx0.subctx.push(old[aktPosOld]);
			old[aktPosOld] = null;
			aktPosOld = nextOldPos(old, aktPosOld+1);
			continue;
		}
		var beforeNode = aktPosOld<old.length ? old[aktPosOld].rootNodes[0] : stamp;
		var ctx2 = reusedCtx[i];
		if(ctx2){
			//reuse
			arrayForEach(ctx2.rootNodes, function(n) { 
				parent.insertBefore(n,beforeNode);
			});
			ctx0.subctx.push(ctx2);
			old[ctx2._oldIndex] = null;
		} else {
			//create new
			ctx2 = appendItem(m2, beforeNode ? [ parent, beforeNode] : parent , ctx0);
			ctx0.subctx.push(ctx2);
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