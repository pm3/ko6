import * as ko6 from '../src/ko6.js';

var templateOptions = {
	exprCreator: function(s){ return s}
};

describe('parsing templates', function () {
  
  it('static', function () {

  	const html = `<p alt="123">text</p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{"alt":"123"},"children":["text"]}]`);
  });

  it('static 2 attrs', function () {

  	const html = `<p id="123" class="base">text</p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{"id":"123","class":"base"},"children":["text"]}]`);
  });

  it('simple binding attribute', function () {

  	const html = `<p alt="123" id={m.id}>text</p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{"alt":"123"},"bindings":{"id":"m.id"},"children":["text"]}]`);
  });
 
  it('quoted simple binding attribute', function () {

  	const html = `<p alt="123" id="{m.id}" class="{m.mode}">text</p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{"alt":"123"},"bindings":{"id":"m.id","class":"m.mode"},"children":["text"]}]`);
  });

  it('object binding attribute', function () {

  	const html = `<p extend="{id: m.id, class: [m.class, m.class2] }">text</p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{},"bindings":{"extend":"{id: m.id, class: [m.class, m.class2] }"},"children":["text"]}]`);
  });
 
  it('complex binding attribute', function () {

  	const html = `<p click="{ function() { m.run([1,'3'], m.text) })() }">text</p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{},"bindings":{"click":" function() { m.run([1,'3'], m.text) })() "},"children":["text"]}]`);
  });

  it('text block virt element', function () {

  	const html = `<p class="base"><!--ko-text m.name--></p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{"class":"base"},"children":[{"block":"ko-text","params":"m.name"}]}]`);
  });

  it('html block virt element', function () {

  	const html = `<p class="base"><!--ko-html m.name--></p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{"class":"base"},"children":[{"block":"ko-html","params":"m.name"}]}]`);
  });

  it('text block attribute', function () {

  	const html = `<p class="base" ko-text={m.name}></p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{"class":"base"},"children":[{"block":"ko-text","params":"m.name"}]}]`);
  });

  it('text block attribute - remove children', function () {

  	const html = `<p class="base" ko-text={m.name}><span>dead code</span></p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{"class":"base"},"children":[{"block":"ko-text","params":"m.name"}]}]`);
  });

  it('text block custom element', function () {

  	const html = `<p class="base"><ko-text $params={m.name} /></p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{"class":"base"},"children":[{"block":"ko-text","params":"m.name"}]}]`);
  });

  it('if block virtual element', function () {

  	const html = `<!--ko-if m.count()>3--><!--ko-text m.count--><!--/ko-if-->`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"block":"ko-if","params":"m.count()>3","children":[{"block":"ko-text","params":"m.count"}]}]`);
  });

  it('if block virtual element, inside element', function () {

  	const html = `<!--ko-if m.count()>3--><span>big</span><!--/ko-if-->`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"block":"ko-if","params":"m.count()>3","children":[{"tag":"span","attrs":{},"children":["big"]}]}]`);
  });

  it('if block custom element', function () {

  	const html = `<ko-if $params="{m.count()>3}"><!--ko-text m.count--></ko-if>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"block":"ko-if","params":"m.count()>3","children":[{"block":"ko-text","params":"m.count"}]}]`);
  });

  it('if block custom element 2', function () {

  	const html = `<ko-if $params="{m.count()>3}"><span ko-text={m.count}></span></ko-if>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"block":"ko-if","params":"m.count()>3","children":[{"tag":"span","attrs":{},"children":[{"block":"ko-text","params":"m.count"}]}]}]`);
  });

  it('if block attribute wrap element', function () {

  	const html = `<p ko-if="{m.count()>3}"><span ko-text={m.count}></span></p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"block":"ko-if","params":"m.count()>3","children":[{"tag":"p","attrs":{},"children":[{"tag":"span","attrs":{},"children":[{"block":"ko-text","params":"m.count"}]}]}]}]`);
  });

  it('if block attribute wrap element with ko-text', function () {

  	const html = `<p ko-if="{m.count()>3}" ko-text={m.count}></p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"block":"ko-if","params":"m.count()>3","children":[{"tag":"p","attrs":{},"children":[{"block":"ko-text","params":"m.count"}]}]}]`);
  });

  it('if block attribute wrap element with ko-text 2', function () {

  	const html = `<p ko-text={m.count} ko-if="{m.count()>3}"></p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"block":"ko-if","params":"m.count()>3","children":[{"tag":"p","attrs":{},"children":[{"block":"ko-text","params":"m.count"}]}]}]`);
  });

  it('foreach virtual element block', function () {

  	const html = `<!--ko-foreach m.data--><span ko-text={m.count}></span><!--/ko-foreach-->`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"block":"ko-foreach","params":"m.data","children":[{"tag":"span","attrs":{},"children":[{"block":"ko-text","params":"m.count"}]}]}]`);
  });

  it('foreach block attribute element', function () {

  	const html = `<p ko-foreach="{m.data}"><span ko-text={m.count}></span></p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{},"children":[{"block":"ko-foreach","params":"m.data","children":[{"tag":"span","attrs":{},"children":[{"block":"ko-text","params":"m.count"}]}]}]}]`);
  });

  it('foreach block attribute with ko-text', function () {

  	const html = `<p ko-foreach="{m.data}" ko-text={m.count}></p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{},"children":[{"block":"ko-foreach","params":"m.data","children":[{"block":"ko-text","params":"m.count"}]}]}]`);
  });

  it('foreach block attribute with ko-text 2', function () {

  	const html = `<p ko-text={m.count} ko-foreach="{m.data}"></p>`;
  	const parsed = ko6.templateParser(html, templateOptions);
  	const parsedJson = JSON.stringify(parsed);
    expect(parsedJson).toEqual(`[{"tag":"p","attrs":{},"children":[{"block":"ko-text","params":"m.count"}]}]`);
  });

});
