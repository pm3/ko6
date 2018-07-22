import { unwrap } from '../ko3/ko.js';

export default {
	init: function(el, val){
		val = unwrap(val);
		if(val.call) el.addEventListener("click", val);
	}
};
