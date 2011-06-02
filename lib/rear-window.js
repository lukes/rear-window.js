Rear=function(initial_object,options){addEvent=function(obj,type,fn){var obj=(obj.constructor===String)?document.getElementById(obj):obj;if(obj.attachEvent){obj['e'+type+fn]=fn;obj[type+fn]=function(){obj['e'+type+fn](window.event)};obj.attachEvent('on'+type,obj[type+fn]);}else obj.addEventListener(type,fn,false);}
removeEvent=function(obj,type,fn){var obj=(obj.constructor===String)?document.getElementById(obj):obj;if(obj.detachEvent){obj.detachEvent('on'+type,obj[type+fn]);obj[type+fn]=null;}else obj.removeEventListener(type,fn,false);}
addColumn=function(v){if(typeof(v)=="string")v=eval(v);var e=document.createElement("div");addClass(e,'col');var type=realTypeOf(v);if(type=='object'||type=='html element'){contents=columnForObject(v);}else{contents=columnForVar(v,type);}
e.appendChild(contents);return e;}
var columnForVar=function(obj,type){var div=document.createElement("div");addClass(div,'var');var value=inspectVar(obj);value=value.replace(/</gim,'<').replace(/</gim,'>');div.innerHTML=['<div id="type">',type,'</div><div id="val">',value,'</div>'].join('');return div;}
var inspectVar=function(v){var type=realTypeOf(v);switch(type){case'array':var s=[];for(var i=0;i<v.length;i++){s.push(inspectVar(v[i]));}
s=s.join(',');return['[',s,']'].join('');case'string':return['"',s,'"'].join('');case'undefined':return'undefined';case'null':return'null';case'storage':return JSON.stringify(v);case'object':return JSON.stringify(v);case'html element':return v.innerHTML;case'audio':return JSON.stringify({autoplay:v.autoplay,controls:v.controls,loop:v.loop,preload:v.preload,src:v.src});default:return v.toString();}}
var columnForObject=function(obj){var ul=document.createElement("ul");properties=[];var type_count={'function':0,'object':0,'html element':0,'array':0,'string':0,'number':0,'date':0,'regex':0,'boolean':0,'null':0,'storage':0,'audio':0,'undefined':0,'native function':0};for(var i in obj){try{var val=obj[i];}catch(e){continue;}
var type=realTypeOf(val);properties.push({name:i,type:type});type_count[type]+=1;}
properties.sort(function(a,b){var a_name=a.name.toLowerCase();var b_name=b.name.toLowerCase();if(a_name>b_name)return 1;if(b_name>a_name)return-1;return 0;});for(type in type_count){if(type_count[type]==0)continue;var li=document.createElement("li");li.className="cat";li.innerHTML=['<span class="count">',type_count[type],'</span> <span>',type,'s</span>'].join('');addEvent(li,'click',itemClickEvent);ul.appendChild(li);}
for(p in properties){var li=document.createElement("li");li.innerHTML=properties[p].name;addEvent(li,'click',itemClickEvent);ul.appendChild(li);}
return ul;}
var itemClickEvent=function(){if(hasClass(this,'cat')){var type='cat';var category=this.getElementsByTagName("span")[1].innerHTML;category=category.replace(/s$/,'');}else{var type='var';}
var parent=this.parentNode;var columns=rearwindow.columns.getElementsByTagName("div");var dotPath=[];var remove_column=false;for(var i=0;i<columns.length;i++){var column=columns[i];if(remove_column){rearwindow.columns.removeChild(column);i--;continue;}
if(column==parent.parentNode){addClass(parent.parentNode,"focus");remove_column=true;continue;}
removeClass(column,"focus");var children=column.getElementsByTagName("li");for(var j=0;j<children.length;j++){var child=children[j];if(hasClass(child,"sel")&&!hasClass(child,'cat')){dotPath.push(child.innerHTML);break;}}}
var siblings=parent.getElementsByTagName("li");for(var i=0;i<siblings.length;i++)removeClass(siblings[i],"sel");addClass(this,"sel");var new_column;if(type=="cat"){var obj=eval(dotPath.join('.'));var mock_obj={};for(i in obj){try{var val=obj[i];if(realTypeOf(val)==category){mock_obj[i]=val;}}catch(e){}}
new_column=addColumn(mock_obj);}else{dotPath.push(this.innerHTML);new_column=addColumn(dotPath.join('.'));}
rearwindow.columns.appendChild(new_column);}
var addClass=function(elem,class_name){if(!hasClass(elem,class_name)){elem.className+=(' '+class_name);}}
var removeClass=function(elem,class_name){var regex=new RegExp(class_name,"gim");elem.className=elem.className.replace(regex,'');}
var hasClass=function(elem,class_name){return!!elem.className.match(class_name);}
var realTypeOf=function(v){if(typeof(v)=='object'){if(v===null)return'null';if(v.constructor==(new Array).constructor)return'array';if(v.constructor==(new Date).constructor)return'date';if(v.constructor==(new RegExp).constructor)return'regex';if(v.constructor==(new Audio).constructor)return'audio';if(typeof(localStorage)!='undefined'&&v==localStorage)return'storage';try{if(typeof(sessionStorage)!='undefined'&&v==sessionStorage)return'storage';if(v.toString().match(/object\sHTML/))return'html element';}catch(e){}
return'object';}
if(typeof(v)=='function'){if(v.constructor==(new RegExp).constructor)return'regex';if(v.toString().match(/\[native\scode\]/))return'native function';return'function';}
return typeof(v);}
var cssOnload=function(id,callback){setTimeout(function listener(){var el=document.getElementById(id),comp=el.currentStyle||getComputedStyle(el,null);if(comp.display==='none'){document.body.removeChild(el);callback();}
else
setTimeout(listener,50);},50);}
var closeEvent=function(){document.body.removeChild(window.rearwindow.all);}
var init=function(obj){var rw=document.createElement('div');rw.id='rw';rw.style.top=[document.body.scrollTop+20,'px'].join('');var head=document.createElement('div');head.id='rw-head';var b_close=document.createElement('img');b_close.src='https://github.com/lukes/rear-window.js/raw/master/lib/close.png';b_close.alt='Close';addEvent(b_close,'click',closeEvent);head.appendChild(b_close);rw.appendChild(head);var cols=document.createElement('div');cols.id='rw-cols';cols.innerHTML=['<div class="col focus"><ul><li class="sel">',obj,'</li></ul></div>'].join('');cols.appendChild(addColumn(obj));rw.appendChild(cols);document.body.appendChild(rw);window.rearwindow={head:head,columns:cols,all:rw};}
if(typeof(window.rearwindow)!='undefined'){closeEvent();var old_css;if(old_css=document.getElementById('rw-cssloading')){document.body.removeChild(old_css);}}
var css_href;if(realTypeOf(options)=='object'&&options.hasOwnProperty('css')){css_href=options.css;}else if(arguments.length==1&&realTypeOf(initial_object)=='object'&&initial_object.hasOwnProperty('css')){css_href=initial_object.css;}else{css_href='https://github.com/lukes/rear-window.js/raw/master/lib/rear-window.css';}
var css=document.createElement('link');css.rel='stylesheet';css.href=css_href;css.type='text/css';document.body.appendChild(css);var cssloader=document.createElement('div');cssloader.id='rw-cssloading';document.body.appendChild(cssloader);if(typeof(initial_object)=='undefined'||typeof(initial_object)=='object'){initial_object='window';}
cssOnload('rw-cssloading',function(){init(initial_object);});}