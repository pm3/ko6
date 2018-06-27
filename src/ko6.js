import { observable, observableArray, unwrap } from './tko/tko.observable.js';
import { computed, isPureComputed, pureComputed }  from './tko/tko.computed.js';
import { renderCtx, bindAttr, bindText, bindBlock, Ctx }  from './renderCtx.js';
import { templateParser }  from './templateParser.js';

import { blockComponent, registerComponent, componentLoaders }  from './blocks/blockComponent.js';
import blockForeach  from './blocks/blockForeach.js';
import blockIf  from './blocks/blockIf.js';
import blockHtml  from './blocks/blockHtml.js';
import blockTemplate  from './blocks/blockTemplate.js';

import clickHandler  from './bindings/click.js';

renderCtx.blocks['ko-component'] = blockComponent;
renderCtx.blocks['ko-foreach'] = blockForeach;
renderCtx.blocks['ko-if'] = blockIf;
renderCtx.blocks['ko-html'] = blockHtml;
renderCtx.blocks['ko-template'] = blockTemplate;

function blockText() { throw 'not implemented as block' };
blockText.virtualClosingTag = true;
renderCtx.blocks['ko-text'] = blockText;

templateParser.blockConfig = renderCtx.blocks;

renderCtx.bindingHandlers['click'] = clickHandler;
renderCtx.registerComponent = registerComponent;

function main(parent, cname, params){

	var ctx2 = new Ctx(null);
	registerComponent(cname, null, function(modelFn, view){

		let model = params || {};
		if(modelFn){
			model = new modelFn(model);
		}
		ctx2.model = model;
		ctx2.root = model;
		ctx2.component = model;
		const el = document.createComment('main');
		parent.appendChild(el);
		renderCtx([parent, el], view, ctx2, 0);
	});
	return ctx2;
};

function ko2json(obj){
	return JSON.stringify(obj, function(k,v) { return unwrap(v) });
}

export {
	main,
	templateParser,
	observable,	observableArray, unwrap,
	computed, pureComputed, isPureComputed,
	registerComponent, componentLoaders,
	renderCtx, bindAttr, bindText, bindBlock,
	ko2json
};