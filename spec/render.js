import * as ko6 from '../src/ko6.js';

function render2node(tplText, model){
	const tpl = ko6.templateParser(tplText);
	const parentEl = document.createElement('div');
	const ctx = new ko6.Ctx(model, null, null, null);
	ko6.renderCtx(parentEl, tpl, ctx, 0);
	return parentEl;
}

function render2str(tplText, model){
	return render2node(tplText, model).innerHTML;
}

function Model(){
	var self = this;
	self.id = ko6.observable(3);
	self.text = ko6.observable('');
	self.rows = ko6.observableArray([]);
}


describe('rendering templates', function () {
  
  it('static', function () {

  	const html = `<p alt="123">text</p>`;
  	const str = render2str(html);
    expect(str).toEqual(`<p alt="123">text</p>`);
  });

  it('attribute binding', function () {

  	const html = `<p alt="123" id={m.id}>text</p>`;
  	const model = { id:3 };
  	const str = render2str(html, model);
    expect(str).toEqual(`<p alt="123" id="3">text</p>`);
  });

  it('attribute binding observable', function () {

  	const html = `<p alt="123" id={m.id}>text</p>`;
  	const model = new Model();
  	const str = render2str(html, model);
    expect(str).toEqual(`<p alt="123" id="3">text</p>`);
  });

  it('attribute binding observable 2', function () {

  	const html = `<p alt="123" id={m.id}>text</p>`;
  	const model = new Model();
  	const parentEl = render2node(html, model);
    expect(parentEl.innerHTML).toEqual(`<p alt="123" id="3">text</p>`);
    model.id(4);
    expect(parentEl.innerHTML).toEqual(`<p alt="123" id="4">text</p>`);
  });

  it('text block', function () {

  	const html = `<p alt="123" ko-text={m.text}></p>`;
  	const model = new Model();
  	const parentEl = render2node(html, model);
    expect(parentEl.innerHTML).toEqual(`<p alt="123"></p>`);
    model.text('test');
    expect(parentEl.innerHTML).toEqual(`<p alt="123">test</p>`);
    model.text('test <br>');
    expect(parentEl.innerHTML).toEqual(`<p alt="123">test &lt;br&gt;</p>`);
  });

  it('html block', function () {

  	const html = `<p alt="123" ko-html={m.text}></p>`;
  	const model = new Model();
  	const parentEl = render2node(html, model);
    expect(parentEl.innerHTML).toEqual(`<p alt="123"><!--ko-html--></p>`);
    model.text('test');
    expect(parentEl.innerHTML).toEqual(`<p alt="123">test<!--ko-html--></p>`);
    model.text('test <br>');
    expect(parentEl.innerHTML).toEqual(`<p alt="123">test <br><!--ko-html--></p>`);
  });

  it('foreach block string', function () {

  	const html = `<p ko-foreach={m.rows} ko-text={m}></p>`;
  	const model = new Model();
  	const parentEl = render2node(html, model);
    expect(parentEl.innerHTML).toEqual(`<p><!--ko-foreach--></p>`);
    model.rows([1,2,3]);
    expect(parentEl.innerHTML).toEqual(`<p>123<!--ko-foreach--></p>`);
    model.rows.push(4);
    expect(parentEl.innerHTML).toEqual(`<p>1234<!--ko-foreach--></p>`);
    model.rows.replace(3,5);
    expect(parentEl.innerHTML).toEqual(`<p>1254<!--ko-foreach--></p>`);
    model.rows.remove(2);
    expect(parentEl.innerHTML).toEqual(`<p>145<!--ko-foreach--></p>`);
  });

  it('foreach block obj', function () {

  	const html = `<p ko-foreach={m.rows} ko-text={m.value}></p>`;
  	const model = new Model();
  	function Item(v){
  		this.value = v;
  	}
  	const parentEl = render2node(html, model);
    var arr = [];
    model.rows(arr);
    expect(parentEl.innerHTML).toEqual(`<p><!--ko-foreach--></p>`);

    var arr = [new Item(0),new Item(1),new Item(2),new Item(3),new Item(4)];
    model.rows(arr);
    expect(parentEl.innerHTML).toEqual(`<p>01234<!--ko-foreach--></p>`);

    var arr = [arr[0],arr[2],arr[1],arr[3],arr[4]];
    model.rows(arr);
    expect(parentEl.innerHTML).toEqual(`<p>02134<!--ko-foreach--></p>`);

  });

});