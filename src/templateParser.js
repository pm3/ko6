
export function templateParser(str) {
	const startTime = performance.now();

	const div = document.createElement('div');
	div.innerHTML = ""+str;
	const arr = [];
	walknodes(div.childNodes, arr);
	const finishTime = performance.now();
  	console.log('templateParser', (finishTime-startTime), JSON.stringify(arr));
	return arr;
}

function walknodes(nodes, arr){
	const lblockConfig = templateParser.blockConfig;
	for(let i=0, max=nodes.length; i<max; i++){
		const n = nodes[i];
		if(n.nodeType==Node.ELEMENT_NODE){
			//element, is html tag or block
			const isElement = n.tagName.indexOf('-')<0;
			const el = isElement 
				? { tag:n.tagName.toLowerCase(), attrs:{} } 
				: { block:n.tagName.toLowerCase() };
			const subBlockAttrs = [];
			const blockParams = !isElement ? ['{'] : false;
			for (let a of n.attributes){
				if(lblockConfig && lblockConfig[a.name] && /^\{.*\}$/.test(a.value)){
					//block attribute
					subBlockAttrs.push(a);
				} else if(blockParams){
					//parse params in block custom element
					if(a.name=='$name'){
						//must by consant, if is expression use params
						el.name = a.value;
					    continue;
					}
					if(a.name=='$params'){
						el.params = parseJsExression(a.value);
					    continue;
					}
					if(blockParams.length>1) blockParams.push(', ');
					const s = a.value;
				    if(/^\{.*\}$/.test(s)){
				    	blockParams.push(a.name, ':', s.slice(1,-1));
				    } else {
				    	blockParams.push(a.name, ':', "'", s.replace("'", "\\'"), "'");
				    }
				} else if(/^\{.*\}$/.test(a.value)){
					if(!el.bindings) el.bindings ={};
					el.bindings[a.name] = parseJsExression(a.value);
				} else {
					el.attrs[a.name] = a.value;
				}
			} 
			if(blockParams && blockParams.length>1) {
				if(el.params){
					console.warm('ignore block attributes, exist attribude $params '+el.block+'['+el.params+']');
				} else {
					blockParams.push('}');
					el.params = blockParams.join('');
				}
				if(lblockConfig && !lblockConfig[el.block]){
					if(el.name){
						console.warm('ignore component attribute $name, use ellement name '+el.block+'['+el.params+']');
					}
					el.name = el.block;
					el.block = 'ko-component';
				}
			}
			el.children = [];
			walknodes(n.childNodes, el.children);
		   	if(el.children.length==0) delete el.children;
		   	
		   	//convert attributes to block elements
		   	let parentArray = arr;
			for (let a of subBlockAttrs){
				const conf = lblockConfig[a.name];
				if(conf.wrapElementWithBlockAttr){

					//wrap el to block
			   		const el2 = { block:a.name, params:parseJsExression(a.value), children:[] };
			   		parentArray.push(el2);
			   		parentArray = el2.children;
				} else {

					//replace children to block
			   		const el2 = { block:a.name, params:parseJsExression(a.value), children:el.children };
				   	if(el2.children && el2.children.length==0) delete el2.children;
				   	if(el2.children && conf.virtualClosingTag) delete el2.children;
			   		el.children = [ el2 ];
				}
			}
			parentArray.push(el);
		} else if(n.nodeType==Node.TEXT_NODE){
			//text node
			const s = n.nodeValue.trim();
			if(s.length>0) arr.push(s);
		} else if(n.nodeType==Node.COMMENT_NODE){
			//comment, check virtual nodes
			const s = n.nodeValue.trim().split(/\s+/, 2);
			const vname = s[0];
			const vparams = s[1];
			if(lblockConfig && lblockConfig[vname]){
				//block virtual element
				const conf = lblockConfig[vname];
				if(conf.virtualClosingTag){
					//closingTag, no paired with end tag
					const el2 = { block:vname, params:parseJsExression('{'+vparams+'}') };
					arr.push(el2);
				} else {
					//search close tag
					const pos = findEndVirtualBlock(nodes, '/'+vname, i);
					if(pos<i) throw 'unclosed virtual element '+n.nodeValue.trim();
					const el2 = { block:vname, params:parseJsExression('{'+vparams+'}'), children:[] };
					walknodes(Array.prototype.slice.call(nodes, i+1, pos), el2.children, parseJsExression);
				   	if(el2.children.length==0) delete el2.children;
					arr.push(el2);
					i = pos;
				}
			}
			if(vname.substr(0,3)=='ko:'){
				const pos = findEndVirtualBlock(nodes, '/'+vname, i);
				if(pos<i) throw 'unclosed virtual element '+n.nodeValue.trim();
				const el2 = { block:'ko-component', name:vname.substr(3), params:parseJsExression('{'+vparams+'}'), children:[] };
				walknodes(Array.prototype.slice.call(nodes, i+1, pos), el2.children, parseJsExression);
			   	if(el2.children.length==0) delete el2.children;
				arr.push(el2);
				i = pos;
			}
		}
	}
}

function findEndVirtualBlock(nodes, blockName, pos){
	for(let i=pos+1, max=nodes.length; i<max; i++){
		const n = nodes[i];
		if(n.nodeType==Node.COMMENT_NODE && n.nodeValue.trim()==blockName) return i;
	}
	return -1;
}

function parseJsExression(s){
	if(/^\{.*\}$/.test(s)){
		if(/^{\s*[a-z0-9]+\s*:/.test(s)) return s;	
		return s.slice(1, -1);
	} 
	throw 'parse expression error, no wraped expression to {} '+s;
}
