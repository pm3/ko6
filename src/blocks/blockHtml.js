import { unwrap, dependencyDetection }  from '../tko/tko.observable.js';
import { computed }  from '../tko/tko.computed.js';
import { createStamp }  from '../renderCtx.js';

export default function blockHtml(parent, tpl, ctx, level){

	if(tpl.attrs && tpl.attrs['value'] && tpl.attrs['value'].call){
		
		var value = tpl.attrs['value'];
		var stamp =	createStamp(parent, 'html');
		if(level==0) ctx.rootNodes.push(stamp[1]);

		var children = [];
		var dispose = function(){
			for (var i = 0; i < children.length; i++) { 
				stamp[0].removeChild(children[i]);
			}
			children = [];
		};
		ctx.subscribers.push({ dispose: dispose });

		var kv = computed(function(){
				var val2 = value(ctx.model, ctx);
				val2 = unwrap(val2);

				//remove old
				dispose();
  				if(typeof(val2) != 'undefined' && val2 != null){
					//add new
					var div = document.createElement('div');
					div.innerHTML = ""+val2;
					children = Array.prototype.slice.call(div.childNodes);
					for (var i = 0; i < children.length; i++) { 
					    stamp[0].insertBefore(children[i], stamp[1]);
					}
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
