import { ignoreDependencies }  from '../ko3/ko.js';
import { renderCtx }  from '../renderCtx.js';

export default function blockIf(stamp, tpl, ctx){

	if(!(tpl && tpl.children && tpl.children.length>0)){
		console.warn("empty if" ,tpl);
		return;
	}

	if(tpl.params && tpl.params.call){

		let ctx0 = ctx.createChild();
		ctx0.lastVal = false;
		ctx.computed(function(){

			const value = ctx.expr(tpl.params, true) ? true : false;

			//check boolean expression change true/false
			if(value===ctx0.lastVal) return;
			ctx0.lastVal = value;

			ignoreDependencies(function(){
		
				//remove old children tpl
				ctx0.dispose();
		
				if(value){
					//render new children tpl
					renderCtx(stamp, tpl.children, ctx0, 0);
				}
			});
			return value;
		});
	}

}

blockIf.wrapElementWithBlockAttr = true;
