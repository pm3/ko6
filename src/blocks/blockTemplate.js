import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { renderCtx }  from '../renderCtx.js';

export default function blockTemplate(stamp, tpl, ctx0, level){

	if(tpl.attrs && tpl.attrs['value'] && tpl.attrs['value'].call){
		
		var value = tpl.attrs['value'];
		var val2 = ctx0.expr(value);
		val2 = unwrap(val2);

		//remove old template
		dependencyDetection.ignore(function(){
			ctx0.dispose();
		});

		if(val2){
			//render value tpl
			dependencyDetection.ignore(function(){
				renderCtx(stamp, val2, ctx0, 0);
			});
		}

	}

}
