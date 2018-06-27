import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { renderCtx }  from '../renderCtx.js';

export default function blockIf(stamp, tpl, ctx0){

	let value = null;
	if(tpl.params && tpl.params.call){
		value = ctx0.expr(tpl.params);
		value = unwrap(value) ? true : false;

		//check boolean expression change true/false
		if(value===ctx0.lastVal) return;
		ctx0.lastVal = value;

		dependencyDetection.ignore(function(){
	
			//remove old children tpl
			ctx0.dispose();
	
			if(val2){
				//render new children tpl
				renderCtx(stamp, tpl.children, ctx0, 0);
			}
		});
	}

}

blockIf.wrapElementWithBlockAttr = true;
