import { unwrap } from '../tko/tko.observable.js';

export default {
	init: function(el, val){
		val = unwrap(val);
		if(val.call) el.addEventListener("click", val);
	}
};
