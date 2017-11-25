import lexer from './himalaya/lexer.js'
import parser from './himalaya/parser.js'
import {
  voidTags,
  closingTags,
  childlessTags,
  closingTagAncestorBreakers
} from './himalaya/tags.js'

import {
  startsWith,
  endsWith
} from './himalaya/compat.js'


export const parseDefaults = {
  voidTags,
  closingTags,
  childlessTags,
  closingTagAncestorBreakers
}

export function templateParser (str, options = parseDefaults) {
  const startTime = performance.now();

  const tokens = lexer(str, options)
  const nodes = parser(tokens, options)
  const map = format(nodes, options)

  const finishTime = performance.now();
  console.log('parserko6', (finishTime-startTime));
  return map;
}

function format (nodes) {
  var arr = [];
  nodes.forEach(node => {
    const type = node.type
    if (type === 'element') {
      const tag = node.tagName;
      const attrs = formatAttributes(node.attributes)
      const children = format(node.children)

      const obj = {tag}
      if(attrs && Object.keys(attrs).length>0){
        obj.attrs = attrs;
      }
      if(children && children.length>0){
        obj.children = children;
      }
      arr.push(obj)
    }
    if(!isEmptyOrSpaces(node.content)){
      arr.push(parseJsExression(node.content))
    }
  })
  return arr;
}

function formatAttributes (attributes) {
  var attrs = {}
  attributes.forEach(attribute => {
    const parts = splitHead(attribute.trim(), '=')
    const key = parts[0]
    const value = typeof parts[1] === 'string'
      ? unquote(parts[1])
      : null
    attrs[key] = parseJsExression(value);
  })
  return attrs
} 

function splitHead (str, sep) {
  const idx = str.indexOf(sep)
  if (idx === -1) return [str]
  return [str.slice(0, idx), str.slice(idx + sep.length)]
}

function unquote (str) {
  const car = str.charAt(0)
  const end = str.length - 1
  const isQuoteStart = car === '"' || car === "'"
  if (isQuoteStart && car === str.charAt(end)) {
    return str.slice(1, end)
  }
  return str
}

function parseJsExression(s){
      if(s && startsWith(s, '{') && endsWith(s, '}')){
        s = s.slice(1, s.length-1);
        return new Function('m', 'ctx', 'return '+s);
      }
      return s;
}

function isEmptyOrSpaces(str){
    return !str || !str.match || str.match(/^\s*$/) !== null;
}