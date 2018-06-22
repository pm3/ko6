
export function templateParser (str) {
	const startTime = performance.now();

	const div = document.createElement('div');
	div.innerHTML = ""+str;
	let arr = []
	for (let n of div.childNodes) { 
		node(n, arr)
	}
	const finishTime = performance.now();
  	console.log('parserko6', (finishTime-startTime));
	return arr
}

function node(n, arr){
	if(n.nodeType==Node.ELEMENT_NODE){
		const tag = n.tagName==n.tagName.toUpperCase() ? n.tagName.toLowerCase() : n.tagName
		let el = { tag, attrs:{}, children:[] }
		for (let a of n.attributes) el.attrs[a.name] = parseJsExression(a.value)
	   	for (let n2 of n.childNodes) node(n2, el.children)
	   	if(el.children.length==0) delete el.children
	   	if(el.attrs.foreach){
	   		let el2 = { tag:'Foreach', attrs:{ items:el.attrs.foreach }, children:el.children }
	   		el.children = [ el2 ]
	   		delete el.attrs.foreach
	   	}
		arr.push(el)
	} else if(n.nodeType==Node.TEXT_NODE){
		arr.push(parseJsExression(n.nodeValue))
	}
}

function parseJsExression(s){
    if(s && s.charAt(0)=='{' && s.charAt(s.length-1)=='}'){
    	s = s.slice(1, s.length-1);
        return new Function('m', 'ctx', 'return '+s);
    }
    return s;
}
