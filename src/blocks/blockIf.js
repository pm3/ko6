import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { renderCtx }  from '../renderCtx.js';

export default function blockIf(stamp, tpl, ctx0, level){

	if(tpl.children && tpl.children.length>0 && tpl.attrs && tpl.attrs['value'] && tpl.attrs['value'].call){
		
		var value = tpl.attrs['value'];
		var val2 = ctx0.expr(value);
		val2 = unwrap(val2) ? true : false;

		//check boolean expression change true/false
		if(val2===ctx0.lastVal) return;
		ctx0.lastVal = val2;

		//remove old children tpl
		dependencyDetection.ignore(function(){
			ctx0.dispose();
		});

		if(val2){
			//render new children tpl
			dependencyDetection.ignore(function(){
				renderCtx(stamp, tpl.children, ctx0, 0);
			});
		}
	}

}
