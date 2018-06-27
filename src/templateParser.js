
export function templateParser(str, parseJsExression) {
	parseJsExression = parseJsExression || baseParseJsExression;
	const startTime = performance.now();

	const div = document.createElement('div');
	div.innerHTML = ""+str;
	const arr = [];
	walknodes(div.childNodes, arr, parseJsExression);
	const finishTime = performance.now();
  	console.log('templateParser', (finishTime-startTime));
  	const arr2 = [];
  	walknodes(div.childNodes, arr2, function(s){ return s});
  	console.log(JSON.stringify(arr2));
	return arr;
}

function walknodes(nodes, arr, parseJsExression){
	const lblockConfig = templateParser.blockConfig;
	for(let i=0, max=nodes.length; i<max; i++){
		const n = nodes[i];
		if(n.nodeType==Node.ELEMENT_NODE){
			
			const el = { tag: n.tagName.toLowerCase(), attrs:{}, children:[] };
			const $params = el.tag.indexOf('-')>=0 ? ['{'] : false;
			const blockAttrs = [];
			for (let a of n.attributes){
				if(lblockConfig && lblockConfig[a.name] && a.value.substr(0,1)=='{'){
					//block attribute
					blockAttrs.push(a);
				} else if($params){
					if($params.length>1) $params.push(', ');
					const s = a.value;
				    if(/^\{.*\}$/.test(s)){
				    	$params.push(a.name);
				    	$params.push(':');
				    	$params.push(s.slice(1,-1));
				    } else {
				    	$params.push(a.name);
				    	$params.push(':');
				    	$params.push("'");
				    	$params.push(s.replace("'", "\\'"));
				    	$params.push("'");
				    }
				} else {
					el.attrs[a.name] = parseJsExression(a.value);
				}
			} 
			if($params && $params.length>1) {
				$params.push('}');
				el.attrs['$params'] = parseJsExression($params.join(''));
			}
			walknodes(n.childNodes, el.children, parseJsExression);
		   	if(el.children.length==0) delete el.children;
		   	
		   	//convert attributes to block elements
		   	let parentArray = arr;
			for (let a in blockAttrs){
				const conf = lblockConfig[a.name];
				if(conf.wrapElementWithBlockAttr){

					//wrap el to block
			   		const el2 = { tag:an, attrs:{}, children:[] };
					el2.attrs['$params'] = parseJsExression(a.value);
			   		parentArray.push(el2);
			   		parentArray = el2.children;
				} else {

					//replace children to block
			   		const el2 = { tag:an, attrs:{}, children:el.children };
			   		el2.attrs['$params'] = parseJsExression(a.value);
			   		el.children = [ el2 ];
				}
			}
			parentArray.push(el);
		} else if(n.nodeType==Node.TEXT_NODE){

			const s = n.nodeValue.trim();
			if(s.length>0) arr.push(s);
		} else if(n.nodeType==Node.COMMENT_NODE){

			const s = n.nodeValue.trim().split(/\s+/, 2);
			const vname = s[0];
			const vparams = s[1];
			if(vname=='ko-text'){
				arr.push(parseJsExression('{'+vparams+'}'));
				continue;
			}
			if(lblockConfig && lblockConfig[vname]){
				//block virtual element
				const conf = lblockConfig[vname];
				if(conf.virtualClosingTag){
					//closingTag, no paired with end tag
					const el2 = { tag:vname, attrs:{} };
					el2.attrs['$params'] = parseJsExression('{'+vparams+'}');
					arr.push(el2);
				} else {
					//search close tag
					const pos = findEndVirtualBlock(nodes, '/'+vname, i);
					if(pos<i) throw 'unclosed virtual element '+n.nodeValue.trim();
					const el2 = { tag:vname, attrs:{}, children:[] };
					el2.attrs['$params'] = parseJsExression('{'+vparams+'}');
					walknodes(Array.prototype.slice.call(nodes, i+1, pos), el2.children, parseJsExression);
					arr.push(el2);
					i = pos;
				}
			}
			if(vname.substr(0,3)=='ko:'){
				const pos = findEndVirtualBlock(nodes, '/'+vname, i);
				if(pos<i) throw 'unclosed virtual element '+n.nodeValue.trim();
				const el2 = { tag:'ko-component', attrs:{$name:vname.substr(3)}, children:[] };
				el2.attrs['$params'] = parseJsExression(vparams);
				walknodes(Array.prototype.slice.call(nodes, i+1, pos), el2.children, parseJsExression);
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

function baseParseJsExression(s){
    if(/^\{.*\}$/.test(s)){
    	s = s.slice(1, -1);
    	if(/^\s*[a-z0-9]*\s*:/.test(s)){
    		s = '{'+s+'}';
    	}
        return new Function('m', 'ctx', 'return '+s);
    }
    return s;
}
