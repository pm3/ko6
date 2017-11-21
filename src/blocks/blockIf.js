import { arrayForEach }  from '../tko/tko.utils.js';
import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { computed }  from '../tko/tko.computed.js';
import { renderCtx, createStamp, duplicateCtx }  from '../renderCtx.js';

export default function blockIf(parent, tpl, ctx, level){

	if(tpl.children && tpl.children.length>0 && tpl.attrs && tpl.attrs['value'] && tpl.attrs['value'].call){
		
		var value = tpl.attrs['value'];
		var stamp =	createStamp(parent, 'if');
		if(level==0) ctx.rootNodes.push(stamp[1]);

		var ctx0 = duplicateCtx(ctx);
		ctx.subscribers.push(ctx0);

		var lastVal = false;

		var kv = computed(function(){
			var val2 = value(ctx.model, ctx);
			val2 = unwrap(val2) ? true : false;
			if(val2==lastVal) return;

			lastVal = val2;
			//remove children tpl
			dependencyDetection.ignore(function(){
				ctx0.dispose();
			});

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
