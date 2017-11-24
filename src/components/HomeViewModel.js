import { arrayPushAll }  from '../tko/tko.utils.js';
import { ko6, parserko6, observable, observableArray, computed }  from '../ko6.js';

var startTime;
var lastMeasure;

function getCount(parent){
    var relevantChildren = 1;
    if(parent.subscribers){
	    var max = parent.subscribers.length;
    	for(var i=0; i < max; i++) relevantChildren += getCount(parent.subscribers[i]);
	}
    return relevantChildren;
}

var startMeasure = function (name) {
	startTime = performance.now();
	lastMeasure = name;
};
var stopMeasure = function () {
	window.setTimeout(function () {
		var stop = performance.now();
		console.log(lastMeasure + " took " + (stop - startTime));
		var countXtx = getCount(window.rootCtx);
		if(window.mainModel) window.mainModel.log(lastMeasure + " took " + (stop - startTime).toFixed(0)+"ms, ctx "+countXtx);
		if(window.gc) window.gc();
	}, 0);
};

export function HomeViewModel () {

	window.mainModel = this;

	var self = this;
	self.id = 1;

	self.log = observable();

	self.step = observable(1);

	self.tpl1 = computed( 
		function(){
			if(self.step()==1) return parserko6('<p><i><span>step </span>{m.step()}</i></p>');
			if(self.step()==2) return parserko6('<p><b><span>step </span>{m.step()}</b></p>');
			if(self.step()==3) return parserko6('<p><b><i><span>step </span>{m.step()}</i></b></p>');
			return parserko6('<p><span>step </span>{m.step().length}</p>');
		}, this);

	function _random(max) {
		return Math.round(Math.random() * 1000) % max;
	}

	function buildData(count) {
		var adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
		var colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
		var nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];
		var data = [];
		for (var i = 0; i < count; i++) {
			data.push(new ItemViewModel({
				id: self.id++,
				label: adjectives[_random(adjectives.length)] + " " + colours[_random(colours.length)] + " " + nouns[_random(nouns.length)]
			}, self));
		}
		return data;
	}

	self.selected = observable(null);
	self.data = observableArray();

	self.run = function () {
		startMeasure("run");
		self.data(buildData(1000));
		self.selected(null);
		stopMeasure();
	};

	self.runLots = function () {
		startMeasure("runLots");
		self.data(buildData(10000));
		self.selected(null);
		stopMeasure();
	};

	self.add = function () {
		startMeasure("add");
		arrayPushAll(self.data, buildData(1000));
		stopMeasure();
	};

	self.update = function () {
		startMeasure("update");
		var tmp = self.data();
		for (let i = 0; i < tmp.length; i += 10) {
			tmp[i].label(tmp[i].label() + ' !!!');
		}
		stopMeasure();
	};

	self.clear = function () {
		startMeasure("clear");
		self.data.removeAll();
		self.selected(null);
		stopMeasure();
	};

	self.swapRows = function () {
		startMeasure("swapRows");
		var tmp = self.data();
		if (tmp.length >= 10) {
			var a = tmp[4];
			tmp[4] = tmp[9];
			tmp[9] = a;
			self.data(tmp);
		}
		stopMeasure();
	};

	self.del1000 = function () {
		startMeasure("delete1000");
		var max = self.data().length;
		if(max>1000) self.data.splice(max-1000, max);
		console.log('new size', self.data().length);
		stopMeasure();
	};


	self.select = function (id) {
		startMeasure("select");
		self.selected(id);
		stopMeasure();
	};

	self.del = function (item) {
		startMeasure("delete");
		self.data.remove(d => d.id === item.id);
		stopMeasure();
	};

};

export function ItemViewModel (data, parent) {
	var self = this;

	self.id = data.id;
	self.label = observable(data.label);

	self.del = function () {
		parent.del(self);
	};

	self.select = function () {
		parent.select(self.id);
	};
};
