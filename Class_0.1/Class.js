/**
 * Class v0.1 JavaScript OOP Library
 * 
 * @name    Class.js
 * @version 0.1
 * @author  FuFan
 * @date    2014/09/30
 * @modify  2018/03/17
 * @history
 * 2014-05-08 Fan.js      v1.3
 * 2012-07-12 Fan-core.js v3.0
 * 2011-09-06 Fan-core.js v1.3.8
 * 2011-08-06 Fan-core.js v1.0
 * 2010-06-13 System.js   v2.5
 * 2010-04-22 System.js   v1.0
 * 
 * 
 * 页面引入标签：
 * <script src="Class.js"                       // 主文件
 *         mode="develop"                       // 配置运行模式:开发模式(develop)|工作模式(operate)
 *         compiler="Class.ECMAScript6Compiler" // 配置编译器类名,提供ECMAScript6类语法支持,若无需新语法（ES6）时,可以不配置
 *         home=""                              // 配置Class.js的home目录位置,缺省为Class.js所在的目录
 *         classpath="Fan=res/lib/fan_v1.3;"    // 配置非Class命名空间下类检索目录, 也可针对指定的起始命名空间单独配置: 
 *                                              // 如:classpath="lib/class_0.1;Fan=lib/fan_v1.3", 多个配置以分号分割,缺少前缀时视为其他所有前缀
 *         charset="utf-8"
 *         type="text/javascript">
 * </script>
 * 
 * 压缩方式：YUICompressor + UglifyJs
 *
 * 主要实现:
 * [模块管理]
 * [类系统]
 * 
 * 全局函数:
 * 
 * Class                        - 类定义
 * Interface                    - 接口定义
 * Package                      - 创建包命名空间
 * Import                       - 依赖引入
 * DeferImport                  - [暂未实现]延迟引入依赖
 *
 * 
 * 关键字:
 * 
 * Super                        - 父实例
 * This                         - 当前实例, 与this关键字等价
 * 
 * 常用方法:
 * Class.isPackage(...)         - 判断参数是否为包命名空间
 * Class.isClass(...)           - 判断参数是否为类
 * Class.isInterface(...)       - 判断参数是否为接口
 * Class.forName(...)           - 通过字符串参数, 反射得到一个Class类
 * Class.instance(...)          - 通过字符串参数, 反射得到一个Class类的实例对象
 * Class.parseClass(...)        - 解析代码
 * Class.Extends(...)           - 继承
 * Class.checkImplements(...)   - 检测接口实现
 * Class.loadClassPack(...)     - 载入打包的类文件集合,需要后台在web.xml中配置打包的文件列表,打包工具:fanjs-service.jar
 * ...
 * 
 * 功能函数:
 * Class.noop                   - 空函数
 * Class.xhr()                  - 创建并返回一个XMLHttpReuquest对象
 * Class.map()                  - 创建并返回一个Map对象
 * Class.log(...)               - 输出日志
 * Class.apply(...)             - 对象属性覆盖
 * Class.each(...)              - 数组元素或对象属性遍历
 * Class.on(...)                - 监听事件
 * Class.un(...)                - 移除事件
 * Class.fire(...)              - 触发事件
 * Class.printError(...)        - 输出错误对象信息, 用于排查错误
 * 
 * 常用对象:
 * Class.Loader                 - 加载器
 * 
 * 类:
 * Class.Object                 - 所有类的父类
 * Class.Compiler               - 编译器类, 提供给第三方编译js代码的基本接口
 * 
 * 示例:
 * 
 * 
 * # 类定义
 * 
 * Class( 'Animal', function() {
 *  // 公有成员, 带有this.前缀
 *  this.age = 0;
 *  this.sex = '公';
 *  
 *  // 私有成员, 通过var声明
 *  var _color = 'black';
 *  
 *  // 私有成员, 块级作用域, 仅在ECMAScript6中可以使用
 *  let _block = '块级作用域';
 *  
 *  // 私有常量成员, 仅在ECMAScript6中可以使用
 *  const _const = '常量';
 *
 *  // 构造方法, 与类名相同
 *  this.Animal = function( age, sex ) {
 *      Super();
 *      this.age = age;
 *      this.sex = sex;
 *  };
 *
 *  // 公有成员方法, 有this.前缀
 *  this.say = function( msg ) {
 *      return this.age + ',' + this.sex + ',say:' + msg;
 *  };
 * } );
 * 
 * 
 * # 接口定义
 * 
 * Interface( 'IMyItface', function() {
 *  // 接口方法, 有this.前缀, 值必须是Function
 *  this.method1 = Function;
 *  this.method2 = Function;
 *  
 *  // 接口属性静态常量, 有this.前缀, 值不可是Function, 通过接口名访问
 *  this.PROPERTY1 = '接口中的静态常量';
 *  this.PROPERTY2 = true;
 * } );
 * 
 * 
 * # 类定义 & 继承
 * 
 * Class( 'Dog', Animal, function() {
 *
 *  var a = 'aaa';
 *  this.name = 'dog';
 *
 *  this.Dog = function( age, sex, name ) {
 *      Super( age, sex );  // 调用父类构造方法
 *      this.name = name;
 *  };
 *
 *  this.say = function( msg ) {
 *      return this.name + ',' + Super( msg ); // Super( ... ) 调用父类同名方法
 *  };
 * } );
 * 
 * 
 * # 类定义 & 实现接口
 * 
 * Class( 'Dog', IMyItface, function() {
 *
 *  this.Dog = function( age, sex, name ) {
 *      Super( age, sex );
 *      this.name = name;
 *  };
 *
 *  // 实现接口中的method1方法, 若不实现, 则会报错
 *  this.method1 = function() {
 *      return 'method1 call ' + IMyItface.PROPERTY1; // 访问从接口中的property1属性
 *  };
 *  
 *  this.method2 = function() {
 *      return 'method2 call ' + IMyItface.PROPERTY2;
 *  };
 * } );
 * 
 * 
 * # 类定义 & 继承 & 实现接口
 * 
 * Class( 'Dog', Animal, IMyItface, function() {
 *
 *  this.Dog = function( age, sex, name ) {
 *      Super( age, sex );
 *      this.name = name;
 *  };
 *
 *  this.say = function( msg ) {
 *      return this.name + ',' + Super( msg );
 *  };
 *  
 *  this.method1 = function() {
 *      return 'method1 call ' + IMyItface.PROPERTY1;
 *  };
 *  
 *  this.method2 = function() {
 *      return 'method2 call ' + IMyItface.PROPERTY2;
 *  };
 * } );
 * 
 * 
 * 使用:
 * var dog = new Dog( 3, '母', '小白' );
 * dog.say( 'hello' );          // 小白,2,母,say:hello
 * 
 * dog instanceof Dog           // true
 * dog instanceof Animal        // true
 * dog instanceof Class.Object  // true
 * dog instanceof Object        // true
 * 
 */
( function( window, undefined ) {
//    "use strict";

var
    // 常用正则
    TRIM        = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
    TRIM_LEFT   = /^[\s\uFEFF\xA0]+/g,
    TRIM_RIGHT  = /[\s\uFEFF\xA0]+$/g,
    TRIM_ALL    = /[\s\uFEFF\xA0]+/g,
    
    // 动态载入JS时，js文件追加的后缀, sourceURL,sourceMappingURL, @ 已经过时,使用 # 替代
    EVAL_SUFFIX = '\r\n\n// Dynamic Loading \n//# sourceURL='
        + location.protocol
        + '//' + location.hostname
        + (location.port ? ':' + location.port + '/' : '/'),
        
    // 递增唯一id
    _uuid = 1;


// # js原型扩展

// Function扩展bind(this)
if ( !(Function.prototype.bind instanceof Function) )
    Function.prototype.bind = function bind( thisObject ) {
        var fn = this;
        return function() {
            return fn.apply( thisObject, arguments );
        };
    };
// Function扩展delay(0, ...)
if ( !(Function.prototype.delay instanceof Function) )
    Function.prototype.delay = function delay( delayTime ) {
        var args = Array.prototype.slice.call( arguments, 1 );
        setTimeout( function() {
            this.apply( null, args );
        }.bind( this ), delayTime >> 0 );
    };

// Date扩展format
if ( !(Date.prototype.format instanceof Function) )
    Date.prototype.format = function formatDate( format ) {
        var m = {
            y : this.getFullYear(), M : this.getMonth() + 1, d : this.getDate(),
            h : this.getHours(),    m : this.getMinutes(),   s : this.getSeconds(),
            n : this.getMilliseconds()
        };
        return (format || 'yyyy-MM-dd hh:mm:ss').replace( /(yyyy|M{1,2}|d{1,2}|h{1,2}|m{1,2}|s{1,2}|n{1,2})/g, function( v ) {
            return v.length == 2 ? ('0' + m[ v[ 0 ] ]).substr( v[ 0 ] == 'n' ? -3 : -2 ) : m[ v[ 0 ] ];
        } );
    };
    
var sx = String.prototype.trim && !String.prototype.trim.call( '\uFEFF\xA0' ),
    trimAll = function( str ) {
        return (str + '').replace( TRIM_ALL, '' );
    },
    fx_trim = (sx && String.prototype.trim) || function() {
        return this.replace( TRIM, '' );
    },
    fx_trimLeft = (sx && String.prototype.trimLeft) || function() {
        return this.replace( TRIM_LEFT, '' );
    },
    fx_trimRight = (sx && String.prototype.trimRight) || function() {
        return this.replace( TRIM_RIGHT, '' );
    },
    fx_last = function() {
        return this[ this.length - 1 ];
    },
    fx_first = function() {
        return this[ 0 ];
    },
//    fx_each = function( fn, scope ) {
//        return each( this, fn, scope );
//    },
    fx_indexOf = function( o ) {
        for ( var i = 0, l = this.length; i < l; i++ )
            if ( this[ i ] === o )
                return i;
        return -1;
    },
    fx_lastIndexOf = function( o ) {
        for ( var i = this.length - 1; i >= 0; i-- )
            if ( this[ i ] === o )
                return i;
        return -1;
    };
    
// 扩展原生String对象的trim方法
(!sx || !String.prototype.trim) && (String.prototype.trim = fx_trim);
(!sx || !String.prototype.trimLeft) && (String.prototype.trimLeft = fx_trimLeft);
(!sx || !String.prototype.trimRight) && (String.prototype.trimRight = fx_trimRight);

// 扩展原生Array对象的常用方法, 且方法不可被枚举, 避免for in循环时被枚举出来
if ( !Array.prototype.last )
    Object.defineProperty( Array.prototype, 'last', {
        value : fx_last,
        writable : false,
        enumerable : false,
        configurable : false
    } );
if ( !Array.prototype.first )
    Object.defineProperty( Array.prototype, 'first', {
        value : fx_first,
        writable : false,
        enumerable : false,
        configurable : false
    } );
if ( !Array.prototype.indexOf )
    Object.defineProperty( Array.prototype, 'indexOf', {
        value : fx_indexOf,
        writable : false,
        enumerable : false,
        configurable : false
    } );
if ( !Array.prototype.lastIndexOf )
    Object.defineProperty( Array.prototype, 'lastIndexOf', {
        value : fx_lastIndexOf,
        writable : false,
        enumerable : false,
        configurable : false
    } );
//if ( !Array.prototype.each )
//    Object.defineProperty( Array.prototype, 'each', {
//        value : fx_each,
//        writable : false,
//        enumerable : false,
//        configurable : false
//    } );


// # 工具 & 函数

// 空函数
function noop() {};

/**
 * 取得浏览器名称及其版本
 * 
 * <pre>
 * Class.ie --> 6.0 | 7.0 | 8.0 | 9.0 ...
 * Class.firefox --> 3.6.13 | 3.6.20 | 4.0 ...
 * Class.browserName --> ie | firefox | chrome | opera | safari | unknow
 * Class.browserVersion --> 6.0 | 7.0 | 3.6.13 ...
 * </pre>
 */
var Browser = {};
Browser[ function( ua ) {
    return Browser[ 'browserName' ] = (
        ua.match( /\bchrome\/([\d.]+)/ )          ? 'chrome'  :
        ua.match( /\bfirefox\/([\d.]+)/ )         ? 'firefox' :
        ua.match( /\bmsie ([\d.]+)/ )             ? 'ie'      :
        ua.match( /\btrident\b.* rv:([\d.]+)/ )   ? 'ie'      : // IE 11+
        ua.match( /\bopera\/([\d.]+)/ )           ? 'opera'   :
        ua.match( /\bversion\/([\d.]+).*safari/ ) ? 'safari'  :
        'unknow'
    );
}( window.navigator.userAgent.toLowerCase() ) ] = Browser.browserVersion = RegExp[ '$1' ];

// IE浏览器的文档模式
Browser.ie && (Browser.ieDocMode = document.documentMode || Browser.ie);

// 控制台输出,支持Console API:
// https://developers.google.com/chrome-developer-tools/docs/console-api
// 格式化字符
// %s           Formats the value as a string.
// %d or %i     Formats the value as an integer.
// %f           Formats the value as a floating point value.
// %o           Formats the value as an expandable DOM element (as in the Elements panel).
// %O           Formats the value as an expandable JavaScript object.
// %c           Formats the output string according to CSS styles you provide.
// 用法:
// log( '%c红色信息, %c图片', ['color:red', 'line-height:100px;padding:50px 50px;background:url(xxx.jpg) no-repeat;'] )
// log( '%s %d %i %f', ['字符串', 123, 456, 3.14] );
// log( '%o %O', [document.body, {jsObject:123}] );
function log( msg ) {
    // 仅在开发模式下才输出日志
    if ( ClassManager.getMode() == 'develop' )
        _log.apply( this, arguments );
}

// 执行输出日志的函数, 提供强制输出日志的需要
function _log( msg ) {
    var console = window.console;
    
    if ( console ) {
        
        // 日志的前缀时间戳
        var now = new Date();
        var prefix = [ '%c',
                       now.getFullYear(),  '-',
                       now.getMonth() + 1, '-',
                       now.getDate(),      ' ',
                       now.getHours(),     ':',
                       now.getMinutes(),   ':',
                       now.getSeconds(),   '.',
                       now.getMilliseconds(),
                       '::%c ' ].join( '' );
        
        // IE使用原生日志输出方式, 不支持 Console API, 清除不支持的格式化符号
        if ( Browser.ie ) {
            msg = (prefix + msg).replace( /%(?:c|s|d|i|f|o|O)/g, '' );
            console.log && console.log( msg );
            return;
        }
        
        // 组装新的参数列表
        var params = [ prefix + msg,
                       'color:yellowgreen',
                       'color:lightslategray' ].concat( Array.prototype.slice.call( arguments, 1 ) );
        
        if ( console.log )
            console.log.apply( console, params );
        /* else if ( console.info )
            console.info.apply( console, params );
        else if ( console.debug )
            console.debug.apply( console, params ); */
    }
}

/**
 * 判断参数对象是否为空对象，即:不包含任何内容的空对象{}
 * @param {Object} obj - 被判断的对象
 * @return {Boolean}
 */
function isEmptyObject( obj ) {
    if ( null == obj )
        return true;
    
    for ( var p in obj ) {
        if ( p && obj.hasOwnProperty( p ) )
            return false;
    }
    
    return true;
}

/**
 * 克隆对象
 * @param {Object} obj - 被判断的对象
 * @param {Boolean} cloneAll - 是否深度克隆,缺省false
 * @return {Object} - 返回新对象
 */
function cloneObject( obj, cloneAll ) {
    switch ( true ) {
    case obj === null || obj === undefined :
    case typeof obj === 'number' :
    case typeof obj === 'string' :
        return obj;
    case typeof obj === 'function' || obj instanceof Function :
        return cloneAll ? function() {
            return obj.apply( this, arguments );
        } : obj;
    case obj instanceof RegExp :
        var reg = new RegExp( '/' + obj.source + '/' + obj.flags );
        reg.lastIndex = obj.lastIndex;
        return reg;
    case typeof obj === 'object' && !!obj :
    case obj instanceof Array :
        var newObj = {};
        for ( var i in obj ) {
            if ( i && obj.hasOwnProperty( i ) ) {
                newObj[ i ] = cloneAll ? cloneObject( obj[ i ] ) : obj[ i ];
            }
        }
        return newObj;
    }
    
    return obj;
}

/**
 * 遍历对象或数组的函数
 * 
 * @param obj   - 被遍历的对象或集合
 * @param fn    - 遍历时调用的回调函数，接受参数(key, obj)
 *                key：数组下标或对象属性名，obj：被遍历的对象
 *                回调函数中返回任意非undefined值，则终止遍历
 * @param scope - 遍历时的回调函数中，this的作用域，默认是当前遍历到的某个子元素
 * 
 * @return 返回一个在回调函数中返回的非undefined的值
 */
function each( obj, fn, scope ) {
    if ( obj == null ) return;
    var r, i = 0, l, k;
    if ( obj instanceof Array || typeof obj.length == 'number' ) {
        for ( l = obj.length; i < l && (r = fn.call( scope || obj[ i ], i, obj )) === undefined; ++i );
    } else {
        for ( k in obj )
            if ( (r = fn.call( scope || obj[ k ], k, obj )) !== undefined )
                break;
    }
    return r;
}

// 创建一个XMLHttpRequest对象
var newXhr = function() {
    var xhrObj, tmpFn;
    try {
        xhrObj = new XMLHttpRequest();
        tmpFn = function xhr() {
            return new XMLHttpRequest();
        };
    } catch ( e ) {
        try {
            xhrObj = new ActiveXObject( 'Microsoft.XMLHTTP' );
            tmpFn = function xhr() {
                return new ActiveXObject( 'Microsoft.XMLHTTP' );
            };
        } catch ( e ) {
            try {
                xhrObj = new ActiveXObject( 'Msxml2.XMLHTTP' );
                tmpFn = function xhr() {
                    return new ActiveXObject( 'Msxml2.XMLHTTP' );
                };
            } catch ( e ) {
                _log( '%c不能创建 XMLHttpRequest 对象', 'color:red' );
            }
        }
    }
    tmpFn && (newXhr = tmpFn);
    tmpFn = null;

    try {
        return xhrObj;
    } finally {
        xhrObj = null;
    }
};
newXhr();// 执行一次

// # Map 内置的简易Map集合
function map() {
    return {
        _es : {},
        _len : 0,
        get : function( key ) {
            return this._es[ key ] ? this._es[ key ].value : null;
        },
        put : function( key, value ) {
            var r = this.get( key );
            if ( this.has( key ) ) {
                this._es[ key ].value = value;
            } else {
                this._es[ key ] = {
                    key : key,
                    value : value,
                    toString : function() {
                        return '{' + this.key + ':' + this.value + '}';
                    }
                };
                this._len++;
            }
            return r;
        },
        has : function( key ) {
            return (key in this._es) && this._es.hasOwnProperty( key );
        },
        remove : function( key ) {
            var r = null;
            if ( this.has( key ) ) {
                r = this._es[ key ].value;
                if ( delete this._es[ key ] ) {
                    this._len--;
                }
            }
            return r;
        },
        clear : function( deleteAll ) {
            if ( deleteAll )
            for (var k in this._es )
                delete this._es[ k ];
            this._es = {};
            this._len = 0;
        },
        size : function() {
            return this._len;
        },
        each : function( fn, scope ) {
            var r = undefined;
            for ( var k in this._es ) {
                r = fn.call( scope || this._es[ k ], k, this._es[ k ].value, this._es );
                if ( r !== undefined ) {
                    return r;
                }
            }
            return r;
        },
        getKeySet : function() {
            var ks = [];
            this.each( function( k ) {
                ks.push( this.key );
            } );
            return ks;
        },
        destroy : function() {
            this._es = this._len = this.clear = this.destroy = this.each = null;
            this.get = this.getKeySet = this.has = this.put = this.remove = this.size = null;
            log( '[destroy] map object' );
        }
    };
}


/**
 * 根据任意路径，返回该路径的绝对路径，缺省参数时，返回当前绝对路径
 * 
 * @param path  - 任意路径，可选
 * 
 * @return {String} 返回绝对路径
 */
var getAbsPath = function() {
    var m = document.createElement( Browser.ie ? 'img' : 'script' );
    m.setAttribute( 'src', '/' );
    var domain = m.src.replace( /[\/]+$/, '' );
    m.src = '';
    
    return function getAbsPath( path ) {
        if ( '/' == path )
            return domain;
        
        try {
            m.setAttribute( 'src', path || './' );
            return m.src.replace( /[\/]+$/, '' );
        } finally {
            m.src = '';
        }
    };
}();

/**
 * 文件加载完毕后的回调
 * 
 * @private
 * @param xhr -
 *            XMLHttpRequest对象
 * @param success -
 *            文件加载成功回调
 * @param failure -
 *            文件加载失败回调
 */
function loadCallback( xhr, success, failure ) {
  if ( 4 !== xhr.readyState )
      return;
  
  // clear event
  xhr.onreadystatechange = Browser.ie < 7 ? noop : null;
  
  // 通过http,返回为[200,300)区间内则视为成功, 未修改304,来自缓存, IE9 1223 ==> 204
  var status = xhr.status;
  if ( status >= 200 && status < 300 || status === 304 || status === 0 || status === 1223 )
      success && success.call( xhr, xhr.responseText || xhr.responseXML || '' );
  else
      failure && failure.call( xhr, xhr );
};

// 对象属性覆盖, 缺省isOverride=true
function apply ( newObj, oldObj, isOverride ) {
    var len = arguments.length - 1;
    var override = arguments[ len ];
    
    if ( typeof isOverride === 'boolean' )
        len--;
    else
        override = true;
    
    var old = arguments[ 1 ], i = 1;
    
    while ( old && i <= len ) {
        for ( var k in old ) {
            if ( k != null && (override || !(k in newObj)) )
                newObj[ k ] = old[ k ];
        }
        old = arguments[ ++i ];
    }
    return newObj;
};

// 检测错误行的Error对象
var checkLineErrObj;
function getEvalRowNumber() {
    if ( !checkLineErrObj )
        gEval( '0' );
    
    if ( checkLineErrObj._evalLine >= 0 )
        return checkLineErrObj._evalLine;
    
    if ( checkLineErrObj.lineNumber > 0 )
        return checkLineErrObj._evalLine = checkLineErrObj.lineNumber;
    
    if ( checkLineErrObj.stack ) {
        var line = (checkLineErrObj.stack + '').match( /:(\d+)(:\d+)?/ )[ 1 ] >> 0;
        return checkLineErrObj._evalLine = line;
    }
    
    return checkLineErrObj._evalLine = 0;
}
function gEval( code, codeName ) {
    var temCodeName = codeName || 'gEval/' + new Date().getTime();
    return (function() {
        // chrome 浏览器不尝试捕捉错误,让js引擎抛出的错误信息更易于排错
        if ( Browser.chrome ) {
            return checkLineErrObj || (checkLineErrObj = new Error( 'Gets the error line number in this file' )) ? window.eval( null != temCodeName ? code + EVAL_SUFFIX + temCodeName : code )
                    : null;
        }
        
        try {
            // 当前调用eval的代码行数, 该位置自动计算, return表达式的判断永远为真
            return checkLineErrObj || (checkLineErrObj = new Error( 'Gets the error line number in this file' )) ? window.eval( null != temCodeName ? code + EVAL_SUFFIX + temCodeName : code )
                    : null;
        } catch ( e ) {
            // 去掉多余的前缀classes/和后缀.class
            var className = (codeName || '').replace( /\bclasses\/|\.class$/g, '' );
            
            printError( e, code, className );

//            var errLine = 0, errColumn = 0;
//            
//            if ( Browser.firefox ) {
//                errLine   = e.lineNumber >> 0;
//                errColumn = e.columnNumber >> 0;
//            } else if ( Browser.chrome ) {
//                console.dir(e);
//                var ms = e.stack.match( /(?:at |@)[^\n]+?(?:\/classes\/([^\n]+?)\.class):(\d+):?(\d+)?[^\d]*\n/ ) || [];
//                className = className || ms[ 1 ];
//                e.lineNumber   = ms[ 2 ] >> 0;
//                e.columnNumber = ms[ 3 ] >> 0;
//                errLine   = e.lineNumber;
//                errColumn = e.columnNumber - 1; // 此处-1便于下面截取运算(与firebug错误位置匹配)
//            }
//            
//            // show error code in firebug
//            var errCode = code.split( /\n/ )[ errLine - 1 ];
//            errCode = errCode ? errCode.substring( 0, errColumn ) + '>>> ' + errCode.substring( errColumn, errColumn + 1 ) + ' <<<'
//                    + errCode.substring( errColumn + 1 ) : '';
//
//            throw new InvalidCallingEvalError( '执行 eval 异常:' + e, className || temCodeName, '', e.lineNumber, e.columnNumber, errCode );
        }
    }());
};


// # Listener 事件监听器
var 
eventMap = map(),
Listener = {
    // 获取事件缓存的对象
    getEventMap : function() {
        return eventMap;
    },

    /**
     * 增加事件监听器
     * @public
     * @param {String}   eventName - 事件名称
     * @param {Function} handler   - 事件处理函数，该处理函数中this指向组件本身
     * @param {String}   eventId   - 事件id标识，便于区别其他同类型事件，可选，缺省时，会自动生成
     * @returns {String} eventId
     */
    on : function( eventName, handler, eventId ) {
        eventId = eventId || Class.id( 'event-' );
        var fnMap = eventMap.get( eventName );
        
        if ( fnMap )
            fnMap.put( eventId, handler );
        else {
            fnMap = map();
            fnMap.put( eventId, handler );
            eventMap.put( eventName, fnMap );
        }
        
        // log( '[增加监听] [ ' + eventName + ' ]  \t[ ' + eventId + ' ]' );
        
        return eventId;
    },

    /**
     * 移除事件监听器
     * @public
     * @param {String} eventName - 事件名称
     * @param {String} eventId   - 事件id标示，可选，是在注册事件时指定的eventid，或者返回的id。该参数缺省时，将移除所有同类型事件
     */
    un : function( eventName, eventId ) {
        if ( !eventMap.size() )
            return;
        
        // log( '[移除监听] [ ' + eventName + ' ]  \t[ ' + (eventId || '') + ' ]' );
        
        if ( arguments.length <= 1 ) {
            eventMap.remove( eventName );
            return;
        }
        
        var fnMap = eventMap.get( eventName );
        if ( !fnMap || !fnMap.size() )
            return;
        
        fnMap.remove( eventId );
        !fnMap.size() && eventMap.remove( eventName );
    },

    /**
     * 触发指定的事件
     * 【注】：相同的事件，触发时，return false则会终止事件链调用。
     * @public
     * @param {String} eventName - 事件名称
     * @param {Array}  args      - 给事件处理函数传入的参数列表，以数组形式
     * 
     * @returns {Object} 返回事件处理函数的返回值
     */
    fire : function( eventName, args ) {
        // log( '[触发监听] [ ' + eventName + ' ]  \t参数个数:' + arguments.length );
        
        var fnMap = eventMap.get( eventName );
        if ( fnMap && fnMap.size() ) {
            
            var argsLen = arguments.length;
            args = args instanceof Array ? args : argsLen > 1 ? ((args && args.callee && args.length != null) ? args : [ args ]) : [];
            argsLen = null;
            
            return fnMap.each( function( k, v, es ) {
                if ( typeof v == 'function' ) {
                    var r = v.apply( this, args || [] );
                    if ( false === r ) return r;
                }
            }, this );
        }
        
        eventName = args = fnMap = null;
    }
};


// # Loader 加载器
var Loader = {

  /**
   * AJAX方式加载文本文件
   * @public
   * @param {String} url - 文件路径
   * @param {Function} success - 文件加载成功回调，并接受一个XMLHttpRequest.responseText文本或xhr.responseXML文档对象
   * @param {Function} failure - 文件加载失败回调
   * @param {Object} config - 其他配置参数
   * <code>
   *      config:{
   *          charset  : 'utf-8',   // 字符集设置，默认utf-8
   *          method   : 'GET',     // 请求方式，默认GET
   *          async    : false,     // 是否异步，默认false
   *          params   : null,      // 请求参数, 默认null
   *          headers  : null,      // 请求头部信息, 默认null
   *          mimeType : 'text/xml'
   *      }
   * </code>
   */
  loadFile : function( url, success, failure, config ) {
      var xhr = newXhr();
      config = apply( {
          charset : 'utf-8',
          async : false,
          method : 'GET',
          params : null,
          headers : null,
          mimeType : 'text/xml',
          crossDomain : false
      }, config );

      // 参数判断，尝试使用send方法传入的参数，若未传入params则用config.params，否则为参数为null
      var params = null == config.params ? null : config.params;
      if ( typeof params == 'object' && !isEmptyObject( params ) ) {
          var p = [];
          each( params, function( key ) {
              null != params[ key ] && p.push( encodeURIComponent( key ) + '=' + encodeURIComponent( params[ key ] ) );
          } );
          params = p.join( '&' );
      }
      
      // GET 方式,参数追加在url上
      if ( params && /^GET$/i.test( config.method ) )
          url += /\?/.test( url ) ? '&' + params : '?' + params;

      // open
      if ( config.username )
          xhr.open( config.method, url, !!config.async, config.username, config.password );
      else
          xhr.open( config.method, url, !!config.async );
      
      // 必要时设置mimeType
      if ( config.mimeType && xhr.overrideMimeType )
          xhr.overrideMimeType( config.mimeType );
      
      // 非跨域下, 带一个缺省的 X-Requested-With 头部信息
      if ( !config.crossDomain ) {
          !config.headers && (config.headers = {});
          config.headers[ 'X-Requested-With' ] = 'XMLHttpRequest';
      }
    
      // set POST请求的默认头部信息
      if ( /^POST|PUT$/i.test( config.method ) )
          xhr.setRequestHeader( 'CONTENT-TYPE', 'application/x-www-form-urlencoded;charset=' + config.charset );
      
      // 设置请求头部信息
      if ( config.headers ) {
          for ( var k in config.headers )
              k && xhr.setRequestHeader( k, config.headers[ k ] );
      }

      // 仅在异步请求时使用onreadystatechange指定回调函数
      if ( config.async )
          xhr.onreadystatechange = function(){
              loadCallback( xhr, success, failure );
          };
      
      // 发送请求
      xhr.send( !/^GET$/i.test( config.method ) && null != params ? params : null );

      if ( !config.async )
          loadCallback( xhr, success, failure );
  },

  /**
   * 动态创建script元素加载远程js代码
   * @public
   * @param {String}   url - 文件路径
   * @param {Function} onLoad - 加载成功回调
   * @param {Function} onError - 加载失败回调
   * @param {Object}   config - 其他配置参数
   * <code>
   *      config:{
   *          charset : 'utf-8',   // 字符集设置，默认utf-8
   *          async   : false,     // 异步加载，异步执行，默认false
   *          defer   : false,     // 异步加载，顺序执行，默认false
   *          parent  : null,      // script元素的容器，默认null，则以head元素为容器
   *          type    : 'text/javascript'
   *      }
   * </code>
   * @returns 返回创建好的script元素对象
   */
  loadScript : function( url, onLoad, onError, config ) {
      config = apply( {
          charset : 'utf-8',
          defer : false,
          async : false,
          type : 'text/javascript',
          parent : null
      }, config );

      var script = document.createElement( 'script' );
      script.type = config.type;
      config.id && (script.id = config.id);
      script.charset = config.charset;

      // 异步加载，顺序执行
      config.defer && (script.defer = true);

      // 异步加载，异步执行
      config.async && (script.async = true);

      // onerror event
      if ( onError instanceof Function )
          script.onerror = onError;

      // onload event
      if ( onLoad instanceof Function ) {
          if ( 'addEventListener' in script )
              script.onload = onLoad;
          else if ( 'readyState' in script )
              script.onreadystatechange = function() {
                  var rs = this.readyState;
                  if ( 'loaded' == rs || 'complete' == rs ) {
                      script.onerror = script.onload = script.onreadystatechange = null;
                      script = config = onError = null;
                      onLoad();
                      onLoad = null;
                  }
              };
          else
              script.onload = onLoad;
      }
      
      url && (script.src = url);

      (config.parent || document.getElementsByTagName( 'head' )[ 0 ]).appendChild( script );

      return script;
  },

  /**
   * 动态创建script元素执行js代码
   * @public
   * @param {String} code - 字符串代码，或者配置项
   * @param {String} charset - 代码字符集，可选
   * @returns 返回创建好的script元素对象
   */
  execScript : function( code, charset ) {
      if ( !code.trim() ) return;

      var config = {
              charset : charset || 'utf-8'
          },
          script = this.loadScript( null, null, null, config );

      switch ( this.execScript.__flag ) {
      case 1 :
          script.appendChild( document.createTextNode( code ) );
          break;
      case 2 :
          script.text = code;
          break;
      default :
          
          try {
              script.appendChild( document.createTextNode( code ) );
              this.execScript.__flag = 1;
          } catch ( e ) {
              script.text = code;
              this.execScript.__flag = 2;
          }
          break;
      }

      return script;
  }
};


// # ClassManager 类管理器

var cm_compiler     = null,      // 编译器
    cm_mode         = 'operate', // 运行模式
    cm_home         = '',        // Class.js的home目录
    cm_classPackMap = {},        // 存放预加载生成类文件的函数集合
    cm_classPath    = {},        // 针对不同前缀,配置不同的类文件路径,缺省前缀时,视为通配其他的所有路径
    cm_otherPathKey = '*',       // 配置classpath时缺省前缀时的默认前缀
    cm_innerSpace   = {},        // 内部空间, 用于存放已经载入的类
    cm_usingFileNameList = [],   // 记录已使用的文件列表
            
    // 隐藏属性名称
    THIS            = '.THIS.',
    SUPER           = '.SUPER.',
    SET_SUPER       = '.SET.SUPER.',
    GET_SUPER       = 'getSuper', //'.GET.SUPER.',
    CLASS_BODY      = '.CLASS.BODY.',
    METHOD_NAME     = '.METHOD.NAME.',
    PROTOTYPE       = 'prototype';

var ClassManager = {
        
    // 初始化classManager模块
    init : function() {
        // 重写toString方法,以便输出文件列表
        apply( cm_usingFileNameList, {
            toString : function() {
                var files = [];
                each ( this, function() {
                    var className = this;
                    files.push( '/' + ClassManager.getFullClassPath( className ) + '.js' );
                } );
                return files.join( ',\n' );
            }
        } );

        // 取出所有script标签
        var scripts = document.getElementsByTagName( 'script' );

        each( scripts, function( i ) {
            if ( /\bClass(?:[-.]min)?\.js\s*$/.test( this.src ) ) {
                cm_home = (this.getAttribute( 'home' ) || '').trim().replace( /\/+$/, '' );
                cm_home = cm_home ? cm_home + '/' : null;
                if ( !cm_home )
                    cm_home = this.getAttribute( 'src' ).replace( /\bClass(?:[-.]min)?\.js\s*$/, '' ) || './';
                
                cm_mode = /^develop$/i.test( (this.getAttribute( 'mode' ) || '').trim() ) ? 'develop' : 'operate';
                
                // 取出编译器配置
                var compilerClassName = (this.getAttribute( 'compiler' ) || '').trim();
                if ( compilerClassName ) {
                    var compiler = Class.instance( compilerClassName );
                    ClassManager.setCompiler( compiler );
                }

                // 取出类路径配置
                // "Fan=res/lib/fan;res/xxx;"
                var paths = (this.getAttribute( 'classpath' ) || '').trim().split( /;+/ );
                for ( var idx in paths ) {
                    var path = paths[ idx ],
                        tmp  = path.split( /=/ ),
                        name = tmp[ 0 ].trim();
                    
                    // "Fan=res/lib/fan" --> "Fan" "res/lib/fan/"
                    if ( tmp.length > 1 ) {
                        var value = tmp.slice( 1 ).join( '=' ).trim().replace( /\/+$/, '' );
                        cm_classPath[ name ] = value ? value + '/' : '';
                    }
                    // "res/xxx" --> "res/xxx/"
                    else if ( name ) {
                        var value = name.replace( /\/+$/, '' );
                        cm_classPath[ cm_otherPathKey ] = value ? value + '/' : '';
                    }
                }
                
                return false;
            }
        } );

        // 消除内部变量 
        scripts = null;
    },
    getRoot : function() { return cm_home; },
    getHome : function() { return cm_home; },
    getMode : function() { return cm_mode; },
    getClassPath : function() { return cm_classPath; },
    getCompiler : function() {
        if ( cm_compiler )
            return cm_compiler;
        
        if ( Class.ECMAScript6Compiler )
            cm_compiler = new Class.ECMAScript6Compiler();
        else
            cm_compiler = new Class.Compiler();
        
        return cm_compiler;
    },
    setCompiler : function( compiler ) {
        if ( compiler instanceof Class.Compiler ) {
            cm_compiler = compiler;
            log( '%c编译器 ' + compiler.getClass().className + ' 装载成功!', 'color:blue;' );
        } else if( compiler )
            log( '编译器设置不正确, 编译器必须是 Class.Compiler 对象或其派生对象' );
    },
    getInnerSpace : function() {
        return cm_innerSpace;
    },
    // 获取正在载入的文件列表
    getLoadingFile : function() {
        var names = [];
        for ( var k in loadingFiles ) {
            if ( k && loadingFiles.hasOwnProperty( k ) )
                names.push( k );
        }
        return names;
    },
    // 获取已使用的文件列表
    getUsingFileNameList : function() {
        return cm_usingFileNameList;
    },
    
    /**
     * 添加打包好的类文件, 通过给服务器打包类文件时调用
     * 注:该函数由服务器打包代码时拼装成js调用代码
     * @param {JSONObject} classPackMap - Class的类文件打包集合,以JSON格式封装
     * {
     *     fullClassPath1 : function( Class ){ ... },
     *     fullClassPath2 : function( Class ){ ... },
     *     ...
     * }
     */
    addClassPackMap : function( classPackMap ) {
        apply( cm_classPackMap, classPackMap );
        _log( '[载入打包类文件] - 成功' );
    },
    
    /**
     * 加载打包的类文件,该文件符合一定规范
     * @param {String}   uri     - 类文件打包的uri
     * @param {boolean}  async   - 是否异步加载
     * @param {Function} success - 加载成功的回调函数
     * @param {Function} error   - 加载失败的回调函数
     */
    loadClassPack : function( url, async, success, error ) {
        _log( '[载入打包类文件] - ' + url );
        
        async = !(async === false);
        Loader.loadFile( url, function( code ) {
            if ( async ) {
                //setTimeout( function() {
                parseClass.delay( 0, code, 'class-pack' );
                //}, 0 );
            } else
                parseClass( code, 'class-pack' );
            success && success();
            success = error = code = url = async = null;
        }, error, {
            headers : {
                'accept' : 'text/javascript'
            },
            async : async
        } );
    },
 
    // 获取类文件的完整路径, 不含后缀.js
    getFullClassPath : function( className ) {
        var fullClassPath,
            tmp = className.split( '.' ),
            firstPackPath = cm_classPath[ tmp[ 0 ] ];
        
        // Class打头的路径,默认是Class的home路径
        // 兼容Fan类路径,包名Fan打头的,都属于Class内部使用的包名,与Class打头的包名路径一致
        // 'Class.xxx.Class1' --> 'class_v1.0/src/xxx/Class1'
        if ( /Class|Fan/.test( tmp[ 0 ] ) ) {
            
            fullClassPath = tmp.slice( 1 ).join( '/' );
            
            // 若没有单独配置,则使用默认
            if ( typeof firstPackPath !== 'string' )
                firstPackPath = ClassManager.getHome() + 'src/';
        }
       
        // 其他类路径, 可在script标签中通过classpath参数配置
        else {
            
            fullClassPath = tmp.join( '/' );
            
            // 没有则使用通配路径
            if ( typeof firstPackPath !== 'string' )
                firstPackPath = cm_classPath[ cm_otherPathKey ] || '';
        }
        
        return firstPackPath + fullClassPath;
    }
};

    
// # 主函数
    
    /**
     * 类定义
     * @public
     * @param {String} className 类完整名称
     * @param {String|Class} superClass 父类名称, 仅当继承Class.Object的时, 该参数允许省略
     * @param {String|Interface|Array} interfaces 实现的接口, 实现多个接口时, 允许传入数组, 该参数允许重复(允许逐个传入)
     * @param {Function} classBody 类的实现函数
     * @returns {Class} 返回定义好的类
     */ 
    function Class( className, superClass, interfaces, classBody ) {
        var len = arguments.length, tmp;
        switch ( len ) {
        case 0 : case 1 :
            throw new ClassInitError( '类 "' + className + '" 创建异常, 参数列表错误.', className );

        case 2 :
            classBody = superClass;
            superClass = interfaces = null;
            break;

        case 3 :
            classBody = interfaces;
            if ( typeof superClass == 'string' )
                tmp = superClass == 'Object' ? Object : cm_innerSpace[ superClass ];
            else
                tmp = superClass;

            if ( isClass( tmp ) || tmp === Object ) {
                superClass = tmp;
                interfaces = null;
            } else {
                // 是 interface 或 interface 数组的情况
                if ( superClass instanceof Array )
                    interfaces = getInterfaceByItfs( superClass );
                else
                    interfaces = tmp ? [ tmp ] : null;
                superClass = null;
            }
            tmp = null;
            break;

        case 4 :
            if ( typeof superClass == 'string' )
                tmp = superClass == 'Object' ? Object : cm_innerSpace[ superClass ];
            else
                tmp = superClass;

            if ( isClass( tmp ) || tmp === Object ) {
                // 是 class 的情况
                superClass = tmp;

                // 是 interface 或 interface 数组的情况
                tmp = [].concat( interfaces );
                interfaces = getInterfaceByItfs( tmp );
            } else {
                // 是 interface 或 interface 数组的情况
                tmp = [ superClass, interfaces ];
                interfaces = getInterfaceByItfs( tmp );
                superClass = null;
            }
            tmp = null;
            break;

        // len > 4
        default :
            var itfs = [];
        
            if ( typeof superClass == 'string' )
                tmp = superClass == 'Object' ? Object : cm_innerSpace[ superClass ];
            else
                tmp = superClass;

            if ( isClass( tmp ) || tmp === Object )
                // is class
                superClass = tmp;
            else if ( isInterface( superClass ) ) {
                // is interface
                itfs.push( superClass );
                superClass = null;
            }
            
            for ( var i = 2, l = arguments.length - 1; i < l; ++i )
                itfs.push( arguments[ i ] );
            
            classBody = arguments[ len - 1 ];
            interfaces = getInterfaceByItfs( itfs );
            itfs = tmp = null;
            break;
        }
        
        superClass = superClass || Class.Object || Object;
        
        var constructorName = className.substring( className.lastIndexOf( '.' ) + 1 );
        var ClassProxy = newClassProxy( Class, classBody, constructorName );
        
        // 继承
        Extends( classBody, superClass[ CLASS_BODY ] || Object );

        ClassProxy[ CLASS_BODY ]   = classBody;
        ClassProxy.className       = className;
        ClassProxy.superclass      = superClass;
        ClassProxy.constructorName = constructorName;
        ClassProxy.toString        = newClosure( '[class ' + className + ']' );
        ClassProxy.getInterfaces   = newClosure( interfaces || [] );
    
        // 记录当前类对应本次parseClass的源码
        ClassProxy.toSource        = newClosure( srcCodeStack.last() );
        
        // this instanceof ClassProxy is true
        ClassProxy[ PROTOTYPE ] = classBody[ PROTOTYPE ];
        ClassProxy[ PROTOTYPE ].constructor = ClassProxy;
        ClassProxy[ PROTOTYPE ].getClass = newClosure( ClassProxy );
        
        // # 检测接口是否实现, 避免因先定义类,再通过原型链的方式实现接口方法导致检测不出来, 故而此处延时0毫秒执行
        checkImplements.delay( 0, ClassProxy, interfaces );
        
        // 发布到cm_innerSpace域中，以className为句柄名称
        cm_innerSpace[ className ] = ClassProxy;

        // 发布到应属的命名空间上
        var lastPack = Package( className.substring( 0, className.lastIndexOf( '.' ) ) );
        lastPack[ constructorName ] = ClassProxy;
        
        return ClassProxy;
    }
    
    // # 创建一个指定参数作为返回值的函数, 用来减少内部函数导致闭包内容过多
    function newClosure( obj ) {
        return function() {
            return obj;
        };
    }
    
    
    // # 创建类包装
    
    var instanceFlg = {}; // 获取实例的标识
    function newClassProxy( Clazz, classBody, constructorName ) {
        function Class() {
            var ClassProxy = arguments.callee;
            
            // 当this是ClassProxy实例或是Class时, 则表示创建实例
            if ( this instanceof ClassProxy || this === instanceFlg ) {
                var o = new classBody();
                
                // 追加方法名称
                for ( var k in o ) {
                    var member = o[ k ];
                    if ( k && o.hasOwnProperty( k ) && member instanceof Function )
                        member[ METHOD_NAME ] = k;
                }
                
                var constructorMethod = o[ constructorName ];
                delete o[ constructorName ];
                
                o[ SET_SUPER ]( Super1.bind( createThisInSuper1( o, o, {} ) ), o );
                constructorMethod.apply( o, arguments );
                
                // 检测是否具有Super调用, 仅检测1次, 之后构造对象不再检测
                if ( !instanceFlg[ ClassProxy.className ] ) {
                    instanceFlg[ ClassProxy.className ] = 1; // 记录检测标记,避免重复检测
                    
                    var methodTxt = constructorMethod + '';
                    methodTxt = Clazz.Compiler.prototype.replaceNotes( methodTxt, '' );
                    methodTxt = Clazz.Compiler.prototype.replaceString( methodTxt, '' );
                    methodTxt = Clazz.Compiler.prototype.replaceRegExp( methodTxt, '' );
                    // 再判断是否包含Super调用
                    if ( !/\bSuper\s*\([^\)]*\)/.test( methodTxt ) ) {
                        _log( '%c[语法检测] - ' + ClassProxy.className + ' 类中缺少 Super(...) 调用', 'color:darkorange' );
                    }
                }
                
                return o;
            } else 
                return classBody.apply( this, arguments );
        };
        
        // 通过方法获取实例的接口, 便于不确定构造参数的情况下使用
        Class.instance = function() {
            return this.apply( instanceFlg, arguments );
        };
        
        return Class;
    }
    
    // [继承] - 基于原型链
    function Extends( clazz, superClass ) {
        function f() {};
        f[ PROTOTYPE ] = superClass[ PROTOTYPE ];
        clazz[ PROTOTYPE ] = new f();
        clazz[ PROTOTYPE ].constructor = clazz;
        clazz[ 'superclass' ] = superClass;
    }
    
    // 接口结构类, 用于鉴别或扩展接口
    function BaseInterface() {
        if ( this instanceof BaseInterface )
            throw new InvokeError( '不能用接口创建实例', 'BaseInterface' );
    }
    
    // 接口定义
    function Interface( itfaceName, itfaceBody ) {
        Extends( itfaceBody, BaseInterface );
        
        // 将静态常量成员发布在接口本身的属性中
        var o = {};
        itfaceBody.call( o );
        for ( var k in o ) {
            if ( k && o.hasOwnProperty( k ) && o[ k ] !== Function )
                itfaceBody[ k ] = o[ k ];
        }
        
        itfaceBody.interfaceName = itfaceName;
        itfaceBody.toString      = newClosure( '[interface ' + itfaceName + ']' );
        
        // 记录当前类对应本次parseClass的源码
        itfaceBody.toSource      = newClosure( srcCodeStack.last() );
        
        // 发布到cm_innerSpace域中，以className为句柄名称
        cm_innerSpace[ itfaceName ] = itfaceBody;
        
        var name = itfaceName.substring( itfaceName.lastIndexOf( '.' ) + 1 );
        var lastPack = Package( itfaceName.substring( 0, itfaceName.lastIndexOf( '.' ) ) );
        lastPack[ name ] = itfaceBody;
    }
    
    // 检测接口实现
    function checkImplements( clazz, interfaces ) {
        if ( !interfaces || interfaces.length == 0 )
            return true;
        
        function f() {};
        f[ PROTOTYPE ] = clazz[ PROTOTYPE ];
        
        var o = new f();
        try {
            var s = clazz;
            while ( s && s !== Object ) {
                s[ CLASS_BODY ].call( o );
                s = s.superclass;
            }
        } catch ( e ) {
            throw new ClassInitError( '检测接口实现异常:' + e.message, clazz.className );
            // return false;
        }
        
        for ( var i = 0, it, obj, l = interfaces.length; i < l; i++ ) {
            it = interfaces[ i ];
            obj = {};
            it.call( obj );
            
            for ( var k in obj ) {
                if ( obj.hasOwnProperty( k ) && obj[ k ] === Function ) {
                    var m = o[ k ];
                    if ( !(k in o) || m === Function || !(m instanceof Function) ) {
                        throw new ClassInitError( '类 "' + clazz.className + '" 未实现接口方法:' + it.interfaceName + '.' + k, clazz.className );
                        // return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    // [包] 包结构类, 用于定制命名空间的结构
    function Pack() {}
    
    // [命名空间] 基于包结构定义的命名空间, 并返回最里层的一个命名空间
    function Package( packageName ) {
        if ( !packageName ) return window;
        
        // 发布到全局范围
        var names = packageName.split( /\.+/ ), pack = window;
        for ( var i = 0, l = names.length; i < l; i++ ) {
            if ( !pack[ names[ i ] ] )
                pack[ names[ i ] ] = new Pack();
            pack = pack[ names[ i ] ];
        }
        return pack;
    }
    
    // 判断是否为一个Class类
    function isClass( clazz ) {
        return !!(clazz instanceof Function && clazz.superclass && clazz[ CLASS_BODY ]);
    };
    
    // 判断参数是否为包命名空间
    function isPackage( pk ) {
        return pk instanceof Pack;
    };
    
    // 判断参数是否为接口
    function isInterface( itfc ) {
        return !!itfc && itfc.superclass === BaseInterface;
    };
    

// # Super

/**
 *  Super()
 *  Super关键字的定义，默认为一个构造方法，一但构造成功后，Super将被覆盖，成为封装了父对象的代理对象
 *  Super[KEYS.SUPER]则真实指向父类对象，且Super[KEYS.SUPER] instanceof 父类、父父类...，均为true
 *  
 *  TODO :
 *  Super的实现思想:
 *  
 *  1、Super的定义:
 *  
 *      在加载依赖js类文件时，动态植入一段事先准备好的代码片段，该片段中定义了一个私有的Super变量作为关键
 *      
 *  字，该变量在js类文件通过eval函数解析执行时插入到Class类定义中，使得Super成为一个私有变量，而能够直接被其
 *  
 *  他类定义中的函数访问到，并把js文件编译成后缀为class后缀的类文件。
 *  
 *  2、Super的生命周期一：
 *  
 *      通过对包装类使用new关键字构造对象时，包装类内部会以类主体构造一个对象，并会通过隐式函数（setSuper）
 *  
 *  第一次初始化Super关键字为一个特定的函数（Super一共会被设置两次），该函数调用时，会主动构造父类对象，因
 *  
 *  此在类构造方法中使用Super(...)将会逐步向上构造父类对象（父类构造方法也调用Super）。构造父类对象时，会
 *  
 *  将父类对象的成员追加到子类中（若子类存在相同方法，则不覆盖，但会给该方法保存一个方法名，用于Super第二周
 *  
 *  期中），且在覆盖完毕后，创建一个function函数对象包装父类对象，该对象对会父类对象中的所有函数都进行代理
 *  
 *  （即：定义了所有父类中的同名方法，且在调用时会主动调用父类中的同名方法，如:Super.show()，则会调用父类
 *  
 *  对象的show方法），该对象最终通过隐式函数setSuper赋给私有变量Super，即Super的第一生命周期结束，Super
 *  
 *  将扮演另一个角色，此时结束类构造过程，将最初通过类主体构造的对象作为new关键字的返回对象。
 *  
 *  3、Super的生命周期二：
 *      
 *      经过第一生命周期，Super关键字已经是一个特殊的function对象，该function直接调用时，会主动获取调用者
 *      
 *  的方法名，且试图逐层向父类寻找同名方法并调用（如：在子类show方法中调用Super()，则Super函数内部会取到方
 *  
 *  法名"show"，并向逐层向父类中查找"show"方法，未找到则报出异常，之所以能找到方法名，是Super在第一生命周期
 *  
 *  内，对子类中重写了父类方法的函数，增加了一个隐式的名字）。
 *  
 *  4、Super的销毁
 *  
 *      Super在对象创建和消费时，都是起"关键字"的作用，销毁Super则是随对象销毁时而销毁，或主动调用继承
 *      
 *  自基类Class.Object中定义的destroy方法释放对象，亦或调用隐式函数（setSuper）将其设置为null。
 *  
 */

    /**
     * TODO
     * Super 第一阶段, 主要处理父类构造
     */
    function Super1() {
        var thisObject  = this.thisObject,
            currObject  = this.currObject,
            superClass  = currObject.getClass().superclass,
            superObject = null;
        
        if ( superClass === Object )
            superObject = {}; // 注: Class.Object的构造方法中不再调用Super(), 此if分支, 不会再进来
        else {
            // 需要传递可变长度的参数
            var superClassBody = superClass[ CLASS_BODY ];
            superObject = new superClassBody();
            var tmpSuper = Super1.bind( createThisInSuper1( thisObject, superObject ) );
            superObject[ SET_SUPER ]( tmpSuper, thisObject );
            
            /* 
             * 使得构造方法中的Super支持instanceof鉴别父类, 必须在构造父类之后方可鉴别
             * 暂注释,覆盖__proto__会导致函数无法获取调用者caller
             */
            // tmpSuper.__proto__ = superObject;
            tmpSuper = null;
            
            // 构造方法
            var constructorMethod = superObject[ superClass.constructorName ];
        
            // 删除构造方法
            delete superObject[ superClass.constructorName ];
            
            /**
             * TODO
             * 收集父类中的非原型链成员
             * 此处使用for in枚举出父类对象的所有成员, 效果等同Object.getKeys(superObject)
             * 会丢失父类不可枚举的成员, 可以使用代替方案Object.getOwnPropertyNames(superObject)
             * 列出所有成员(可枚举和不可枚举,但忽略来自原型链上的成员), 目前尚不知忽略父类中不可枚
             * 举的成员会造成甚么后果, 故暂不使用代替方案.
             */
            for ( var m in superObject ) {
                if ( m && superObject.hasOwnProperty( m ) ) {
                    var member = superObject[ m ];
                    
                    // 若是方法，则追加方法名称
                    if ( member instanceof Function )
                        member[ METHOD_NAME ] = m;
                    
                    // 子类对象中没有的成员，都设置给子类
                    if ( m && !thisObject.hasOwnProperty( m ) )
                        thisObject[ m ] = member;
                }
            }
            
            // 构造完毕后, 设置Super为第二阶段
            currObject[ SET_SUPER ]( Super2( thisObject, superObject ), thisObject );
            
            // 以子类对象调用父类构造方法
            constructorMethod.apply( thisObject, arguments );
        }
    }
    
    /**
     * Super 第一阶段中的this
     */
    function createThisInSuper1( thisObject, currObject ) {
        return {
            thisObject : thisObject,    // 真实实例对象, 始终表示最底层的真实this对象
            currObject : currObject     // 在Super()构建父类对象时,表示当前所处的对象
        };
    }
    
    /**
     * Super 第二阶段, 主要负责实例方法中, 能得到父类对象引用, 以及调用父类方法
     */
    function Super2( thisObject, superObject ) {
        function Super(){
            // 获取调用者
            var method = Super.caller, // [此处不支持严格模式] arguments.callee.caller
                methodName = method[ METHOD_NAME ],
    
                // 取出真实super
                sp = Super[ SUPER ];
            
            if ( !methodName ) {
                // Super方法的调用者非成员方法
                throw new InvokeError( 'Super(...)调用异常, 请勿在非成员方法中调用Super(...)', Super.getClass().className );
            }
    
            // 逐级向父类检索同名方法
            while ( sp ){
                
                // 从代理super上取得同名方法,通过代理方法调用父类方法,实现this永远指向子类对象
                method = sp[ methodName ];
                
                // 该方法需要在父类中明确定义
                // 因为原型链中的方法属于多实例共享方法, 其方法内部不能使用Super()
                // 因此过滤掉原型链中继承的方法, 当sp为顶级父类Fan.Object除外
                if ( method instanceof Function && (sp.hasOwnProperty( methodName ) || sp.getClass() == Class.Object) )
                    return method.apply( Super[ THIS ], arguments );
                
                // 在父类对象中取到获取Super的方法
                if ( !(sp = sp[ GET_SUPER ]) )
                    break;
                
                // 调用Super得到真实super的代理对象
                sp = sp();
             
                // 通过代理对象取出真实super对象
                sp = sp[ SUPER ];
            };
    
            // 未找到,则抛出异常
            throw new InvokeError( '找不到方法:"' + methodName + '"', Super.getClass().className );
        };
        
        Super[ THIS ]  = thisObject;
        Super[ SUPER ] = superObject;
        // Super.__proto__ = superObject; // 使得Super支持instanceof鉴别父类, 暂注释, 覆盖__proto__会导致函数无法获取caller
        
        // 覆盖属性
        for ( var k in superObject ) {
            if ( k ) {
                var member = superObject[ k ];
                if ( member instanceof Function )
                    member = member.bind( thisObject ); // 代理方法, 使得this指针永远指向实际对象
                Super[ k ] = member;
            }
        }
        
        return Super;
    }
    
    /**
     * 返回一个纯接口对象数组，interfaces是字符串和接口对象的混合数组，字符串是接口名称
     */
    function getInterfaceByItfs( interfaces ) {
        var tmp = [];

        // 遍历，并取出字符串对应的接口对象
        for ( var t, itface, i = 0, l = interfaces.length; i < l; ++i ) {
            t = interfaces[ i ];
            itface = typeof t == 'string' ? cm_innerSpace[ t ] : t;
            if ( isInterface( itface ) )
                tmp.push( itface );
            else
                throw new ClassInitError( 'The "' + t + '" is not a interface.' );
        }
        return tmp;
    }

    
    // 列入正在载入的类文件
    var loadingFiles = {};
    function addLoadingFile( className ) {
        loadingFiles[ className ] = 1;
    }
    // 从正在加载的文件列表中删除
    function removeLoadingFile( className ) {
        delete loadingFiles[ className ];
    }
    // 判断是否属于正在加载的文件
    function isLoadingFile( className ) {
        return loadingFiles[ className ];
    }
    
    // 加载类文件
    function loadClass( className, success, error, async ) {

        var url = ClassManager.getFullClassPath( className ) + '.js';

        log( '%cLoading Class File:%c ' + url, 'color:blue', 'color:#444' );
        
//        try {
        // 加载类文件
        Loader.loadFile( url, function( content ) {
            success && success.call( this, content );
        }, function() {
            error && error.call( this );
        }, {
            async : async,
            mimeType : 'text/javascript',
            headers : {
                'accept' : 'text/javascript'
            }
        } );
//        } catch ( e ) {
//            // 从正在加载的名单中移出
//            removeLoadingFile( className );
//            throw new ClassFileLoadingError( '类文件载入异常\n' + e, className );
//        }
    }
    
    /**
     * 导入类文件
     */
    function Import( className, successCallback ) {
        var names;
        
        // 取出包名，包名可能多个，以数组形式存于names中
        switch ( true ) {
        case typeof className == 'string' :
            names = trimAll( className ).split( ',' );
            if ( names.length === 1 && cm_innerSpace[ names[ 0 ] ] ) {
                successCallback && successCallback();
                return;
            }
            break;
        case className instanceof Array :
            names = className;
            break;
        default : return;
        }

        // 不存在包名，直接退出
        if ( !names || names.length == 0 )
            return;
        
        // 执行导入，处理多个包:[ 'Fan.util.Map', 'Fan.net.Ajax' ]
        var multi = { count : names.length };
        for ( var i = 0, len = names.length; i < len; ++i ) {
            doImport( names[ i ], successCallback, false, multi );
        }
    }
    
    // 执行导入
    function doImport( className, successCallback, async, multi ) {

        // 'Class.xxx.Class1'
        className = trimAll( className );

        // 防止重复加载，判断其是否已经载入
        if ( cm_innerSpace[ className ] ) {
            (--multi.count <= 0) && successCallback && successCallback();
            return true;
        }
        
        // # 预加载处理 --- begin
        // 当存在预加载的文件, 则从预加载的文件中取类文件代码的包装函数
        // 该包装函数由服务器端打包时对每个类的代码进行包装
        // 根据约定的完整类文件路径作为取出类的包装函数
        var fullClassPath = ClassManager.getFullClassPath( className );
        var codeWrapFn = fullClassPath ? cm_classPackMap[ fullClassPath.replace( /^\//, '' ) ] : null;
        if ( codeWrapFn instanceof Function ) {
            // 若能取到, 则执行, 且执行完毕后, 从预加载文件列表中清除
            _log( '[加载类文件] - 来自预加载: ' + className );
            
            cm_classPackMap[ fullClassPath ] = null;
            delete cm_classPackMap[ fullClassPath ];
            
            // 执行包装函数,载入类,并传入主函数对象给包装函数(Class)
            codeWrapFn( Class );
            
            (--multi.count <= 0) && successCallback && successCallback();
            
            return;
        }
        // # 预加载处理 --- end

        
        // 防止重复加载，判断其是否正在加载
        if ( isLoadingFile( className ) ) {
            Class.on( 'ClassLoaded', function( clazzName ) {
                if ( className == clazzName ) {
                    (--multi.count <= 0) && successCallback && successCallback();
                }
            } );
            return true;
        }
        
        // --- 统计加载的所有资源文件 --- begin --- //
        cm_usingFileNameList.push( className );
        // --- 统计加载的所有资源文件 ---- end ---- //
        
        // 列入到正在加载的列表中
        addLoadingFile( className );

        // 远程加载类文件并载入
        loadClass( className, function( content ) {
            // this -> xhr
            
            // 从正在加载的名单中移出
            removeLoadingFile( className );
            
            // 触发类文件加载完毕
            Class.fire( 'ClassFileLoaded', [ className, content ] );
            
            // 编译代码, 编译过程是同步, 若成功, 返回编译后的代码, 否则返回错误信息
            ClassManager.getCompiler().build( content, function( code ) {
                // 触发类文件编译完毕
                Class.fire( 'ClassFileBuilded', [ className, code ] );
                
                // 编译后的代码
                parseClass( code, className );
            }, function( errorArr ) {
                var errLine   = errorArr[ 0 ],
                    errColumn = errorArr[ 1 ],
                    errMsg    = errorArr[ 2 ],
                    errCode   = errorArr[ 3 ];
                throw new CompilerError( '类文件编译异常:' + errMsg, className, '', errLine, errColumn, errCode );
            } );

            if ( !cm_innerSpace[ className ] )
                throw new ClassFileParseError( '类文件载入异常', className );
                // log( '%c[警告] 类文件 "' + className + '" 并未载入', 'color:darkorange' );
            
            // 多个文件载入时, 若已经完成最后一个文件的载入, 则执行成功回调
            (--multi.count <= 0) && successCallback && successCallback();
            
        }, function() {
            removeLoadingFile( className );
            
            // successCallback && successCallback( false );
            
            if ( 404 == this.status )
                throw new ClassFileNotFindError( '找不到类文件错误', className );
            else
                throw new ClassFileLoadingError( '类文件载入异常', className );
            
        }, async );
    }
    

// # 代码植入
    
    var embedCode = [ '/* [embedded code] */',
                       // 新增关键字
                       'var Super=null,This=null;',
                       // [创建构造函数的位置],一定要在数组下标2的位置
                       null,
                       'this["' + SET_SUPER + '"]=function(s,t){Super=s;This=t;};',
                       'this["' + GET_SUPER + '"]=function(b){return b?Super["' + SUPER + '"]:Super;};',
                       '/* [embedded code] */' ];
    
    // 找到植入代码的位置所用的正则, 注:classBody的function不能有参数
    // (?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)* 匹配间隔符:空白 | 注释
    var checkInsertLocationReg = /((?:^|[,;\(\){}=]|(?:\*[\/])|(?:\/\/[^\n]*\n))\s*(Class|Interface)(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\((?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*(['"])([a-zA-Z0-9._$]+)\3(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*(?:,(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*[a-zA-Z0-9._$]+(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*)*?,(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*function(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\((?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\)(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*{)/g;

    // 以栈的结构记录每一批parseClass的源码
    var srcCodeStack = [];
    
    // 将字符串代码解析执行
    function parseClass( classFileCode, classFileName ) {
        // log( '\n' + classFileCode );
        
        // 清空同一文件中的类名列表
        var tempClassName = [];
        classFileCode = classFileCode.replace( checkInsertLocationReg, function( v1, v2, v3, v4, v5, v6, v7, v8 ){
            // 类文件名称
            tempClassName.push( v5 );
            
            // 若是接口文件, 则不做处理
            if ( /^Interface$/.test( v3 ) )
                return v1;
            
            // 构造方法名
            var methodName = (v5 || '').split( '.' ).slice( -1 )[ 0 ];
            
            // 创建构造方法
            embedCode[ 2 ] = 'this.' + methodName + '=this.' + methodName + '||function(){Super();};';
            
            // 生成新代码
            var code = v1 + embedCode.join( '' );
            
            // 清理
            embedCode[ 2 ] = null;
            
            return code;
        } );

        // log( '%c \n解析完毕:%c\n' + classFileCode, 'color:blue', 'color:#888' );
        
        // 取出类名, 同文件内多个类, 用$符号连接
        var classCodeName = 'classes/' + (tempClassName.length > 0 ? tempClassName.join( '&' ) : classFileName);
        
        // 多个类文件名时, 截取到最长长度
        if ( tempClassName.length > 1 ) {
            classCodeName = classCodeName.length > 80 ? classCodeName.substring( 0, 80 ) + '..' : classCodeName;
        }
        
        classCodeName += '.class';
        
        // # TODO:
        // 语法排查正则, 以便在调试时能快速定位 --- start
        // 创建语法检查代码, 用于排查语法错误
        var compiler = ClassManager.getCompiler();
        
        // step 1: 去掉所有注释, 保留注释所占据的行, 去掉注释干扰
        var tempCode = compiler.replaceNotes( classFileCode, function( noteText ) {
            return noteText.replace( /[^\n]+/g, '' );
        } );
        
        // step 2: 字符串全部转换成 ""|'', 去掉字符串干扰
        tempCode = compiler.replaceString( tempCode, function( v1, v2, v3 ) {
            return v1.charAt( 0 ) + v1.charAt( 0 );
        } );
        
        // step 3: 去掉正则干扰
        tempCode = compiler.replaceRegExp( tempCode, function( regExpText ) {
            return regExpText.replace( /[^\n]+/g, '' );
        } );
        
        compiler = null;
        
        //_log(tempCode);
        
        var regs = [ 
            // 检测逗号后面的大括号和中括号和小括号, 正则除外:/,],}/
            /,(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*[)}\]]/g,
            /;(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*[)\]]/g
        ];
        
        each( regs, function( i ) {
            tempCode.replace( regs[ i ], function( v1, idx ) {
                var tmp = tempCode.substring( 0, idx + 1 );
                tmp = tmp.split( /\n/ );
                var errCode = tmp.last() + '<<<<error>>>>' + tempCode.substring( idx + 1 ).split( /\n/ ).first();
                _log( '%c[不规范语法文件]:' + classCodeName + ':' + tmp.length + '\n' + errCode, 'color:red' );
                return '';
            } );
        } );
        
        // # 语法排查正则, 以便在调试时能快速定位 --- end

        // # 记录本批次parseClass的文件内容, 用于获取类文件源码
        srcCodeStack.push( classFileCode );
        
        // 尝试执行js文件
        var ret;
        try {
            ret = gEval( classFileCode, classCodeName );
           
            // 触发类加载完毕
            Class.fire( 'ClassLoaded', [ classFileName, ret ] );
        } finally {
            // 移除记录
            srcCodeStack.pop(); // 确保被移除
        }
        
        return ret;
    }
    
    // 对象销毁
    function destroyObject( obj ) {
        var curr = obj, superObj, tmpSuper, msg = [];
        while ( curr instanceof Object && !(curr instanceof Function) && curr[ GET_SUPER ] ) {
            msg.push( curr.getClass().className );
            tmpSuper = curr[ GET_SUPER ]();
            superObj = tmpSuper[ SUPER ];
            
            tmpSuper[ SUPER ] = null;
            tmpSuper[ THIS ]  = null;
            curr[ SET_SUPER ]( null, null );
            
            for ( var n in curr ) {
                if ( null == n )
                    continue;
                null != tmpSuper[ n ] && (tmpSuper[ n ] = null);
                curr[ n ] = null;
                
                delete curr[ n ];
            }
            
            // clear __proto__
            curr.__proto__ = null;
            delete curr.__proto__;
            
            curr = superObj;
            superObj = tmpSuper = null;
        }
        
        log( '%c[对象销毁] ' + msg.join( ' >> ' ) + ' >> Object', 'color:darkgrey' );
        msg = curr = null;
    }

    
// # 异常
    
    /**
     * 打印异常信息
     * @param {Error} err       - 异常错误对象
     * @param {String} codeText - 源代码
     * @param {String} codeName - 类名
     * @return {RuntimeError}
     */
    function printError( err, codeText, codeName ) {
        var className = codeName || '',
            errLine   = 0,
            errColumn = 0,
            code      = '';
        
        var ms = err.stack.match( /(?:at |@)[^\n]+?(?:\/classes\/([^\n]+?)\.class):(\d+):?(\d+)?[^\d]*\n/ ) || [];
        className = className || ms[ 1 ];
        
        var clazz = cm_innerSpace[ className ];
        if ( clazz ) {
            err.lineNumber   = ms[ 2 ] >> 0;
            err.columnNumber = ms[ 3 ] >> 0;
            code = clazz.toSource(); // 取得源码
        } else {
            err.columnNumber += 1; // 列从1开始
        }
        
        errLine   = err.lineNumber;
        errColumn = err.columnNumber;

        code = codeText || code || '';
        
        // 错误代码片段
        var errCode = code.split( /\n/ )[ errLine - 1 ];
        errCode = errCode ? errCode.substring( 0, errColumn - 1 ) + '>>> ' + errCode.substring( errColumn - 1, errColumn ) + ' <<<'
                + errCode.substring( errColumn ) : '';

        // 不抛出
        if ( arguments.callee.caller.caller === gEval )
            return new InvalidCallingEvalError( '执行 eval 异常:' + err, className, '', err.lineNumber, err.columnNumber, errCode );
        return new RuntimeError( '运行时异常:' + err, className, '', err.lineNumber, err.columnNumber, errCode );
    }
    
    /**
     * Class.js中异常的基类
     * @public
     * @extends Error
     * @param {String} errMsg - 异常信息
     * @param {String} errClassName - 发生异常的类名称
     * @param {String} errMethodName - 发生异常的方法
     * @param {Number} errLine - 错误行
     * @param {Number} errColumn - 错误列
     * @param {Number} errCode - 错误代码片段
     */
    function Exception( errMsg, errClassName, errMethodName, errLine, errColumn, errCode ) {
        var err = new Error();
        // 堆栈向上跳2层,正好是构建错误的位置
        var stack = err.stack.split( /\n/ ).slice( 2 ).join( '\n' ).trim();
        
        // 当未给定错误行和错误列, 则从堆栈中分析错误文件和位置
        if ( !errLine && !errColumn && !errCode && stack ) {
            var ms = stack.match( /(?:at |@)[^\n]+?(?:\/classes\/([^\n]+?)\.class):(\d+):?(\d+)?[^\d]*\n/ ) || [];
            errClassName = ms[ 1 ] || errClassName;
            errLine   = ms[ 2 ] >> 0;
            errColumn = ms[ 3 ] >> 0;
        }
        
        this.message       = errMsg || '';
        this.description   = this.message;
        this.columnNumber  = errColumn >> 0;
        this.lineNumber    = errLine >> 0;
        this.number        = this.lineNumber;
        this.fileName      = errClassName || '';
        this.stack         = stack || this.stack || '';
        
        
        this.errMsg        = this.message;
        this.errClassName  = this.fileName;
        this.errMethodName = errMethodName ? errMethodName + '(...)' : '';
        this.errLine       = this.lineNumber;
        this.errColumn     = this.columnNumber;
        this.errCode       = errCode || '';
        
        // 强制输出错误信息, 以便帮助使用者排错
        _log( [ '%c ',
                '错误类型: ' + this.name,
                '错误信息: ' + this.errMsg,
                '错误文件: ' + this.errClassName + (this.errMethodName ? '.' + this.errMethodName : ''),
                '错误位置: ' + this.errLine + ' 行 ' + this.errColumn + ' 列',
                '错误代码: ' + this.errCode,
                '堆栈信息:\n' + this.stack ].join( '\n' ), 'color:red' );
    }
    
    /**
     * 类文件加载异常
     * @public
     * @extends Error
     * @param {String} errMsg - 异常信息
     * @param {String} errClassName - 发生异常的类名称
     * @param {String} errMethodName - 发生异常的方法
     * @param {Number} errLine - 错误行
     * @param {Number} errColumn - 错误列
     * @param {Number} errCode - 错误代码片段
     */
    function ClassFileLoadingError( errMsg, errClassName, errMethodName, errLine, errColumn, errCode ) {
        this.name = 'ClassFileLoadingError';
        Exception.apply( this, arguments );
    }

    /**
     * 类文件未找到异常
     * @public
     * @extends Error
     * @param {String} errMsg - 异常信息
     * @param {String} errClassName - 发生异常的类名称
     * @param {String} errMethodName - 发生异常的方法
     * @param {Number} errLine - 错误行
     * @param {Number} errColumn - 错误列
     * @param {Number} errCode - 错误代码片段
     */
    function ClassFileNotFindError( errMsg, errClassName, errMethodName, errLine, errColumn, errCode ) {
        this.name = 'ClassFileNotFindError';
        Exception.apply( this, arguments );
    }
   
    /**
     * 类文件解析异常
     * @public
     * @extends Error
     * @param {String} errMsg - 异常信息
     * @param {String} errClassName - 发生异常的类名称
     * @param {String} errMethodName - 发生异常的方法
     * @param {Number} errLine - 错误行
     * @param {Number} errColumn - 错误列
     * @param {Number} errCode - 错误代码片段
     */
    function ClassFileParseError( errMsg, errClassName, errMethodName, errLine, errColumn, errCode ) {
        this.name = 'ClassFileParseError';
        Exception.apply( this, arguments );
    }
    
    /**
     * 类初始化异常
     * @public
     * @extends Error
     * @param {String} errMsg - 异常信息
     * @param {String} errClassName - 发生异常的类名称
     * @param {String} errMethodName - 发生异常的方法
     * @param {Number} errLine - 错误行
     * @param {Number} errColumn - 错误列
     * @param {Number} errCode - 错误代码片段
     */
    function ClassInitError( errMsg, errClassName, errMethodName, errLine, errColumn, errCode ) {
        this.name = 'ClassInitError';
        Exception.apply( this, arguments );
    }
    
    /**
     * 编译异常
     * @extends Error
     * @param {String} errMsg - 异常信息
     * @param {String} errClassName - 发生异常的类名称
     * @param {String} errMethodName - 发生异常的方法
     * @param {Number} errLine - 错误行
     * @param {Number} errColumn - 错误列
     * @param {Number} errCode - 错误代码片段
     */
    function CompilerError( errMsg, errClassName, errMethodName, errLine, errColumn, errCode ) {
        this.name = 'CompilerError';
        Exception.apply( this, arguments );
    }
    
    /**
     * 方法调用错误
     * @public
     * @extends Error
     * @param {String} errMsg - 异常信息
     * @param {String} errClassName - 发生异常的类名称
     * @param {String} errMethodName - 发生异常的方法
     * @param {Number} errLine - 错误行
     * @param {Number} errColumn - 错误列
     * @param {Number} errCode - 错误代码片段
     */
    function InvokeError( errMsg, errClassName, errMethodName, errLine, errColumn, errCode ) {
        this.name = 'InvokeError';
        Exception.apply( this, arguments );
    }
    
    /**
     * 运行时异常
     * @public
     * @extends Error
     * @param {String} errMsg - 异常信息
     * @param {String} errClassName - 发生异常的类名称
     * @param {String} errMethodName - 发生异常的方法
     * @param {Number} errLine - 错误行
     * @param {Number} errColumn - 错误列
     * @param {Number} errCode - 错误代码片段
     */
    function RuntimeError( errMsg, errClassName, errMethodName, errLine, errColumn, errCode ) {
        this.name = 'RuntimeError';
        Exception.apply( this, arguments );
    }
    
    /**
     * 非法的调用
     * @public
     * @extends Error
     * @param {String} errMsg - 异常信息
     * @param {String} errClassName - 发生异常的类名称
     * @param {String} errMethodName - 发生异常的方法
     * @param {Number} errLine - 错误行
     * @param {Number} errColumn - 错误列
     * @param {Number} errCode - 错误代码片段
     */
    function InvalidCallingError( errMsg, errClassName, errMethodName, errLine, errColumn, errCode ) {
        this.name = 'InvalidCallingError';
        Exception.apply( this, arguments );
    }
    
    /**
     * 非法调用gEval(..)异常
     * @public
     * @extends Error
     * @param {String} errMsg - 异常信息
     * @param {String} errClassName - 发生异常的类名称
     * @param {String} errMethodName - 发生异常的方法
     * @param {Number} errLine - 错误行
     * @param {Number} errColumn - 错误列
     * @param {Number} errCode - 错误代码片段
     */
    function InvalidCallingEvalError( errMsg, errClassName, errMethodName, errLine, errColumn, errCode ) {
        this.name = 'InvalidCallingEvalError';
        Exception.apply( this, arguments );
    }
    
    Extends( Exception,               Error );
    Extends( ClassFileLoadingError,   Exception );
    Extends( ClassFileNotFindError,   Exception );
    Extends( ClassFileParseError,     Exception );
    Extends( ClassInitError,          Exception );
    Extends( CompilerError,           Exception );
    Extends( InvokeError,             Exception );
    Extends( RuntimeError,            Exception );
    Extends( InvalidCallingError,     Exception );
    Extends( InvalidCallingEvalError, Exception );
    
    
// # 对外暴露接口
    
    window.Class        = Class;
    window.Import       = Import;
    window.Interface    = Interface;
    window.Package      = Package;
    
    /**
     * 生成一个id,可以指定前缀
     * @params {String} prefix - 前缀，缺省为空字符串
     * @return 返回一个新的字符串id
     */
    Class.id = function( prefix ) {
        return (prefix || '') + '' + (_uuid++);
    };

    // Listener: on | un | fire
    Class.on = function( eventName, handler, eventId ) {
        return Listener.on.apply( Listener, arguments );
    },

    Class.un = function( eventName, eventId ) {
        return Listener.un.apply( Listener, arguments );
    },

    Class.fire = function( eventName, args ) {
        return Listener.fire.apply( Listener, arguments );
    };
    
    
// # 基类
    
    Class( 'Class.Object', function() {
        /* [embedded code] */
        var Super = null, This = null;
        this[ 'Object' ] = function() {
            Super();
        };
        this[ SET_SUPER ] = function( s, t ) {
            Super = s;
            This  = t;
        };
        this[ GET_SUPER ] = function( b ) {
            return b ? Super[ SUPER ] : Super;
        };
        /* [embedded code] */
    } );
    
    // override toString
    Class.Object.prototype.toString = function() {
        return '[object ' + this.getClass().className + ']';
    };
    
    // 对象销毁,所有从当前类继承下去的子类,皆可调用此方法销毁对象
    Class.Object.prototype.destroy = function() {
        // 启动一个对象深度销毁任务，必须用延迟方式, 避免销毁复杂对象时的阻塞时间过长
        destroyObject.delay( 0, this );
        /*setTimeout( function() {
            destroyObject( this );
        }.bind( this ), 0 );*/
    };
    
    
// # 编译器
    
    // 编译器接口
    /* Interface( 'Class.ICompiler', function() {
        this.build = Function;
        this.processKeyword = Function;
        this.processIdentifier = Function;
        this.processFunction = Function;
        this.insertCodeAtIndex = Function;
        this.replaceNotes = Function;
        this.replaceString = Function;
        this.replaceRegExp = Function;
    } ); */
    
    // 编译器基类
    Class( 'Class.Compiler', /* Class.ICompiler, */ function() {
        /* [embedded code] */
        var Super = null, This = null;
        this[ 'Compiler' ] = function() {
            Super();
        };
        this[ SET_SUPER ] = function( s, t ) {
            Super = s;
            This  = t;
        };
        this[ GET_SUPER ] = function( b ) {
            return b ? Super[ SUPER ] : Super;
        };
        /* [embedded code] */
    } );
    
    /**
     * 处理关键字
     * @public
     * @param {String} keyword   - 关键字
     * @param {String} code      - 源码
     * @param {Number} index     - 关键字所在的位置
     * @returns {String} 返回新的代码
     */
    Class.Compiler.prototype.processKeyword = function( keyword, code, index ) {};
    
    /**
     * 关键字标识符
     * @public
     * @param {String} identifier    - 标识符
     * @param {String} prevKeyword   - 前一个关键字
     * @param {String} code          - 源码
     * @param {Number} index         - 关键字在源码中的起始位置
     * @returns {String} 返回新的代码
     */
    Class.Compiler.prototype.processIdentifier = function( identifier, prevKeyword, code, index ) {};
    
    /**
     * 处理成员方法
     * @public
     * @param {String} funcName      - 方法名
     * @param {String} code          - 源码
     * @param {Number} index         - 关键字在源码中的起始位置
     * @returns {String} 返回新的代码
     */
    Class.Compiler.prototype.processFunction = function( funcName, code, index ) {};
    
    /**
     * 插入代码到指定的位置
     * @public
     * @param {String} code           - 需插入的新代码
     * @param {String} srcCode        - 源码
     * @param {Number} index          - 插入位置
     * @param {Number} overrideLength - 从插入位置开始, 覆盖指定长度的源码
     * @returns {String} newCode      - 返回新代码
     */
    Class.Compiler.prototype.insertCodeAtIndex = function( newCode, srcCode, index, overrideLength ) {};
    
    /**
     * 解析编译
     * @public
     * @param {String} code                        - 需要编译的代码
     * @param {Function} buildSuccessCallback      - 编译成功时的回调, 接受字符串参数:新的代码
     * @param {Function} buildErrorCallback        - 编译错误时的回调, 接受数组参数:[错误行,错误列,错误描述,错误代码片段]
     * @param {Function} buildStepCallback         - 解析每个字符时的回调, 接受参数:编译中的代码,解析到的位置
     * @return {Array}  - 返回4个长度的数组, 表示[错误行,列,错误描述,错误代码], 若无错误, 返回null
     */
    Class.Compiler.prototype.build = function( code, buildSuccessCallback, buildErrorCallback, buildStepCallback ) {
        buildSuccessCallback && buildSuccessCallback( code );
        return code;
    };
    
    /**
     * 替换代码中的所有注释
     * @public
     * @param {String} code             - 源码
     * @param {String} newValueOrFunc   - 替换的新值或处理替换的函数
     * @return {String}                 - 返回替换后的代码
     */
    Class.Compiler.prototype.replaceNotes = function( code, newValueOrFunc ) {
        return code.replace( /(\/\*[\s\S]*?\*\/|\/\/[^\n]*(?:\n|$))*/g, newValueOrFunc );
    };
    
    /**
     * 替换代码中的所有字符串字面量
     * @public
     * @param {String} code             - 源码
     * @param {String} newValueOrFunc   - 替换的新值或处理替换的函数
     * @return {String}                 - 返回替换后的代码
     */
    Class.Compiler.prototype.replaceString = function( code, newValueOrFunc ) {
        // 第一个捕捉引号,让v1参数能得到引号的值
        return code.replace( /* /(["'])([^\1]|(\\1))*\1/g */ /('[^']*'|"[^"]*")/g, newValueOrFunc );
    };
    
    /**
     * 替换代码中的所有正则字面量
     * @public
     * @param {String} code             - 源码
     * @param {String} newValueOrFunc   - 替换的新值或处理替换的函数
     * @return {String}                 - 返回替换后的代码
     */
    Class.Compiler.prototype.replaceRegExp = function( code, newValueOrFunc ) {
        return code.replace( /(\/[^\/]+\/)*/g, newValueOrFunc );
    };
    

// # 扩展Class
    
    // 把ClassManager上的方法赋给Class, 对外仅暴露一个Class名字的功能函数接口
    apply( Class, ClassManager );
    
    // 与浏览器相关的信息
    apply( Class, Browser );
    
    Class.noop            = noop;
    Class.Extends         = Extends;
    Class.checkImplements = checkImplements;
    
    // 判断是否为一个Class类
    Class.isClass = isClass;
    
    // 判断参数是否为包命名空间
    Class.isPackage = isPackage;
    
    // 判断参数是否为接口
    Class.isInterface = isInterface;
    
    // 增加类注册机制
    Class.forName = function( className ) {
        if ( isClass( className ) )
            return className;
        
        var clazz = cm_innerSpace[ className ];
        if ( !clazz )
            Import( className );
        clazz = cm_innerSpace[ className ];
        
        return clazz;
    };
    
    // 创建一个实例对象
    Class.instance = function( className, arg1 ) {
        var obj, clazz = Class.forName( className );
        if ( clazz ) {
            var args = Array.prototype.slice.call( arguments, 1 );
            obj = clazz.instance.apply( clazz, args );
        }
        return obj || null;
    };
    
    // 特殊属性, 必要时提供外部使用
    Class.THIS      = THIS;
    Class.SUPER     = SUPER;
    Class.SET_SUPER = SET_SUPER;
    Class.GET_SUPER = GET_SUPER;
    
    // 异常
    Class.Exception               = Exception;
    Class.ClassFileLoadingError   = ClassFileLoadingError;
    Class.ClassFileNotFindError   = ClassFileNotFindError;
    Class.ClassFileParseError     = ClassFileParseError;
    Class.ClassInitError          = ClassInitError;
    Class.CompilerError           = CompilerError;
    Class.InvokeError             = InvokeError;
    Class.RuntimeError            = RuntimeError;
    Class.InvalidCallingError     = InvalidCallingError;
    Class.InvalidCallingEvalError = InvalidCallingEvalError;
    Class.printError              = printError;
    
    // 加载器
    Class.Loader = Loader;
    
    // 提供解析代码方法
    Class.parseClass = parseClass;
    
    
    // # 功能
    
    // 全局eval
    Class.gEval = gEval;
    
    // XMLHttpRequest
    Class.xhr   = newXhr;
    
    // Map
    Class.map   = map;
    
    // 日志输出
    Class.log   = log;
    
    // 对象覆盖
    Class.apply = apply;
    
    // 集合或对象遍历
    Class.each  = each;
    
    // 克隆
    Class.cloneObject = cloneObject;
    
    // 获取绝对路径
    Class.getAbsPath = getAbsPath;
    
    /**
     * 将字符串形式的函数转化成Function实例
     */
    Class.parseFunction = function( funcStr ) {
        try {
            return funcStr instanceof String || typeof funcStr == 'string' ? Class.gEval( '(' + funcStr + '\n)' ) : funcStr;
        } catch ( e ) {}
        return funcStr;
    };
    
    
// # 初始化类管理
    ClassManager.init();
    
    // # AMD 支持
    if ( typeof define === 'function' && define.amd && define.amd.Class ) {
        define( 'Class', [], function() { return Class; } );
    }
    
} )( window );
