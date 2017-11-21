import { arrayForEach }  from '../tko/tko.utils.js';
import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { computed }  from '../tko/tko.computed.js';
import { renderCtx, createStamp, duplicateCtx }  from '../renderCtx.js';

export default function blockComponent(parent, tpl, ctx, level){

	if(tpl.children && tpl.children.length>0 && tpl.attrs && tpl.attrs['_name']){
		
		var _name = tpl.attrs['_name'];
		var stamp =	createStamp(parent, 'component');
		if(level==0) ctx.rootNodes.push(stamp[1]);

		var lastName = '';
		var lastCtx = null;

		var kv = computed(function(){
			var val2 = value(ctx.model, ctx);
			
			if(val2==lastVal) return;
			lastVal = val2;

			//remove old componet
			if(lastCtx && lastCtx.dispose){
				dependencyDetection.ignore(function(){
					lastCtx.dispose();
				});
			}

			if(val2){
				//render children tpl
				dependencyDetection.ignore(function(){
					renderCtx(stamp, tpl.children, ctx0, 0);
				});
			} else {
			}
		}, this);
		kv();
		if(kv.getDependenciesCount()>0){
			ctx.subscribers.push(kv);
		} else {
			kv.dispose();
		}
	}

}

function renderComponent(parent, tpl, ctx, level, componentDef){

}