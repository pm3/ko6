import * as ko6 from '../src/ko6.js';

describe('Hello world', function () {
  it('says hello', function () {

  	function helloWorld(){
  		return 'Hello world!';
  	}

    expect(helloWorld()).toEqual('Hello world!');
  });
});
