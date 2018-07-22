
const koRepo = 'https://github.com/knockout/knockout.git';
const koWorkDir = 'node_modules/_knockout/';
const koOutputFile = 'src/ko3/ko.js';
const sources = [
    'src/namespace.js',
    'src/google-closure-compiler-utils.js',
    'src/version.js',
    'src/options.js',
    'src/utils.js',
    'src/tasks.js',
    'src/subscribables/extenders.js',
    'src/subscribables/subscribable.js',
    'src/subscribables/dependencyDetection.js',
    'src/subscribables/observable.js',
    'src/subscribables/observableArray.js',
    'src/subscribables/observableArray.changeTracking.js',
    'src/subscribables/dependentObservable.js',
    'src/subscribables/mappingHelpers.js',
    'src/subscribables/observableUtils.js',
];

//---------------------------------------------------------------------------
const { execSync } = require('child_process');
const fs = require('fs');

try {
    stats = fs.lstatSync(koWorkDir);
}
catch (e) {
    execSync('git clone '+koRepo+' '+koWorkDir, {stdio:[0,1,2]});
}

const pkg = JSON.parse(fs.readFileSync(koWorkDir+'package.json', 'utf8'));
console.log('knockout version: '+pkg.version);

const combinedSourcesArray = sources.map(function(filename) {
    return fs.readFileSync(koWorkDir+filename, "utf8");
 });

combinedSourcesArray.unshift('var DEBUG=false;\n');
combinedSourcesArray.push('export let {\n');
combinedSourcesArray.join('').replace(/exportSymbol\([']{1}([^']+)[\']{1}/g, function(match, p1){
    if(p1.indexOf('.')<0) combinedSourcesArray.push("  "+p1+",\n");
});
combinedSourcesArray.push('} = ko;\n');

var combinedSources = combinedSourcesArray.join('');
combinedSources = combinedSources.replace('##VERSION##', pkg.version);
console.log('create file '+koOutputFile);
fs.writeFileSync(koOutputFile, combinedSources);

function deleteFolderRecursive(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

console.log('delete dir '+koWorkDir);
deleteFolderRecursive(koWorkDir);
