import { dependencyDetection }  from '../tko/tko.observable.js';
import { renderCtx }  from '../renderCtx.js';

export default function blockTemplate(stamp, tpl, ctx){

	let value = null;
	if(tpl.params && tpl.params.call){

		let ctx0 = ctx.createChild();
		ctx.computed(function(){

			const value = ctx.expr(tpl.params, true);

			dependencyDetection.ignore(function(){

				//remove old template
				ctx0.dispose();

				if(value){
					//render value tpl
					renderCtx(stamp, value, ctx0, 0);
				}

			});

		});

	}

}

blockTemplate.virtualClosingTag = true;