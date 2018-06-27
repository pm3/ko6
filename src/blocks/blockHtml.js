import { unwrap }  from '../tko/tko.observable.js';

export default function blockHtml(stamp, tpl, ctx0){

	let value = null;
	if(tpl.attrs && tpl.attrs['$params'] && tpl.attrs['$params'].call){
		value = ctx0.expr(tpl.attrs['$params']);
		value = unwrap(value);
		
		//remove old
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

	}
}

blockHtml.virtualClosingTag = true;