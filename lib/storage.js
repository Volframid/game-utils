'use strict';
const fs=require('fs'),path=require('path');
// A failed write must leave the previous on-disk preferences intact.
module.exports=function storage(root){
  const file=path.join(root,'config.json');let saved=null,serial=0;
  function atomic(destination,text){
    const temporary=destination+'.'+process.pid+'.'+(++serial)+'.tmp';let descriptor;
    try{descriptor=fs.openSync(temporary,'wx');fs.writeFileSync(descriptor,text,'utf8');fs.fsyncSync(descriptor);fs.closeSync(descriptor);descriptor=undefined;fs.renameSync(temporary,destination);}
    finally{if(descriptor!==undefined)fs.closeSync(descriptor);try{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}catch(_){}}
  }
  return {save(config){
    const text=JSON.stringify({version:1,data:config},null,2)+'\n';if(text===saved)return;
    if(fs.existsSync(file)){
      if(fs.statSync(file).size>1024*1024)throw Error('Settings exceed the supported size; original preserved.');
      const previous=fs.readFileSync(file,'utf8'),parsed=JSON.parse(previous.replace(/^\uFEFF/,''));
      if(parsed.version!==1)throw Error('Unsupported on-disk settings version; original preserved.');
      atomic(file+'.bak',previous);
    }
    atomic(file,text);saved=text;
  }};
};
