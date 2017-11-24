import { observable, observableArray } from './tko/tko.observable.js';
import { computed, isPureComputed, pureComputed }  from './tko/tko.computed.js';
import { renderCtx, Ctx }  from './renderCtx.js';
import { parserko6 }  from './parserko6.js';

import blockComponent  from './blocks/blockComponent.js';
import blockForeach  from './blocks/blockForeach.js';
import blockIf  from './blocks/blockIf.js';
import blockHtml  from './blocks/blockHtml.js';
import blockTemplate  from './blocks/blockTemplate.js';

import clickHandler  from './bindings/click.js';

renderCtx.blocks['Component'] = blockComponent;
renderCtx.blocks['Foreach'] = blockForeach;
renderCtx.blocks['If'] = blockIf;
renderCtx.blocks['Html'] = blockHtml;
renderCtx.blocks['Template'] = blockTemplate;

renderCtx.bindingHandlers['click'] = clickHandler;

function ko6(parent, tpl, model){
	var ctx = new Ctx(model);
	parent.innerHtml = '';
	var tpl2 = parserko6(tpl);
	renderCtx(parent, tpl2, ctx, 0);
	return ctx;
};

function ko6c(parent, cname, params){

	var ctx2 = new Ctx(null);
	renderCtx.loadComponent(cname, function(modelFn, view){

		var model = params;
		if(modelFn){
			model = new modelFn(params);
		}
		ctx2.model = model;
		ctx2.root = model;
		ctx2.component = model;
		renderCtx(parent, view, ctx2, 0);
	});
	return ctx2;
};

export {
	ko6, ko6c,
	parserko6,
	observable,	observableArray,
	computed,
	isPureComputed, pureComputed,
	renderCtx
};