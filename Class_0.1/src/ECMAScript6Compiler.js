/**
 * ECMAScript 6 类机制编译器 v0.1
 * 
 * 将 ECMAScript 6 代码转换成新的 Class.js 所支持的语法, 
 * 模拟 ECMAScript 6 草案规定的类系统, 用于跨浏览器支持 
 * ECMAScript 6 OOP 语法, 使得在不支持 ECMAScript 6 的
 * 浏览器上, 也能正常使用类机制 
 * 
 * 
 * 
 * 示例:
 * 
 * 定义类:
 * class Animal {
 *
 *  Animal( age, sex ) {
 *      super();
 *      this.age = age;
 *      this.sex = sex;
 *  }
 *
 *  say( msg ) {
 *      return this.age + ',' + this.sex + ',say:' + msg;
 *  }
 * }
 * 
 * 定义接口:
 * interface IMyItface {
 *  method1();      // 接口方法定义
 *  method2();
 *  this.PROPERTY1 = '接口中的静态常量';
 *  this.PROPERTY2 = true;
 * }
 * 
 * 继承类
 * class Dog extends Animal {
 *
 *  var a = 'aaa';          // 私有成员
 *  this.name = 'dog';      // 公有成员, 实例通过 this.name 访问
 *
 *  Dog( age, sex, name ) {
 *      super( age, sex );  // 调用父类构造方法
 *      this.name = name;
 *  }
 *
 *  say( msg ) { // 简洁写法的成员方法定义, 效果同等于完整写法: this.say = function(...){}
 *      return this.name + ',' + super( msg ); // super() 调用父类同名方法
 *  }
 * }
 * 
 * 实现接口
 * class Dog implements IMyItface {
 *
 *  Dog( age, sex, name ) {
 *      super( age, sex );
 *      this.name = name;
 *  }
 *
 *  method1() {
 *      return 'method1 call ' + IMyItface.PROPERTY1;
 *  }
 *  
 *  method2() {
 *      return 'method2 call ' + IMyItface.PROPERTY2;
 *  }
 * }
 * 
 * 继承类同时实现接口, 多接口实现用逗号分隔
 * class Dog extends Animal implements IMyItface {
 *
 *  Dog( age, sex, name ) {
 *      super( age, sex );
 *      this.name = name;
 *  }
 *
 *  say( msg ) {
 *      return this.name + ',' + super( msg );
 *  }
 *  
 *  method1() {
 *      return 'method1 call ' + IMyItface.PROPERTY1;
 *  }
 *  
 *  method2() {
 *      return 'method2 call ' + IMyItface.PROPERTY2;
 *  }
 *  
 * }
 * 
 * 
 * 尚未实现:
 * 1, 成员方法收集, 调用时允许缺省前缀 this.
 * 2, 成员属性收集, 访问成员属性时, 允许缺省前缀 this.
 * 
 */
Class("Class.ECMAScript6Compiler",Class.Compiler,function(){function y(){b=[],c=[],d=[],e=[],f=[],g=[],h=[],i=[],j=[],k=[],l=!1,m=-1,n=-1,o=-1,p=0,q=-1,r="",s="",t=-1,u=null,v="",w=!1,x=!1}var a=0,b=[],c=[],d=[],e=[],f=[],g=[],h=[],i=[],j=[],k=[],l=!1,m=-1,n=-1,o=-1,p=0,q=-1,r="",s="",t=-1,u=null,v="",w=!1,x=!1;this.processKeyword=function(a,b,c){switch(a){case"package":b=this.insertCodeAtIndex("Package(",b,c,a.length),u=function(a){u=null,v=a;return'"'+a+'" )'};break;case"class":B=!0,w=!0,b=this.insertCodeAtIndex("Class(",b,c,a.length),u=function(a){u=null;return'"'+(v?v+".":"")+a+'"'};break;case"interface":B=!0,x=!0,b=this.insertCodeAtIndex("Interface(",b,c,a.length),u=function(a){u=null;return'"'+(v?v+".":"")+a+'"'};break;case"import":b=this.insertCodeAtIndex("Import(",b,c,a.length),u=function(a){u=null;return'"'+a+'" )'};break;case"extends":b=this.insertCodeAtIndex(",",b,c,a.length);break;case"implements":b=this.insertCodeAtIndex(",",b,c,a.length);break;case"super":b=this.insertCodeAtIndex("Super",b,c,a.length)}return b},this.processIdentifier=function(a,b,c,d){var e=u?u(a):a;e!=a&&(c=this.insertCodeAtIndex(e,c,d,a.length));return c},this.processFunction=function(a,b,c){b=this.insertCodeAtIndex("this."+a+"=function",b,c,a.length);return b},this.processItfsFunction=function(a,b,c,d){b=this.insertCodeAtIndex("\tClass.noop(",b,d,1),b=this.insertCodeAtIndex("this."+a+"=Function;",b,c,a.length);return b},this.insertCodeAtIndex=function(b,c,d,e){e>>=0,a>1&&Class.log("%c "+c.substring(d,d+e)+"%c ->%c "+b,"color:#777","color:#ccc","color:#333");return c.substring(0,d)+b+c.substring(d+e)};var z=/((?:^|[,;\(\){}=]|(?:\*[\/])|(?:\/\/[^\n]*\n))\s*(Class|Interface)(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\((?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*(['"])([a-zA-Z0-9._$]+)\3(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*(?:,(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*[a-zA-Z0-9._$]+(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*)*?,(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*function(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\((?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\)(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*{)/,A=/^(?:package|import|class|interface|extends|implements|new|this|super|var|let|const|function|do|while|for|in|continue|break|switch|case|default|return|throw|try|catch|finally|delete|true|false)$/,B=!1,C=null;this.build=function(u,v,D,E){y(),u=u.replace(/\r\n/g,"\n");var F=u+"",G="";B=!1,C=null,z.lastIndex=0;var H;if(z.test(F)){Class.log("[编译] - 无需编译"),v&&v(u);return u}Class.log("[编译] - 正在编译...");for(var I,J,K,L=0,M=0;K=u.charAt(L);L++,M++,I=K){E&&E(u,L);if("/"===K||l){if(l){p++,m>=0?"\n"===K&&(m=-1,l=!1,p=0):"/"===K&&"*"===I&&(n=-1,o=-1,l=!1,p=0);continue}if(0===j.length&&0===k.length&&0===h.length){if("/"===u.charAt(L+1)){m=L,l=!0,L+=1,p=2;continue}if("*"===u.charAt(L+1)){n=L,L+=1,p=2,l=!0;continue}}}var N,O;if("{"===K)0===j.length&&0===k.length&&0===h.length&&(C==null&&B&&(u=this.insertCodeAtIndex(",function(){",u,L,1),L+=11,C=b.length-e.length),b.push(L));else if("("===K)0===j.length&&0===k.length&&0===h.length&&c.push(L);else if("["===K)0===j.length&&0===k.length&&0===h.length?d.push(L):h.length&&i.push(L);else if("}"===K){if(0===j.length&&0===k.length&&0===h.length){e.push(L);if(e.length>b.length){q=L,G="括号不匹配, 多余的 } 号";break}C==b.length-e.length&&B&&(u=this.insertCodeAtIndex("});",u,L,1),L+=2,B=!1,w=!1,x=!1,C=null)}}else if(")"===K){if(0===j.length&&0===k.length&&0===h.length){f.push(L);if(f.length>c.length){q=L,G="括号不匹配, 多余的 ) 号";break}}}else if("]"===K)if(0===j.length&&0===k.length&&0===h.length){g.push(L);if(g.length>d.length){q=L,G="括号不匹配, 多余的 ] 号";break}}else h.length&&i.pop();else{if("\n"===K&&(j.length||k.length||h.length))break;if("'"===K){if(0===k.length&&0===h.length){N=L-1,O=0;while(u.charAt(N--)==="\\")O++;O%2==0&&(j.length?j.pop():j.push(L))}}else if('"'===K){if(0===j.length&&0===h.length){N=L-1,O=0;while(u.charAt(N--)==="\\")O++;O%2==0&&(k.length?k.pop():k.push(L))}}else if("/"===K&&(!/[a-z0-9_$)]/i.test(J)||h.length)&&0===j.length&&0===k.length&&0===i.length){N=L-1,O=0;while(u.charAt(N--)==="\\")O++;O%2==0&&(h.length?h.pop():h.push(L))}}var P=!0;0===j.length&&0===k.length&&0===h.length&&(/[a-z0-9_$.]/i.test(K)&&r!="super"&&(r.length==0||L-t==r.length?(0!=r.length?r+=K:/[^0-9.]/.test(K)&&(r=K,t=L),P=!1):(L-=1,M-=1)),P&&r.length&&(A.test(r)?(a>1&&Class.log("%c 关键字:"+r,"color:blue"),H=this.processKeyword(r,u,t),L+=H.length-u.length,u=H,s=r,r="",t=-1):/[\s(]/.test(K)&&C==b.length-e.length-1?(r+=K,/^[a-z0-9_$\s]+\($/i.test(r)&&(w?(a>1&&Class.log("%c 成员方法:"+r,"color:#8A2BE2"),H=this.processFunction(r.substring(0,r.length-1).trim(),u,t),L+=H.length-u.length,u=H):x&&(a>1&&Class.log("%c 接口方法:"+r,"color:red"),H=this.processItfsFunction(r.substring(0,r.length-1).trim(),u,t,L),L+=H.length-u.length,u=H))):(a>1&&Class.log("%c 标识符:"+r,"color:green"),H=this.processIdentifier(r,s,u,t),L+=H.length-u.length,u=H,s="",r="",t=-1))),/[^\s]/i.test(K)&&(J=K)}switch(!0){case q>=0:break;case j.length>0:G="括号不匹配, 缺少结束的 ' 号",q=q>=0?q:j;break;case k.length>0:G='括号不匹配, 缺少结束的 " 号',q=q>=0?q:k;break;case h.length>0:G="括号不匹配, 缺少结束的 / 号",q=q>=0?q:h;break;case d.length>g.length:G="括号不匹配, 缺少结束的 ] 号",q=d[d.length-1];break;case c.length>f.length:G="括号不匹配, 缺少结束的 ) 号",q=c[c.length-1];break;case b.length>e.length:G="括号不匹配, 缺少结束的 } 号",q=b[b.length-1];break;case d.length<g.length:G="括号不匹配, 多余的 ] 号",q=g[g.length-1];break;case c.length<f.length:G="括号不匹配, 多余的 ) 号",q=f[f.length-1];break;case b.length<e.length:G="括号不匹配, 多余的 } 号",q=e[e.length-1]}if(q>=0){H=u.substring(0,q)||"",errLine=H.split(/\n/).length,idx=H.lastIndexOf("\n"),errColumn=q-idx,errCode="",errCode=H.substring(idx+1,q)+">>> "+u.substring(q,q+1)+" <<<"+u.substring(q+1,q+21),Class.log("[编译] - 编译失败"),D&&D([errLine,errColumn,G,errCode]);return[errLine,errColumn,G,errCode]}Class.log("[编译] - 编译完毕"),v&&v(u);return u},this.coloring=function(a){a=a.replace(/\b(package|import|class|interface|extends|implements|new|this|super|var|let|const|function|do|while|for|in|continue|break|switch|case|default|return|throw|try|catch|finally|delete|true|false)\b/g,function(a,b,c){return"<span class=code-keyword>"+a+"</span>"}),a=a.replace(/('[^']*'|"[^"]*")/g,function(a,b,c){return"<span class=code-exp-string>"+a+"</span>"}),a=a.replace(/(\/\*([\s\S]*?)\*\/|\/\/[^\n]*(?:\n|$))/g,function(a,b,c){var d="*"==c&&c.charAt(0)?"<span class=code-doc-comments>":"<span class=code-comments>";return d+a+"</span>"});return a}});