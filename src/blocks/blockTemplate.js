import { arrayForEach }  from '../tko/tko.utils.js';
import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { computed }  from '../tko/tko.computed.js';
import { renderCtx, createStamp, duplicateCtx }  from '../renderCtx.js';


export default function blockTemplate(parent, tpl, ctx, level){

	if(tpl.attrs && tpl.attrs['value'] && tpl.attrs['value'].call){
		
		var value = tpl.attrs['value'];
		var stamp =	createStamp(parent, 'template');
		if(level==0) ctx.rootNodes.push(stamp[1]);

		var ctx0 = duplicateCtx(ctx);
		ctx.subscribers.push(ctx0);

		var kv = computed(function(){
			var val2 = value(ctx.model, ctx);
			val2 = unwrap(val2);
			console.log('template',	val2);

			dependencyDetection.ignore(function(){
				ctx0.dispose();
			});

			if(val2){
				//render value tpl
				dependencyDetection.ignore(function(){
					renderCtx(stamp, val2, ctx0, 0);
				});
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
