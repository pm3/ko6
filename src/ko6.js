import { observable, observableArray } from './tko/tko.observable.js';
import { computed }  from './tko/tko.computed.js';
import { renderCtx, createCtx }  from './renderCtx.js';
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
	var ctx = createCtx(model, null, null);
	parent.innerHtml = '';
	var tpl2 = parserko6(tpl);
	renderCtx(parent, tpl2, ctx, 0);
	window.rootCtx = ctx;
	return ctx;
};

export {
	ko6,
	parserko6,
	observable,
	observableArray,
	computed,
	renderCtx
};