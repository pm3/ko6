
export default function blockHtml(stamp, tpl, ctx){

	if(tpl.params && tpl.params.call){

		let ctx0 = ctx.createChild();
		ctx.computed(function(){

			const value = ctx.expr(tpl.params, true);

			//remove old children tpl
			ctx0.dispose();
		
			if(typeof(value) != 'undefined' && value != null){
				//add new
				const div = document.createElement('div');
				div.innerHTML = ""+value;
				ctx0.rootNodes = Array.prototype.slice.call(div.childNodes);
				for (let i = 0; i < ctx0.rootNodes.length; i++) { 
				    stamp[0].insertBefore(ctx0.rootNodes[i], stamp[1]);
				}
			}
			return value;
		});
	}
}

blockHtml.virtualClosingTag = true;