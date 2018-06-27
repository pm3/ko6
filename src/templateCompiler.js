import { templateParser }   from './templateParser.js';

export function templateCompiler(str){
	const arr = templateParser(str, (s) => s);
	var counter = { val:1, next : function() { return this.val++ } };
	const source = generateBlockFunction(arr, counter);
	return source;
}

function generateBlockFunction(tpl, counter){
	const sb = [];
	sb.push('function(parent, ctx) { \n');
	generateFragment(tpl, sb, 'parent', counter, 0);
	sb.push('}');
	return sb.join('');
}

function generateFragment(tpl, sb, parent, counter, level){
	if(Array.isArray(tpl)){
		//is array
		for(let i=0, max=tpl.length; i<max; i++){
			generateFragment(tpl[i], sb, parent, counter, level);
		}
	} else if(tpl && tpl.tag){
		if(tpl.tag.indexOf('-')>=0){
	   		//is block
			const c =  counter.next();
			if(level==0) {
				sb.push('const stamp'+c+' = ['+parent+'[0], document.createComment("'+tpl.tag+'")];\n');
				sb.push(parent+'[0].insertBefore(stamp'+c+'[1], '+parent+'[1]);\n');
			} else {
				sb.push('const stamp'+c+' = ['+parent+', document.createComment("'+tpl.tag+'")];\n');
				sb.push(parent+'.appendChild(stamp'+c+'[1]);\n');
			}
			sb.push('const def'+c+' = {tag:"'+tpl.tag+'", attrs:{} };\n');
			for (let key in tpl.attrs) {
				const val = tpl.attrs[key];
				if(/^\{.*\}$/.test(val)){
					sb.push('def'+c+'.attrs["'+key+'"] = '+compilerParseJsExression(val)+';\n');
				} else {
					sb.push('def'+c+'.attrs["'+key+'"] = "'+val+'";\n');
				}
			}
			if(tpl.children)
				sb.push('def'+c+'.children = '+generateBlockFunction(tpl.children, counter)+';\n');
				sb.push('def'+c+'.children.generated = true;\n');
				sb.push('bindBlock(stamp'+c+', def'+c+', ctx);\n');
		} else {
			//is html element
			const elname = 'n'+counter.next();
			sb.push('const '+elname+' = document.createElement("'+tpl.tag+'");\n');
			for (let key in tpl.attrs) {
				const val = tpl.attrs[key];
				if(/^\{.*\}$/.test(val)){
					sb.push('bindAttr('+elname+', "'+key+'", '+compilerParseJsExression(val)+', ctx);\n');
				} else {
					if(key=='class'){
						sb.push(elname+'.className = "'+val+'";\n');
					} else {
						sb.push(elname+'.setAttribute("'+key+'", "'+val+'");\n');
					}
				}
			}
			if(level==0) {
				sb.push('ctx.rootNodes.push('+elname+');\n');
				sb.push('parent[0].insertBefore('+elname+', parent[1]);\n');
			} else {
				sb.push(parent+'.appendChild('+elname+');\n');
			}
			if(tpl.children) generateFragment(tpl.children, sb, elname, counter, level+1);
		}
	} else if(/^\{.*\}$/.test(tpl)){
		//is text expresssion
		const nname = 'n'+counter.next();
		sb.push('const '+nname+' = document.createTextNode("");\n');
		sb.push('bindText('+nname+', '+compilerParseJsExression(tpl)+', ctx);\n');
		if(level==0) {
			sb.push('ctx.rootNodes.push('+nname+');\n');
			sb.push('parent[0].insertBefore('+nname+', parent[0]);\n');
		} else {
			sb.push(parent+'.appendChild('+nname+');\n');
		}

	} else if(tpl !== undefined || tpl !== null){
		//is static text
		if(level==0) {
			const nname = 'n'+counter.next();
			sb.push('const '+nname+' = document.createTextNode("'+tpl+'");\n');
			sb.push('ctx.rootNodes.push('+nname+');\n');
			sb.push('parent[0].insertBefore('+nname+', parent[0]);\n');
		} else {
			sb.push(parent+'.appendChild(document.createTextNode("'+tpl+'"));\n');
		}
	}
}

function compilerParseJsExression(s){
    if(/^\{.*\}$/.test(s)){
    	s = s.slice(1, -1);
    	if(/^\s*[a-z0-9]*\s*:/.test(s)){
    		s = '{'+s+'}';
    	}
        return 'function(m,ctx){ return '+s+' }';
    }
    return s;
}
