import { unwrap }  from '../tko/tko.observable.js';

export default function blockHtml(stamp, tpl, ctx0, level){

	if(tpl.attrs && tpl.attrs['value'] && tpl.attrs['value'].call){
		
		var value = tpl.attrs['value'];
		var val2 = ctx0.expr(value);
		val2 = unwrap(val2);

		//remove old
		ctx0.dispose();

		if(typeof(val2) != 'undefined' && val2 != null){
			//add new
			var div = document.createElement('div');
			div.innerHTML = ""+val2;
			ctx0.rootNodes = Array.prototype.slice.call(div.childNodes);
			for (var i = 0; i < ctx0.rootNodes.length; i++) { 
			    stamp[0].insertBefore(ctx0.rootNodes[i], stamp[1]);
			}
		}

	}
}
