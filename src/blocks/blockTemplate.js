import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { renderCtx }  from '../renderCtx.js';

export default function blockTemplate(stamp, tpl, ctx0){

	let value = null;
	if(tpl.params && tpl.params.call){
		value = ctx0.expr(tpl.params);
		value = unwrap(value);

		dependencyDetection.ignore(function(){

			//remove old template
			ctx0.dispose();

			if(value){
				//render value tpl
				renderCtx(stamp, value, ctx0, 0);
			}

		});

	}

}

blockTemplate.virtualClosingTag = true;