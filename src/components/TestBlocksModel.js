import { arrayPushAll }  from '../tko/tko.utils.js';
import * as ko6 from '../ko6.js';

export function TestBlocksModel () {

	var self = this;

	self.step = ko6.observable(1);

	self.tpl1 = ko6.computed( 
		function(){
			if(self.step()==1) return parserko6('<p><i><span>step </span>{m.step()}</i></p>');
			if(self.step()==2) return parserko6('<p><b><span>step </span>{m.step()}</b></p>');
			if(self.step()==3) return parserko6('<p><b><i><span>step </span>{m.step()}</i></b></p>');
			return parserko6('<p><span>step </span>{m.step().length}</p>');
		}, this);

}

setInterval(function(){ 
	var raw = window.mainModel.step()+1;
	if(raw>5) raw = 1;
	window.mainModel.step(raw);
}, 1000);


ko6.registerComponent('TestBlocks', { model:TestBlocksModel, templateUrl: 'src/components/TestBlocks.html' });