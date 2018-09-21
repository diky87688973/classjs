/**
 * OOP JavaScript Library
 * 
 * Fan 扇子
 * 
 * @version 1.3
 * @author FuFan
 * @date 2014/05/08
 * 
 * 页面引入标签：
 * <script import="Fan.util.Logger,
 *                 Fan.net.Ajax,
 *                 GH.util.Cookie,
 *                 GH.util.Time,
 *                 GH.util.Base64x"
 *         src="lib/fan_v1.3/Fan.js"
 *         preload="/dynamic/js-class-pack.js?file=loginbefore&ver=201303301450"
 *         preload-async="false"
 *         classpath="./"
 *         root=""
 *         mode="develop"
 *         local="false"
 *         charset="utf-8"
 *         type="text/javascript">
 * </script>
 * 
 * 压缩方式：YUICompressor -> UglifyJs
 */
(function( window, undefined ) {

window = this || window;

var
    _Fan            = window.Fan,
    _OOP            = window.OOP,
    
    // 常用对象及方法
    top             = window.top,
    Math            = window.Math,
    document        = window.document,
    
    Object          = window.Object,
    Function        = window.Function,
    Array           = window.Array,
    Date            = window.Date,
    RegExp          = window.RegExp,
    Error           = window.Error,
    String          = window.String,
    
    arr_slice       = Array.prototype.slice,
    arr_splice      = Array.prototype.splice,
    arr_indexOf     = Array.prototype.indexOf,
    fun_toString    = Function.prototype.toString,
    obj_toString    = Object.prototype.toString,
    RAF_timeoutId   = null,
    RAF             = window.requestAnimationFrame        ||
                      window.webkitRequestAnimationFrame  ||
                      window.mozRequestAnimationFrame     ||
                      window.oRequestAnimationFrame       ||
                      window.msRequestAnimationFrame      ||
                      function ( callback ) { return RAF_timeoutId = window.setTimeout( callback, 1000 / 60 ); },
    CAF             = window.cancelAnimationFrame         ||
                      window.webkitCancelAnimationFrame   ||
                      window.mozCancelAnimationFrame      ||
                      window.oCancelAnimationFrame        ||
                      function ( timeoutId ) {
                          if ( timeoutId ) {
                              window.clearTimeout( timeoutId );
                              return;
                          }
                          RAF_timeoutId && window.clearTimeout( RAF_timeoutId );
                          RAF_timeoutId = null;
                      },
    
    readyList       = [],
    
    // 依赖的扩展JS文件加载情况: loading | complete
    jsLoadState     = 'loading',
    // 扩展js加载完毕后的事件通知名称
    jsLoadNotice    = '_Fan_js_load_state_is_complete_',
    
    // 默认import的JS文件加载情况,用以确保多个script下调用Fan(fn)的异步问题: loading | complete
    importJsState   = 'loading',
    
    // 是否属于本地调用, 该参数标明是否属于本地执行脚本, 并且作用于ajax访问本地文件, 可在载入Fan.js的script元素中配置
    isRunAtLocal    = false,
    
    // empty function
    noop            = new Function(),
    
    /**
     * 全局环境执行动态js代码，需要调试的代码，需要在代码末尾追加上：'\n//@ sourceURL=filename'
     * 
     * Note:
     * 1、该函数仅用于全局环境执下执行js代码，其他情况直接使用eval函数
     * 2、避免非多行注释的原代码中出现多次不同的sourceURL，否则追加sourceURL失败,
     *    是因Firebug检测sourceURL的正则缺陷.
     * 
     * @param code -
     *            被执行的代码
     * @param codeName -
     *            代码的名字，利于控制台调试
     * @returns
     */
    checkLineErrObj  = null,
    getEvalRowNumber = function() {
        if ( !checkLineErrObj )
            Fan.gEval( '0' );
        
        if ( checkLineErrObj._evalLine > 0 )
            return checkLineErrObj._evalLine;
        
        if ( checkLineErrObj.lineNumber > 0 ) {
            return checkLineErrObj._evalLine = checkLineErrObj.lineNumber;
        }
        
        if ( checkLineErrObj.stack ) {
            var line = (checkLineErrObj.stack + '').match( /:(\d+)(:\d+)?/ )[ 1 ] >> 0;
            return checkLineErrObj._evalLine = line;
        }
        
        return checkLineErrObj._evalLine = KEYS.EVAL_LINE;
    },
    gEval = function ( code, codeName ) {
        var temCodeName = codeName || 'gEval/' + new Date().getTime();
        return (function () {
            try {
                // 当前调用eval的代码行数, 该位置自动计算, return表达式的判断永远为真
                return checkLineErrObj || (checkLineErrObj = new Error( 'Gets the error line number in this file' )) ? window.eval( null != temCodeName ? code + KEYS.EVAL_JS_CODE_SUFFIX_FOR_AJAX + temCodeName : code ) : null;
            } catch ( e ) {
                // 捕获解析代码时的异常
                
                // 去掉多余的前缀classes/和后缀.class
                e._errClassName = (codeName || '').replace( /^classes\/|\.class$/g, '' );
                e._errFileName = e._errFileName || temCodeName;
                // e._errType = ErrorTypes.InvokeError;
                // e._errMethodName = methodName;
                
                Fan.ClassManager.error( e );
                
                throw e;
            }
        }());
    },

    // 日志输出对象，在载入Fan.util.Logger时会注入一个日志对象
    logger = {
        log         : noop,
        dir         : noop,
        dirxml      : noop,
        info        : noop,
        warn        : noop,
        debug       : noop,
        error       : noop,
        clear       : noop,
        setConsole  : noop,
        getConsole  : noop,
        setLevel    : noop,
        getLevel    : noop,
        close       : noop,
        open        : noop
    },
    
    /**
     * 异常类型
     */
    ErrorTypes = {
        // 类文件未找到
        ClassFileNotFindError   : 0,
        // 类文件解析异常
        ClassFileParseError     : 1,
        // 类初始化异常
        ClassInitError          : 2,
        // 方法调用错误  
        InvokeError             : 3,
        // 运行时错误
        RuntimeError            : 4,
        // 非法的调用
        InvalidCallingError     : 5,
        // 非法调用Fan.gEval(..)异常
        InvalidCallingEvalError : 6
    },

    // 主函数
    Fan = function( selector, context ) {
        if ( null == selector )
            return;
    
        if ( Fan.isFunction( selector ) ) {
    
            context && (selector = Fan.proxy( selector, context ));
            
            // 捕获异常的包装
            function catchErrorWrap() {
                try {
                    selector.apply( this, arguments );
                } catch ( e ) {
                    Fan.ClassManager.error( e );
                    throw e;
                }
            };
    
            if ( Fan.isReady() && null == readyList )
                catchErrorWrap();
            else
                readyList.push( catchErrorWrap );
    
        } else {
            // 执行选择器, 优先使用jQuery
            return window.jQuery && jQuery.apply( jQuery, arguments ) || Fan.$( selector, context );
        }
    };

/**
 * 取得浏览器名称及其版本
 * 
 * <pre>
 * Fan.ie --> 6.0 | 7.0 | 8.0 | 9.0
 * 
 * Fan.firefox --> 3.6.13 | 3.6.20 | 4.0
 * 
 * Fan.browserName --> ie | firefox | chrome | opera | safari
 * Fan.browserVersion --> 6.0 | 7.0 | 3.6.13 ...
 * 
 * Fan[Fan.browserName] <==> Fan.ie // if browser is IE;
 * Fan[Fan.browserName] <==> Fan.firefox // if browser is firefox
 * </pre>
 */
Fan[ function ( ua ) {
    return Fan[ 'browserName' ] = (
        ua.match( /chrome\/([\d.]+)/i )          ? 'chrome' :
        ua.match( /firefox\/([\d.]+)/i )         ? 'firefox' :
        ua.match( /msie ([\d.]+)/i )             ? 'ie' :
        ua.match( /opera\/([\d.]+)/i )           ? 'opera' :
        ua.match( /version\/([\d.]+).*safari/i ) ? 'safari' :
        undefined
    );
}( window.navigator.userAgent ) ] = Fan.browserVersion = RegExp[ '$1' ];

// IE浏览器的文档模式
Fan.ie && (Fan.ieDocMode = document.documentMode || Fan.ie);
    
/**
 * @staticMethod apply(Object newObj, Object oldObj..., Boolean isOverride)
 * 对象属性追加，返回追加后的结果，oldObj的对象属性复制|覆盖到newObj中
 * 
 * <pre>
 * 1、newObj - 被追加的新对象
 * 2、oldObj - 变长参数列表, 从旧对象中遍历，取出所有属性进行覆盖新对象, 该参数可以多个,所有属性全部追加到newObj对象上
 * 3、isOverride - 最后一个参数, 追加模式，当取值true时，则覆盖已存在的内容, 缺省true
 * </pre>
 * 
 * @return 返回新的对象
 */
Fan.apply = function ( newObj, oldObj, isOverride ) {
    var len = arguments.length - 1;
    var override = arguments[ len ];
    if ( typeof isOverride === 'boolean' )
        len--;
    else
        override = true;
    
    var old = arguments[ 1 ], i = 1;
    
    while ( old && i <= len ) {
        for ( var k in old ) {
            if ( k == undefined ) continue;
            
            // 判断是否是原生属性:hasOwnProperty
            // 判断对象是否具有某一属性。这个属性必须是自己具有的，即非继承的
            // if(oldObj.hasOwnProperty(k)){ }
            if ( override || !(k in newObj) )
                newObj[ k ] = old[ k ];
        }
        old = arguments[ ++i ];
    }
    return newObj;
};

// 常量键
var KEYS;
Fan.KEYS = KEYS = {

    // 使用频率较高的正则
    REG_NAME_RULE       : /[^0-9a-z_.￥$-]+/gi,
    REG_TRIM            : /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
    REG_TRIM_LEFT       : /^[\s\uFEFF\xA0]+/g,
    REG_TRIM_RIGHT      : /[\s\uFEFF\xA0]+$/g,
    REG_TRIM_ALL        : /[\s\uFEFF\xA0]+/g,
    
    // 检测中文
    REG_CHINESE         : /[\u4e00-\u9fa5]/,

    /*
    // 选择器
    REG_MAIN_SELECTOR   : /^([#.*]?)([.\w#*-]+)?(((\s+[>]\s+[.\w#*-]+)|(\s+[.\w#*-]+))+)?(\[([\w-]+)?([!~=^$]+)?([\w\W]*)?\])?/g,
    REG_SUB1_SELECTOR   : /(\[([\w-]+)?([!~=^$|]+)?([\w\W]*)?\])/g,
    REG_SUB2_SELECTOR   : /(\s*>\s*)/g,
    REG_SUB3_SELECTOR   : /\s+/g,
    REG_SUB4_SELECTOR   : /(>|\s)([^>\s]+)/g,
    */
    
    // keyid 被处理过的dom对象,均有一个唯一id
    ELEM_KEY_ID_NAME    : '_oop_elem_key_id_',

    // 调用eval的代码行数, 用于firebug查找错误行
    EVAL_LINE           : 129,
    
    // eval动态执行有名字的js代码片段时，代码所追加的后缀
    EVAL_JS_CODE_SUFFIX : '\r\n//@ sourceURL=',

    // 动态载入JS时，js文件追加的后缀
    EVAL_JS_CODE_SUFFIX_FOR_AJAX : '\r\n\n// Dynamic Loading \n//@ sourceURL='
        + location.protocol
        + '//' + location.hostname
        + (location.port ? ':' + location.port + '/' : '/')
};

// 常用函数
var fn,
    sx   = String.prototype.trim && !String.prototype.trim.call( '\uFEFF\xA0' ),
    trim = (sx && String.prototype.trim) || function () {
        return (this + '').replace( KEYS.REG_TRIM, '' );
    },
    trimLeft = (sx && String.prototype.trimLeft) || function () {
        return (this + '').replace( KEYS.REG_TRIM_LEFT, '' );
    },
    trimRight = (sx && String.prototype.trimRight) || function () {
        return (this + '').replace( KEYS.REG_TRIM_RIGHT, '' );
    },
    trimAll = function () {
        return (this + '').replace( KEYS.REG_TRIM_ALL, '' );
    };

// 扩展原生String对象的trim方法
(!sx || !String.prototype.trim) && (String.prototype.trim = trim);
(!sx || !String.prototype.trimLeft) && (String.prototype.trimLeft = trimLeft);
(!sx || !String.prototype.trimRight) && (String.prototype.trimRight = trimRight);

// 扩展到Fan中
Fan.apply( Fan, Fan.fn = fn = {
    prototype : { 
        name : 'Fan',
        version : '1.3'
    },
    
    // 全局eval
    gEval : gEval,

    // 空方法
    noop : new Function(),
    
    /**
     * @staticMethod call(Function fn, Object scope, [Array arguments])
     * 尝试调用一个函数, 并可指定函数内的this作用域和入参列表
     * 
     * <pre>
     * 1、fn - 被执行的函数
     * 2、scope - 函数内this指向的对象, 可以为null
     * 3、arguments - 参数数组
     * </pre>
     * 
     * @returns 返回被执行的函数的返回值
     */
    call : function ( fn, scope, args ) {
        if ( Fan.isFunction( fn ) ) {
            if ( arguments.length == 1 )
                return fn();
            else
                return fn.apply( scope, args || [] );
        }
    },
    
    /**
     * 获取调用者的arguments属性并存放在新数组中, 返回该数组
     */
    getArgs : function () {
        var func_arguments = arguments.callee.caller.arguments;
        var args = [];
        for ( var i = 0, l = func_arguments.length; i < l; i++ )
            args.push( func_arguments[ i ] );
        return args;
    },
    
    /**
     * @staticMethod checkVersion(String version1, String version2)
     *               版本号检测，返回两个版本号的比较值
     * 
     * <pre>
     * 1、version1 - 版本号1
     * 2、version2 - 版本号2
     * </pre>
     * 
     * @return {int} -1：版本号1小于版本号2, 0：版本号相等, 1：版本号1大于版本号2
     * 
     * @throws 参数列表异常
     */
    checkVersion : function ( ver1, ver2 ) {
        if ( arguments.length >= 2 ) {
            ver2 = ver2 + '';
            ver1 = ver1 + '';

            var ret = 0, tmpOld = ver2.split( '.' ), tmpNew = ver1.split( '.' ), len = tmpOld.length > tmpNew.length ? tmpOld.length : tmpNew.length;
            for ( var i = 0, o, n; i < len; i++ ) {
                o = parseFloat( tmpOld[ i ] || '0' );
                n = parseFloat( tmpNew[ i ] || '0' );
                if ( o < n ) {
                    ret = 1;
                    break;
                } else if ( o == n ) {
                    ret = 0;
                    continue;
                } else if ( o > n ) {
                    ret = -1;
                    break;
                }
            }
            tmpOld = tmpNew = len = null;
            return ret;
        }
        
        throw new Error( 'Error:Fan.fn.checkVersion(version1, version2) params list error' );
    },

    /**
     * @method proxy(Function fn, Object scope, Array args)
     *         创建代理函数，传入一个Function对象，返回该函数的代理函数，并可指定函数内的this
     *         作用域，和函数被调用时的参数
     * 
     * <pre>
     * 1、fn - 被代理的函数 
     * 2、scope - 被代理函数内部this的作用域 
     * 3、args - 参数数组
     * </pre>
     * 
     * @return 代理函数
     */
    proxy : function ( fn, scope, args ) {
        if ( arguments.length > 2 && !Fan.isArray( args ) && args && !(args.callee && args.length != null) ){
            args = [ args ];
        }
        return function () {
            var ret;
            Fan.isFunction( fn ) && (ret = fn.apply( scope || this, args || arguments ));
            return ret;
        };
    },

    /**
     * @staticMethod defer(Function fn, int lazyTime, Object scope,
     *               Array args) 延迟执行函数
     * 
     * <pre>
     * 1、fn -  被延迟执行的函数 
     * 2、lazyTime - 延迟时间，缺省值:0
     * 3、scope - 延迟函数中的this作用域，可选
     * 4、args - 参数数组，可选
     * </pre>
     * 
     * @return setTimeout标示
     */
    defer : function ( fn, lazyTime, scope, args ) {
        if ( Fan.isFunction( fn ) ) {
            var proxyFn = arguments.length < 3 ? fn : arguments.length > 3 ? this.proxy( fn, scope, args ) : this.proxy( fn, scope );
            return setTimeout( proxyFn, lazyTime >> 0 );
        }
    },
    
    /**
     * 清除计时器
     */
    clearTimer : function( timerId ) {
        if ( !timerId ) return;
        clearTimeout( timerId );
        clearInterval( timerId );
    },

    /**
     * @staticMethod indexOf(Collection items, Object item)
     *               在集合对象中，检索某一个元素位于集合中的位置
     * 
     * <pre>
     * 1、items - 集合对象
     * 2、item - 被检索的对象
     * </pre>
     * 
     * @return 返回被检索对象对应集合中的位置，当未检索到对象时返回-1
     */
    indexOf : function ( items, item ) {
        if ( arr_indexOf )
            return arr_indexOf.call( items, item );
        
        var idx = null;
        if ( items ) {
            idx = Fan.each( items, function ( i ) {
                if ( items[ i ] === item ) {
                    return i;
                }
            } );
        }
        return idx == null ? -1 : idx;
    },

    /**
     * @staticMethod formatTemplet(String templet, Array/Object arrayOrObject, String defaultValue)
     *  字符串格式化模版
     * 
     * <code>
     * 示例1:
     * 用模板生成：'<name>Fu Fan</name>'
     * (1) formatTemplet('<name>{{name}}</name>', {name : 'Fu Fan'}, 'unname');
     * (2) formatTemplet('<name>{{0}} {{1}}</name>', ['Fu', 'Fan']);
     * (3) formatTemplet('<name>{{user.name}}</name>', {user:{name:'Fu Fan'}});
     * 示例2:
     * 用模板生成：'<sex>男</sex>'
     * (1) formatTemplet('<sex>#{return sex==0?'男':'女';}#</sex>', {sex : 0});
     * (2) formatTemplet('<sex>#{if(sex==0){return '男';}else{return '女';}}#</sex>', {sex : 0});
     * (3) formatTemplet('<sex>#{if(this.sex==0)return man;else return this.woman;}#</sex>', {sex:0,man:'男',woman:'女'});
     * </code>
     * 
     * <pre>
     * 1、tpl - 需要格式化的字符串
     * 2、arrayOrObject - 数组对象，或者一个普通Object对象，用以替换格式化字符串中被大括号包裹起来的内容
     * 3、defaultValue - 当没有数据填充时,提供默认值填充.
     * </pre>
     * 
     * @return 完成格式化后的字符串
     */
    formatTemplet : function ( tpl, values, defaultValue ) {
        var _getVal = arguments.callee._getVal;
        if ( !_getVal ) {
            arguments.callee._getVal = _getVal = function( name, obj ) {
                // 取出层级属性名
                var i = 0, p = name.split( '.' ), tmp = obj;
                while( i < p.length && null != tmp ) {
                    tmp = tmp[ p[ i++ ] ];
                }
                return tmp;
            };
        }
        
        // 匹配模版中的代码逻辑块, 每一个逻辑块都应return一个结果作为填充的数据
        tpl && values && (tpl = tpl.replace( /#{([\s\S]+?)}#/g, function ( v1, v2, v3, idx ) {
            v2 = Fan.trim( v2 );
            var val;
            if ( v2 ) {
                var fn = Function( 'with(this){\n' + v2 + '\n}' );
                val = fn.call( values );
                fn = null;
            } else {
                val = _getVal( v2 );
            }
            return val == null ? (defaultValue == null ? v1 : defaultValue) : val;
        } ));
        
        // 普通填充
        tpl && values && (tpl = tpl.replace( /{{([\s\S]+?)}}/g, function ( v1, v2, v3, idx ) {
            v2 = Fan.trim( v2 );
            var val = _getVal( v2, values );
            return val == null ? (defaultValue == null ? v1 : defaultValue) : val;
        } ));
        
        _getVal = null;
        return tpl;
    },
    
    /**
     * @staticMethod formatTempletList( String tpl, Array objArr, String defaultValue )
     * 解析填充列表, 接收一个item模板,和一个对象数组
     * 返回一个填充数据后的item模板的结果数组
     */
    formatTempletList : function( tpl, objArr, defaultValue ) {
        var tpls = [];
        for ( var i = 0, len = objArr.length; i < len; ++i ) {
            tpls.push( Fan.formatTemplet( tpl, objArr[ i ], defaultValue ) );
        }
        return tpls;
    },

    // 1. + URL 中+号表示空格 %2B
    // 2. 空格 URL中的空格可以用+号或者编码 %20
    // 3. / 分隔目录和子目录 %2F
    // 4. ? 分隔实际的 URL 和参数 %3F
    // 5. % 指定特殊字符 %25
    // 6. # 表示书签 %23
    // 7. & URL 中指定的参数间的分隔符 %26
    // 8. = URL 中指定参数的值 %3D
    /**
     * @staticMethod encode(String code) url参数转义
     *               注意：服务需对参数反转义，java.net.URLDecoder.decode(param, "UTF-8");
     * 
     * <pre>
     * 1、code - 需要被转义的字符串
     * </pre>
     * 
     * @return 转义后的内容
     */
    encode : function ( code ) {
        return this.encodeParam( code );
    },

    /**
     * @staticMethod encodeParam(String param) url参数转义
     * 
     * 注意：服务器需对参数反转义，java.net.URLDecoder.decode(param, "UTF-8");
     * 
     * <pre>
     * 1、code - 需要被转义的字符串
     * </pre>
     * 
     * <code>
     * 字符转义：
     * 1、escape - js使用数据时可以使用escape，对0-255以外的unicode值进行编码时输出%u****格式，其它情况下escape，encodeURI，encodeURIComponent编码结果相同。
     * 2、encodeURI - 进行url跳转时可以整体使用encodeURI，location.href=encodeURI("http://cang.baidu.com/do/s?word=百度&ct=21");
     * 3、encodeURIComponent - 最多使用的应为encodeURIComponent，它是将中文、韩文等特殊字符转换成utf-8格式的url编码，所以如果给后台传递参数需要使用encodeURIComponent时需要后台解码对utf-8支持（form中的编码方式和当前页面编码方式相同）
     * 
     * 对应解码：
     * 1、unescape
     * 2、decodeURI
     * 3、decodeURIComponent
     * 
     * 附注：jsp传递中文参数乱码问题的解决。（web服务器：tomcat6，页面字符集编码：utf-8）
     * <Connector port="8080"
     *            protocol="HTTP/1.1" 
     *            connectionTimeout="20000"
     *            redirectPort="8443" 
     *            URIEncoding="UTF-8"/>;
     * </code>
     * 
     * @return 转义后的内容
     */
    encodeParam : function ( param ) {
        return encodeURI( encodeURIComponent( param ) );
    },

    /**
     * @staticMethod newFunction(Object obj) 创建一个空方法, 并可向新方法中增加属性
     * 
     * <pre>
     * 1、obj - 包含一个或多个属性的对象，用于覆盖在function对象上
     *          (1) 当传入的是个object时，创建的空函数，将继承obj的所有属性。
     *          (2)当传入的是function的字符串形式时，则将字符串形的function转换为function对象返回。
     * </pre>
     * 
     * @return 返回一个新的function对象
     */
    newFunction : function ( obj ) {
        var fn;
        if ( obj ) {
            if ( typeof obj == 'string' ) {
                fn = Fan.gEval( '[' + Fan.trim( obj ) + ']' )[ 0 ];
            } else {
                fn = function () {};
                typeof obj == 'object' && Fan.apply( fn, obj );
            }
        } else
            fn = function () {};
        obj = null;
        return fn;
    },
    
    /**
     * @staticMethod newElement(String tagName) 创建一个HTML元素
     * 
     * <pre>
     * 1、tagName - 元素标签名
     * </pre>
     * 
     * @return 返回一个新的HTMLElement对象
     */
    newElement : function ( tagName ) {
        return document.createElement( tagName );
    },

    /**
     * @staticMethod last(Collection items) 获取集合中最后一个元素
     * 
     * <pre>
     * 1、items - 集合对象
     * </pre>
     * 
     * @return 返回集合中最后一个元素或者null
     */
    last : function ( collection ) {
        if ( Fan.isCollection( collection ) && collection.length > 0 )
            return collection[ collection.length - 1 ];
        return null;
    },

    /**
     * @staticMethod first(Collection items) 获取集合中第一个元素
     * 
     * <pre>
     * 1、items - 集合对象
     * </pre>
     * 
     * @return 返回集合中第一个元素或者null
     */
    first : function ( collection ) {
        if ( Fan.isCollection( collection ) )
            return collection[ 0 ];
        return null;
    },

    /**
     * @staticMethod each(Collection/Object obj, Function fn, Object
     *               scope) 遍历对象或数组的函数
     * 
     * <pre>
     * 1、obj - 被遍历的对象或集合
     * 2、fn - 遍历时调用的回调函数，接受参数(key, obj)， key：数组下标或对象属性名，obj：被遍历的对象
     * 3、scope - 遍历时的回调函数中，this的作用域，默认是当前遍历到的某个子元素
     * </pre>
     * 
     * @return 返回一个在回调函数中返回的非undefined的值
     */
    each : function ( obj, fn, scope ) {
        var r, i = 0, l, k;
        if ( Fan.isCollection( obj ) ) {
            for ( l = obj.length; i < l && (r = fn.call( scope || obj[ i ], i, obj )) === undefined; ++i );
        } else {
            for ( k in obj )
                if ( (r = fn.call( scope || obj[ k ], k, obj )) !== undefined ) {
                    break;
                }
        }
        return r;
    },

    /**
     * @staticMethod getCustomEventMap(HTMLElement/Document/String element/keyId)
     * 获取该元素上绑定的自定义事件集合
     * 
     * <pre>
     * 1、element - dom对象,或者dom对象的keyId
     * </pre>
     */
    getCustomEventMap : function ( elem ) {
        if ( !elem )
            return null;
        
        var keyId;
        if ( typeof elem === 'string' )
            keyId = elem;
        else
            keyId = Fan.getElemKeyId( elem );
        
        var eventMap = customEventMap.get( keyId );
        return eventMap || Fan.newMap();
    },
    
    /**
     * @staticMethod setCustomEventMap(HTMLElement/Document/String element/keyId)
     * 获取该元素上绑定的自定义事件集合
     * 
     * <pre>
     * 1、element - dom对象,或者dom对象的keyId
     * 2、eventMap - 自定义事件集合
     * </pre>
     */
    setCustomEventMap : function ( elem, eventMap ) {
        if ( !elem || !eventMap )
            return false;
        
        var keyId;
        if ( typeof elem === 'string' )
            keyId = elem;
        else
            keyId = Fan.getElemKeyId( elem );
        
        customEventMap.put( keyId, eventMap );
    },
    
    /**
     * @staticMethod removeCustomEventMap(HTMLElement/Document/String element/keyId)
     * 获取该元素上绑定的自定义事件集合
     * 
     * <pre>
     * 1、element - dom对象,或者dom对象的keyId
     * 2、eventType - 自定义的事件类型,值为true,则清除该元素上的所有自定义事件
     * 3、srcHandler - 事件对应的原始处理函数,取值为true,则清除指定事件类型上的所有自定义事件
     * </pre>
     */
    removeCustomEventMap : function ( elem, eventType, srcHandler ) {
        if ( !elem )
            return false;
        
        var keyId;
        if ( typeof elem === 'string' )
            keyId = elem;
        else
            keyId = Fan.getElemKeyId( elem );
        
        if ( true === eventType ) {
            
            // 清理所有事件事件处理
            customEventMap.remove( keyId );

        } else if ( eventType ) {
            
            var eventMap = customEventMap.get( keyId );
            
            if ( true === srcHandler ) {
                
                // 清理指定类型的所有事件处理
                if ( eventMap ) {
                    eventMap.remove( eventType );
                    
                    // 集合为空时, 删除相关的集合对象
                    eventMap.size() <= 0 && customEventMap.remove( keyId );
                }
        
            } else if ( eventMap && srcHandler ) {
                
                // 清理指定类型的具体某个事件处理
                var handlers = eventMap.get( eventType ), handler;
                Fan.each( handlers, function( i ) {
                    handler = this;
                    if ( handler === srcHandler ) {
                        // 从数组中删除指定函数
                        handlers.splice( i, 1 );
                        
                        // 集合为空时, 删除相关的集合对象
                        handlers.length <= 0 && eventMap.remove( eventType );
                        return false;
                    }
                } );
                
                // 集合为空时, 删除相关的集合对象
                eventMap.size() <= 0 && customEventMap.remove( keyId );
                
                handlers = handler = eventMap = srcHandler = elem = null;
            }
        } else {
            return false;
        }
    },
    
    /**
     * @staticMethod addEvent(HTMLElement/Document element, String
     *               eventType, Function fn) 增加事件监听
     * 
     * <pre>
     * 1、element - 被监听的元素对象
     * 2、type - 事件类型，如：click
     * 3、handler - 事件处理函数
     * </pre>
     */
    addEvent : document.addEventListener ?
            function ( elem, type, handler ) {
                if ( !type || !Fan.isFunction( handler ) )
                    return;
                elem.addEventListener( type, handler, false );
            } : document.attachEvent ? function ( elem, type, handler ) {
                if ( !type || !Fan.isFunction( handler ) )
                    return;
                
                // 处理自定义事件, 解决旧版ie不支持自定义事件
                var eventType = 'on' + type;
                if ( !(eventType in elem) ) {
                    var eventMap = Fan.getCustomEventMap( elem );
                    var handlers = eventMap.get( type );
                    if ( handlers ) {
                        handlers.push( handler );
                    } else {
                        handlers = [ handler ];
                        eventMap.put( type, handlers );
                        Fan.setCustomEventMap( elem, eventMap );
                    }
                }
                
                elem.attachEvent( eventType, handler );
                
            } : function ( elem, type, handler ) {
                if ( !type || !Fan.isFunction( handler ) )
                    return;
                elem[ 'on' + type ] = handler;
            },

    /**
     * @staticMethod removeEvent(HTMLElement/Document element, String
     *               eventType, Function fn) 取消事件监听，addEvent的逆操作。
     * 
     * <pre>
     * 1、element - 被监听的元素对象
     * 2、eventType - 事件类型，如：click
     * 3、fn - 通过addEvent绑定时的事件处理函数
     * </pre>
     */
    removeEvent : document.removeEventListener ?
            function( elem, type, handler ) {
                if ( !type || !Fan.isFunction( handler ) )
                    return;
                elem.removeEventListener( type, handler, false );
            } : document.detachEvent ? function( elem, type, handler ) {
                if ( !type || !Fan.isFunction( handler ) )
                    return;
                
                // 从自定义事件集合中删除
                var eventType = 'on' + type;
                if ( eventType in elem ) {
                    Fan.removeCustomEventMap( elem, type, handler );
                }
                
                elem.detachEvent( eventType, handler );
                
            } : function( elem, type, handler ) {
                if ( !type || !Fan.isFunction( handler ) )
                    return;
                elem[ 'on' + type ] = null;
            },
    
    /**
     * @staticMethod fireEvent(HTMLElement/Document element, String
     *               eventType, Array args)
     *               触发dom事件
     * 
     * <pre>
     * 1、element - 被监听的元素对象
     * 2、eventType - 事件类型，如：click
     * 3、args - 传递给事件处理函数的参数
     * </pre>
     */
    fireEvent : function ( elem, eventType, args ) {
        return Fan.Event.fire( elem, eventType, args );
    },
    
    /**
     * 事件代理
     * 
     * <pre>
     * 1、element - 被监听的元素对象
     * 2、selector - 符合触发事件条件对象的选择器
     * 3、eventType - 事件类型，如：click
     * 4、handler - 事件处理函数
     * </pre>
     */
    $on : function ( elem, selector, eventType, handler ) {
        var _el = Fan.ieDocMode < 9 ? elem : null;
        Fan.addEvent( elem, eventType, function() {
            var
            ret,
            args = Fan.getArgs(),
            evt = args[ 0 ],
            el = Fan.ieDocMode < 9 ? _el : this,
            
            // 优先判断是否为自定义触发的事件
            target = evt._target || Fan.Event.getTarget( evt ),
            curTarget = target;
            
            // [低效率, 此处需要优化] 检测子dom是否在selector选择器指向的dom之中
            // TODO
            if ( selector ) {
                var sels = selector.split( /\s*,\s*/g );
                while ( curTarget && (Fan.dom.contains( el, curTarget ) || el === curTarget ) ) {
                    
                    ret = Fan.each( sels, function( k ) {
                        logger.debug( '[DOM事件代理] - 检测:' + this + ' in ' + curTarget.tagName + '.' + curTarget.className );
                        // 检测是否符合条件
                        if ( jQuery( curTarget ).is( this + '' ) )
                            return true;
                    } );
                    
                    if ( ret )
                        break;
                        
                    curTarget = curTarget.parentElement || curTarget.parentNode;
                }
            }
            
            // 若符合条件, 则调用回调函数
            if ( ret ) {
                handler && handler.apply( curTarget, args );
            } else if ( selector == '' ) {
                handler && handler.apply( target, args );
            } else {
                logger.debug( '[DOM事件代理] - 忽略, selector:' + selector + ', eventType:' + eventType );
            }
            
            args = evt = el = target = curTarget = ret = null;
        } );
    },

    /**
     * 移除事件代理
     * 
     * <pre>
     * 1、element - 被监听的元素对象
     * 2、selector - 符合触发事件条件对象的选择器
     * 3、eventType - 事件类型，如：click
     * 4、handler - 事件处理函数
     * </pre>
     */
    $un : function ( elem, selector, eventType, handler ) {
        
    },
    
    /**
     * @staticMethod removeObject(obj, prop) 移除对象中的属性
     * 
     * <code>
     * 1、obj - 需要被移除属性的对象
     * 2、prop - 被移除的属性名称。可选，默认为空，则是移除全部属性
     * </code>
     */
    removeObject : function ( obj, prop ) {
        if ( null == obj )
            return;
        if ( Fan.isNum( prop ) && Fan.isCollection( obj ) ) {
            arr_splice.call( obj, prop, 1 );
        } else if ( null != prop ) {
            obj[ prop ] = null;
        } else {
            for ( var n in obj )
                null != n && (obj[ n ] = null);
        }
    },

    /**
     * @staticMethod newClosure(obj) 创建一个简单的闭包函数, 该函数返回闭包中的对象
     */
    newClosure : function ( obj ) {
        return function () {
            return obj;
        };
    },

    /**
     * @staticMethod checkName(String name) 检测命名规范
     * 
     * <pre>
     * 1、name - 名称
     * </pre>
     * 
     * @return {Boolean}
     */
    checkName : function ( name ) {
        return !(KEYS.REG_NAME_RULE.test( name ));
    },

    /**
     * @staticMethod clone(Object obj) 对象克隆
     * 
     * <pre>
     * 1、obj - 被克隆的对象，仅支持普通对象克隆。
     * </pre>
     * 
     * @return 返回新的对象
     */
    clone : function ( obj ) {
        var f = Fan.newFunction();
        Fan.apply( f, {
            prototype : obj
        } );
        return new f();
    },

    /**
     * @staticMethod onReady(Function fn, Object scope)
     *               页面加载完毕后执行，不包含延迟部分的加载
     * 
     * <pre>
     * 1、fn - 加载完毕后的回调函数
     * 2、scope - 回调函数中的this指向
     * </pre>
     */
    onReady : function ( fn, scope ) {
        Fan.isFunction( fn ) && Fan( fn, scope );
    },

    /**
     * @staticMethod isReady(Window win) 判断指定窗口的页面是否加载完成，默认当前窗口
     * 
     * <pre>
     * 1、win - window对象
     * </pre>
     * 
     * @return {Boolean}
     */
    isReady : function ( win ) {
        win = win || window;
        return Fan.isWindow( win ) && win.document && 'complete' == win.document.readyState;
    },

    /**
     * @staticMethod type(Object win) 判断传入的对象的类型
     * @param obj
     * @returns {String} 类型：
     *          string|number|boolean|function|undefined|
     *          null|object|array|date|element|regexp
     */
    type : function ( obj ) {
        var type = typeof obj;

        switch ( type ) {
        case 'string' :
        case 'number' :
        case 'boolean' :
        case 'function' :
        case 'undefined' :
            break;

        case 'object' :
            switch ( true ) {
            case null === obj :
                type = 'null';
                break;
            case Fan.isArray( obj ) :
                type = 'array';
                break;
            case Fan.isDate( obj ) :
                type = 'date';
                break;
            case Fan.isElement( obj ) :
                type = 'element';
                break;
            case Fan.isRegExp( obj ) :
                type = 'regexp';
                break;
            default :
                type = 'object';
                break;
            }
            break;

        default :
            type = 'undefined';
            break;
        }

        return type;
    },

    /**
     * @staticMethod trim(Object str) 判断传入的对象转换成字符串，并去除前后空白字符
     * @param str
     * @returns {String}
     */
    trim : function ( str ) {
        return null == str ? '' : trim.call( str );
    },

    /**
     * @staticMethod trimLeft(Object str) 判断传入的对象转换成字符串，并去除前置空白字符
     * @param str
     * @returns {String}
     */
    trimLeft : function ( str ) {
        return null == str ? '' : trimLeft.call( str );
    },

    /**
     * @staticMethod trimRight(Object str) 判断传入的对象转换成字符串，并去除后置空白字符
     * @param str
     * @returns {String}
     */
    trimRight : function ( str ) {
        return null == str ? '' : trimRight.call( str );
    },

    /**
     * @staticMethod trimAll(Object str) 判断传入的对象转换成字符串，并去除所有空白字符
     * @param str
     * @returns {String}
     */
    trimAll : function ( str ) {
        return null == str ? '' : trimAll.call( str );
    },

    /**
     * @staticMethod isArray(Object obj) 判断传入的对象是否为数组
     * 
     * <pre>
     * 1、obj - 被判断的对象
     * </pre>
     * 
     * @return {Boolean}
     */
    isArray : Array.isArray || function ( obj ) {
        return (obj instanceof Array) || ('[object Array]' == obj_toString.apply( obj ) && null != obj.length);
    },

    /**
     * @staticMethod isCollection(Object obj) 判断传入的对象是否为集合对象
     * 
     * <pre>
     * 1、obj - 被判断的对象
     * </pre>
     * 
     * @return {Boolean}
     */
    isCollection : function ( collection ) {
        return collection && (Fan.isArray( collection )
                || collection.length != null
                || /List]$/.test( obj_toString.call( collection ) )
                || '[object HTMLCollection]' == obj_toString.call( collection )
                || '[object NodeList]' == obj_toString.call( collection )
                || (typeof (collection) == 'object' 
                    && ('isIE' + collection.constructor
                            == 'isIE[object StaticNodeList]')));
    },

    /**
     * @staticMethod isDate(Object obj) 判断传入的对象是否为Date对象
     * @param date
     * @returns {Boolean}
     */
    isDate : function ( date ) {
        return date instanceof Date;
    },

    /**
     * @staticMethod isElement(Object obj) 判断传入的对象是否为HTML元素对象
     * @param elem
     * @returns {Boolean}
     */
    isElement : function ( elem ) {
        if ( !elem ) return false;
        if ( window.HTMLElement )
            return elem instanceof window.HTMLElement;
        else
            return !!(elem.nodeType && elem.cloneNode && elem.tagName);
    },

    /**
     * @staticMethod isRegExp(Object obj) 判断传入的对象是否为正则表达式对象
     * @param reg
     * @returns {Boolean}
     */
    isRegExp : function ( reg ) {
        return reg instanceof RegExp;
    },

    /**
     * @staticMethod isWindow(Object obj)
     *               判断传入的对象是否为window对象，该函数只可在同域情况下使用。
     * 
     * <pre>
     * 1、obj - 被判断的对象
     * </pre>
     * 
     * @return {Boolean}
     */
    isWindow : (function () {
        // 从top递归向下找，找到与当前相等的window才返回true，未找到则返回false
        var _f = function ( c, w, i, r ) {
            if ( !w )
                return false;
            if ( w == c )
                return true;
            while ( !r && w.length > i )
                r = arguments.callee( c, w[ i++ ], 0, false );
            return r;
        };
        return function ( c ) {
            return c == window || c == top || _f( c, top, 0, false );
        };
    })(),

    /**
     * @staticMethod isFunction(Object obj) 判断传入的对象是否为function
     * 
     * <pre>
     * 1、obj - 被判断的对象
     * </pre>
     * 
     * @return {Boolean}
     */
    isFunction : function ( f ) {
        return (typeof f == 'function' || f instanceof Function);
    },

    /**
     * @staticMethod isEmpty(Object obj) 判断传入的对象是否为null或空字符串
     * 
     * <pre>
     * 1、obj - 被判断的对象
     * </pre>
     * 
     * @return {Boolean}
     */
    isEmpty : function ( obj ) {
        return null == obj || (typeof obj == 'string' && '' == obj);
    },

    /**
     * @staticMethod isEmptyObject(Object obj) 判断传入的对象是否为空对象，即:不包含任何内容的对象{}
     * 
     * <pre>
     * 1、obj - 被判断的对象
     * </pre>
     * 
     * @return {Boolean}
     */
    isEmptyObject : function( obj ) {
        if ( null == obj )
            return true;
        
        for ( var p in obj ) {
            if ( p )
                return false;
        }
        
        return true;
    },

    /**
     * @staticMethod isNumber(Object obj) 判断传入的内容是否为数值类型，包含（+-无穷大）
     * 
     * <pre>
     * 1、obj - 被判断的对象
     * </pre>
     * 
     * @return {Boolean}
     */
    isNumber : function ( obj ) {
        return typeof obj == 'number' && !isNaN( obj );
    },

    /**
     * @staticMethod isNum(Object obj) 判断传入的内容是否为合法数值，不包含（+-无穷大）
     * 
     * <pre>
     * 1、obj - 被判断的对象
     * </pre>
     * 
     * @return {Boolean}
     */
    isNum : function ( n ) {
        return typeof n == 'number' && !isNaN( n ) && (Number.POSITIVE_INFINITY != n && Number.NEGATIVE_INFINITY != n);///^[-+]?\d*\.?\d+$/.test( n + '' );
    },
    
    /**
     * 判断是否为boolean类型
     */
    isBoolean : function ( b ) {
        return typeof b == 'boolean'; // b === true || b === false;
    },

    /**
     * @staticMethod isString(Object obj) 判断传入的内容是否为字符串
     * 
     * <pre>
     * 1、obj - 被判断的对象
     * </pre>
     * 
     * @return {Boolean}
     */
    isString : function ( str ) {
        return typeof str == 'string' || str instanceof String;
    },

    /**
     * @staticMethod isChinese(String str) 判断传入的字符串是否全部是中文
     */
    isChinese : function ( str ) {
        return KEYS.REG_CHINESE.test( str );
    },
    
    /**
     * @staticMethod isRunAtLocal() 是否在本地运行
     */
    isRunAtLocal : function () {
    	return isRunAtLocal;
    },

    // 递增唯一id
    uuid : 1,
    
    /**
     * @staticMethod id(String prefix) 生成一个id,可以指定前缀
     * 
     * <pre>
     * 1、prefix - 前缀，缺省为空字符串
     * </pre>
     * 
     * @return 返回一个新的字符串id
     */
    id : function ( p ) {
        return (p || '') + '' + (Fan.uuid++);
    },
    
    /**
     * 返回dom元素的唯一keyid
     * @param elem
     * @returns
     */
    getElemKeyId : function ( elem ) {
        var keyId;
        if ( Fan.isElement( elem ) ) {
            keyId = elem[ KEYS.ELEM_KEY_ID_NAME ];
            if ( !keyId ) {
                keyId = Fan.id( KEYS.ELEM_KEY_ID_NAME );
                elem[ KEYS.ELEM_KEY_ID_NAME ] = keyId;
            }
        }
        return keyId || null;
    },

    /**
     * @staticMethod getAbsPath(String path)
     *               根据任意路径，返回该路径的绝对路径，缺省参数时，返回当前绝对路径
     * 
     * <pre>
     * 1、path - 任意路径，可选
     * </pre>
     * 
     * @return {String} 返回绝对路径
     */
    getAbsPath : function() {
        var m = document.createElement( Fan.ie ? 'img' : 'script' );
        m.setAttribute( 'src', '/' );
        var domain = m.src.replace( /[\/]+$/, '' );
        m.src = '';
        
        return function ( path ) {
            if ( '/' == path )
                return domain;
            
            try {
                m.setAttribute( 'src', path || './' );
                return m.src.replace( /[\/]+$/, '' );
            } finally {
                m.src = '';
            }
        };
    }(),

    /**
     * 【第一栈】用于初始化类或接口 负责类的初始化结构（第一栈先被执行（声名一个类），再执行第二栈（初始化类的静态属性））
     * 函数栈，确保函数的执行顺序（先入栈后执行，后入栈先执行） 函数都是自动调用。
     * 注：使用栈实现，是为了解决js动态加载时，避免用同步ajax方式请求，ajax方式会存在三个问题： 1、无法调试
     * 2、无法本地化，即：无法离线支持 3、存在跨域问题 4、性能不佳
     * 因此采用动态创建script，并控制加载顺序，解决ajax方式的三个问题。
     * 
     * @param stackFn -
     *            需要压入栈的函数
     */
//    stack : (function () {
//        var fn = [ function ( stackFn ) {
//            arguments.callee.stackList.push( stackFn );
//            var f = [ function () {
//                var tmpFn = Fan.stack.stackList.pop();
//                if ( Fan.isFunction( tmpFn ) ) {
//                    tmpFn();
//                }
//
//                tmpFn = null;
//            } ][ 0 ];
//            var fnStr = fun_toString.call( f );
//            Fan.defer( Fan.execCode, 1, Fan, [ '(' + fnStr + ')()' ] );
//        } ][ 0 ];
//        fn.stackList = [];
//        return fn;
//    })(),

    /**
     * @staticMethod notice(String spaceName, Function callback)
     *               指定的类或接口加载完毕后执行的通知
     * 
     * @param spaceName -
     *            空间名，类名或者接口名
     * @param callback -
     *            类或接口加载完毕后，执行该回调
     */
    notice : function ( spaceName, callback ) {
        var id = Fan.on( spaceName, function () {
            Fan.un( spaceName, id );
            Fan.call( callback );
            callback = spaceName = id = null;
        } );
    },

    /**
     * 内置的简易Map集合
     */
    newMap : function () {
        return {
            _es : {},
            _len : 0,
            get : function ( key ) {
                return this._es[ key ] ? this._es[ key ].value : null;
            },
            put : function ( key, value ) {
                var r = this.get( key );
                if ( this.has( key ) ) {
                    this._es[ key ].value = value;
                } else {
                    this._es[ key ] = {
                        key : key,
                        value : value,
                        toString : function () {
                            return '{' + this.key + ':' + this.value + '}';
                        }
                    };
                    this._len++;
                }
                return r;
            },
            has : function ( key ) {
                return (key in this._es);
            },
            remove : function ( key ) {
                var r = null;
                if ( this.has( key ) ) {
                    r = this._es[ key ].value;
                    if ( delete this._es[ key ] ) {
                        this._len--;
                    }
                }
                return r;
            },
            clear : function ( deleteAll ) {
                if ( deleteAll )
                for (var k in this._es )
                    delete this._es[ k ];
                this._es = {};
                this._len = 0;
            },
            size : function () {
                return this._len;
            },
            each : function ( fn, scope ) {
                var r = undefined;
                for ( var k in this._es ) {
                    r = fn.call( scope || this._es[ k ], k, this._es, this._es[ k ].value );
                    if ( r !== undefined ) {
                        return r;
                    }
                }
                return r;
            },
            getKeySet : function () {
                var ks = [];
                this.each( function ( k ) {
                    ks.push( this.key );
                } );
                return ks;
            },
            destroy : function() {
                this._es = this._len = this.clear = this.destroy = this.each = null;
                this.get = this.getKeySet = this.has = this.put = this.remove = this.size = null;
                logger.debug( '[destroy] map object' );
            }
        };
    },

    // 创建一个XMLHttpRequest对象
    xhr : function () {
        var xhr, tmpFn;
        try {
            xhr = new XMLHttpRequest();
            tmpFn = function () {
                return new XMLHttpRequest();
            };
        } catch ( e ) {
            try {
                xhr = new ActiveXObject( 'Microsoft.XMLHTTP' );
                tmpFn = function () {
                    return new ActiveXObject( 'Microsoft.XMLHTTP' );
                };
            } catch ( e ) {
                try {
                    xhr = new ActiveXObject( 'Msxml2.XMLHTTP' );
                    tmpFn = function () {
                        return new ActiveXObject( 'Msxml2.XMLHTTP' );
                    };
                } catch ( e ) {
                    throw new Error( 'Exception:Fan.xhr()::can\'t create XMLHttpRequest object' );
                }
            }
        }
        tmpFn && (this.xhr = tmpFn);
        tmpFn = null;

        try {
            return xhr;
        } finally {
            xhr = null;
        }
    },

    // 设置一个日志输入对象
    setLogger : function ( lgr ) {
        Fan.apply( logger, lgr );
        Fan.fire( 'Fan.setLogger', [ lgr ] );
    },

    // 获取一个日志输入对象
    getLogger : function () {
        return logger;
    },

    // 覆盖toString方法
    toString : function () {
        return '[object Fan]';
    }
} );

// 自定义事件集合
var customEventMap = Fan.newMap();

/**
 * Listener
 */
var Listener,
    eventMap = Fan.newMap();
Fan.Listener = Listener = {
    // 获取事件缓存的对象
    getEventMap : function() {
        return eventMap;
    },

    /**
     * @method on(String eventName, Function handler, String eventId)
     *         增加事件监听器
     * 
     * <pre>
     * 1、eventName - 事件名称
     * 2、handler - 事件处理函数，该处理函数中this指向组件本身
     * 3、eventId - 事件id标识，便于区别其他同类型事件，可选，缺省时，会自动生成
     * </pre>
     * 
     * @return eventId
     */
    on : function ( eventName, handler, eventId ) {
        var fnMap = eventMap.get( eventName );
        eventId = eventId || Fan.id( 'event-' );
        if ( fnMap ) {
            fnMap.put( eventId, handler );
        } else {
            fnMap = Fan.newMap();
            fnMap.put( eventId, handler );
            eventMap.put( eventName, fnMap );
        }
        logger.debug( '[增加监听] [ ' + eventName + ' ]  \t[ ' + eventId + ' ]' );
        return eventId;
    },

    /**
     * @method un(String eventName, String eventId) 移除事件监听器
     * 
     * <pre>
     * 1、eventName - 事件名称
     * 2、eventId - 事件id标示，可选，是在注册事件时指定的eventid，或者返回的id。该参数缺省时，将移除所有同类型事件
     * </pre>
     */
    un : function ( eventName, eventId ) {
        if ( !eventMap.size() )
            return;
        logger.debug( '[移除监听] [ ' + eventName + ' ]  \t[ ' + (eventId || '') + ' ]' );
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
     * @method fire(String eventName, Array args) 触发指定的事件
     * 
     * 【注】：相同的事件，触发时，return false则会终止事件链调用。
     * 
     * <pre>
     * 1、eventName - 事件名称
     * 2、args - 给事件处理函数传入的参数列表，以数组形式
     * </pre>
     * 
     * @return 返回事件处理函数的返回值
     */
    fire : function ( eventName, args ) {
        logger.debug( '[触发监听] [ ' + eventName + ' ]  \t参数:' + (arguments.length > 1 ? '[ ' + args + ' ]' : '[]') );
        
        var fnMap = eventMap.get( eventName );
        if ( fnMap && fnMap.size() ) {
            var argsLen = arguments.length;
            args = Fan.isArray( args ) ? args : argsLen > 1 ? ((args && args.callee && args.length != null) ? args : [ args ]) : [];
            argsLen = null;
            return fnMap.each( function ( k, es, v ) {
                if ( Fan.isFunction( v ) ) {
                    var r = v.apply( this, args || [] );
                    if ( false === r ) {
                        return r;
                    }
                }
            }, this );
        }
        eventName = args = fnMap = null;
    }
};

// 暴露接口: on | un | fire
Fan.on = function ( eventName, handler, eventId ) {
    return Listener.on.apply( Listener, arguments );
},
Fan.un = function ( eventName, eventId ) {
    return Listener.un.apply( Listener, arguments );
},
Fan.fire = function ( eventName, args ) {
    return Listener.fire.apply( Listener, arguments );
};

// Loader
/**
* 文件加载完毕后的回调
* 
* @private
* @param xhr -
*            XMLHttpRequest对象
* @param onSuccess -
*            文件加载成功回调
* @param onFailure -
*            文件加载失败回调
*/
function loadCallback( xhr, onSuccess, onFailure ) {
  if ( 4 !== xhr.readyState )
      return;
  
  // clear event
  xhr.onreadystatechange = Fan.ie < 7 ? noop : null;
  
  //通过http,返回为[200,300)区间内则视为成功, 未修改304,来自缓存, IE9 1223 ==> 204
  var status = xhr.status;
  if ( status >= 200 && status < 300 || status === 304 || status === 0 || status === 1223 )
      Fan.call( onSuccess, xhr, [ xhr.responseText || xhr.responseXML || '' ] );
  else
      Fan.call( onFailure, xhr );
};

var Loader;
Fan.Loader = Loader = {

  /**
   * AJAX 方式加载文本文件
   * 
   * @public
   * @param url -
   *            文件路径
   * @param onSuccess -
   *            文件加载成功回调，并接受一个XMLHttpRequest.responseText文本或xhr.responseXML文档对象
   * @param onFailure -
   *            文件加载失败回调
   * @param config -
   *            其他配置参数
   * <code>
   *      config:{
   *          charset : 'utf-8', // 字符集设置，默认utf-8
   *          method : 'GET',    // 请求方式，默认GET
   *          async : false,     // 是否异步，默认false
   *          params : null,     // 请求参数, 默认null
   *          headers : null,    // 请求头部信息, 默认null
   *          mimeType : 'text/xml'
   *      }
   * </code>
   */
  loadFile : function ( url, onSuccess, onFailure, config ) {
      var xhr = Fan.xhr();
      config = Fan.apply( {
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
      if ( typeof params == 'object' && !Fan.isEmptyObject( params ) ) {
          var p = [];
          Fan.each( params, function( key ) {
              null != params[ key ] && p.push( encodeURIComponent( key ) + '=' + encodeURIComponent( params[ key ] ) );
          } );
          params = p.join( '&' );
      }
      
      // GET 方式,参数追加在url上
      if ( params && /^GET$/i.test( config.method ) ) {
          url += /\?/.test( url ) ? '&' + params : '?' + params;
      }

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
      if ( /^POST|PUT$/i.test( config.method ) ) {
          xhr.setRequestHeader( 'CONTENT-TYPE', 'application/x-www-form-urlencoded;charset=' + config.charset );
      }
      
      // 设置请求头部信息
      if ( config.headers ) {
          for ( var k in config.headers ) {
              k && xhr.setRequestHeader( k, config.headers[ k ] );
          }
      }

      // 仅在异步请求时使用onreadystatechange指定回调函数
      if ( config.async ) {
          xhr.onreadystatechange = Fan.proxy( loadCallback, null, [ xhr, onSuccess, onFailure ] );
      }
      
      // 发送请求
      xhr.send( !/^GET$/i.test( config.method ) && null != params ? params : null );

      if ( !config.async ) {
          loadCallback( xhr, onSuccess, onFailure );
      }
  },

  /**
   * 动态创建script元素加载远程js代码
   * 
   * @public
   * @param url -
   *            文件路径
   * @param onLoad -
   *            加载成功回调
   * @param onError -
   *            加载失败回调
   * @param config -
   *            其他配置参数
   * 
   * <code>
   *      config:{
   *          charset : 'utf-8', // 字符集设置，默认utf-8
   *          async : false,     // 异步加载，异步执行，默认false
   *          defer : false,     // 异步加载，顺序执行，默认false
   *          parent : null,     // script元素的容器，默认null，则以head元素为容器
   *          type : 'text/javascript'
   *      }
   * </code>
   * @returns 返回创建好的script元素对象
   */
  loadScript : function ( url, onLoad, onError, config ) {
      config = Fan.apply( {
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
      if ( Fan.isFunction( onError ) ) {
          script.onerror = onError;
      }

      // onload event
      if ( Fan.isFunction( onLoad ) ) {
          if ( 'addEventListener' in script )
              script.onload = onLoad;
          else if ( 'readyState' in script )
              script.onreadystatechange = function () {
                  var rs = this.readyState;
                  if ( 'loaded' == rs || 'complete' == rs ) {
                      script.onerror = script.onload = script.onreadystatechange = null;
                      script = config = onError = null;
                      Fan.call( onLoad );
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
   * 动态创建link元素加载远程css样式表
   * 
   * @public
   * @param url -
   *            css文件路径
   * @param onLoad -
   *            加载成功回调
   * @param onError -
   *            加载失败回调
   * @param config -
   *            其他配置参数
   * 
   * <code>
   *      config:{
   *          charset : 'utf-8', // 字符集设置，默认utf-8
   *          parent : null      // link元素的容器，默认null，则以head元素为容器
   *      }
   * </code>
   * @returns 返回创建好的script元素对象
   */
  loadCss : function ( url, onLoad, onError, config ) {
      config = Fan.apply( {
          charset : 'utf-8',
          parent : null
      }, config );

      var link = document.createElement( 'link' );
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.charset = config.charset;
      config.id && (link.id = config.id);

      // onerror event
      if ( Fan.isFunction( onError ) ) {
          link.onerror = onError;
      }

      // onload event
      if ( Fan.isFunction( onLoad ) ) {
          if ( 'addEventListener' in link )
              link.onload = onLoad;
          else if ( 'readyState' in link )
              link.onreadystatechange = function () {
                  var rs = this.readyState;
                  if ( 'loaded' == rs || 'complete' == rs ) {
                      link.onload = link.onreadystatechange = link.onerror = null;
                      link = config = onError = null;
                      Fan.call( onLoad );
                      onLoad = null;
                  }
              };
          else
              link.onload = onLoad;
      }

      url && (link.href = url);

      (config.parent || document.getElementsByTagName( 'head' )[ 0 ]).appendChild( link );

      return link;
  },

  /**
   * 动态创建script元素执行js代码
   * 
   * @public
   * @param code -
   *            字符串代码，或者配置项
   * @param charset -
   *            代码字符集，可选
   * 
   * @returns 返回创建好的script元素对象
   */
  execScript : function ( code, charset ) {
      if ( !Fan.isString( code ) )
          return;

      var config = {
              charset : charset || 'utf-8'
          },
          script = this.loadScript( null, null, null, config );

      switch ( arguments.callee.__flag ) {
      case 1 :
          script.appendChild( document.createTextNode( code ) );
          break;
      case 2 :
          script.text = code;
          break;
      default :
          
          try {
              script.appendChild( document.createTextNode( code ) );
              arguments.callee.__flag = 1;
          } catch ( e ) {
              script.text = code;
              arguments.callee.__flag = 2;
          }
          break;
      }

      return script;
  },

  /**
   * 动态创建style元素执行css代码
   * 
   * @public
   * @param cssCode -
   *            字符串代码，或者配置项
   * @param charset -
   *            代码字符集，可选
   * 
   * @returns 返回创建好的style元素对象
   */
  execCss : function ( cssCode, charset ) {
      if ( !Fan.isString( cssCode ) )
          return;

      var style, config = {
          charset : charset || 'utf-8'
      };

      if ( !!document.createStyleSheet ) {
          style = document.createStyleSheet();
          style.cssText = cssCode;
      } else {
          style = document.createElement( 'style' );
          style.type = 'text/css';
          style.charset = config.charset;
          style.appendChild( document.createTextNode( cssCode ) );
          document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );
      }

      return style;
  }
};

// Selector
//var Selector;
//Fan.Selector = Selector = {
//
//    /**
//     * @staticMethod eachDom(HTMLElement/Document dom, Function fn,
//     *               Object scope) 深度遍历指定的dom元素以其子元素
//     * 
//     * <pre>
//     * 1、dom - 被遍历的元素
//     * 2、callback - 遍历时调用的回调函数，接受一个node参数(当前遍历到的元素节点)
//     * 3、scope - 遍历时的回调函数中，this的作用域，默认是当前遍历到的元素节点
//     * </pre>
//     * 
//     * @return 返回一个在回调函数中返回的非undefined的值
//     */
//    eachDom : (function () {
//        var _ea = function ( dom, callback, scope ) {
//            var ret = undefined;
//            for ( var e = dom.firstChild; e; e = e.nextSibling ) {
//                ret = callback.call( scope || e, e );
//                if ( undefined !== ret )
//                    return ret;
//                if ( e.firstChild ) {
//                    ret = _ea( e, callback, scope );
//                    if ( undefined !== ret )
//                        return ret;
//                }
//            }
//        };
//        return function ( dom, callback, scope ) {
//            dom = dom.documentElement || dom;
//            if ( dom.firstChild ) {
//                var ret = _ea( dom, callback, scope );
//                if ( undefined !== ret )
//                    return ret;
//            }
//        };
//    })()
//};

// 暴露选择器接口
// Fan.eachDom = Selector.eachDom;

// 动画路径绘制, 根据时间, 计算不同的点
Fan.ease = {
    quadratic: {
        style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fn: function (k) {
            return k * ( 2 - k );
        }
    },
    circular: {
        style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',   // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
        fn: function (k) {
            return Math.sqrt( 1 - ( --k * k ) );
        }
    },
    back: {
        style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        fn: function (k) {
            var b = 4;
            return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
        }
    },
    bounce: {
        style: '',
        fn: function (k) {
            if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
                return 7.5625 * k * k;
            } else if ( k < ( 2 / 2.75 ) ) {
                return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
            } else if ( k < ( 2.5 / 2.75 ) ) {
                return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
            } else {
                return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
            }
        }
    },
    elastic: {
        style: '',
        fn: function (k) {
            var f = 0.22,
                e = 0.4;

            if ( k === 0 ) { return 0; }
            if ( k == 1 ) { return 1; }

            return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
        }
    }
};

// 生成单个动画帧(动画中的1帧)
Fan.frame = function( callbcak, duration, easingFn ) {
    duration = duration >> 0;
    
    var startTime = Fan.now(),
        destTime  = startTime + duration,
        isAnimating, easing;
        easingFn  = easingFn || Fan.ease.quadratic.fn;

    function step() {
        var now = Fan.now();

        if ( now >= destTime ) {
            isAnimating = false;
            callbcak( 1 );
            return;
        }

        now = ( now - startTime ) / duration;
        easing = easingFn( now );
        
        // curr = ( end - start ) * easing + start;
        
        callbcak( easing );

        if ( isAnimating )
            return RAF( step );
    }

    isAnimating = true;
    return step();
};

// 取消动画帧回调
Fan.cancelFrame = function( timeoutId ) { CAF( timeoutId ); };

// 下一帧回调
Fan.nextFrame = function( callback ) { return RAF( callback ); };
// 取消下一帧回调
Fan.cancelNextFrame  = function( timerId ) { CAF( timerId ); };


// Loading the configuration script
(function () {
    var 
    // 日志
    // logger = Fan.getLogger(),
    
    // 取出所有script标签
    scripts = document.getElementsByTagName( 'script' ),
    
    // 后缀 '.js' or '-min.js'，随Fan主文件后缀取压缩版的js文件
    suffix = '.js',
    
    // 是否载入Fanx扩展
    loadFanx = false;
    
    // 获取Fan的标签配置
    Fan.each( scripts, function ( i ) {
        if ( /\bFan(-min)?\.js\s*$/.test( this.src ) ) {
            suffix = (RegExp.$1 || '') + '.js';
            
            // 取得root配置
            if ( this.getAttribute( 'root' ) )
                Fan.root = this.getAttribute( 'root' );
            else
                Fan.root = Fan.trim( this.getAttribute( 'src' ).replace( /\bFan(-min)?\.js\s*$/, '' ) ) || './';

            /**
             * @staticProperty root Fan home目录的根路径
             * 
             * 【注】通常不需要设置，当主文件Fan.js不在根目录下时，需设置根目录路径
             * 
             * <code>
             * 可通过 Fan.root = '/xxx/xxx/'; 设置
             * 或者在 script 标签中加入配置项 root="/xxx/xxx/" 指定根目录
             * </code>
             */
            Fan.root = Fan.root || Fan.getAbsPath();

            // 重置script元素上的root属性
            this.setAttribute( 'root', Fan.root );

            // 取得local参数配置,是否在本地运行
            if ( this.getAttribute( 'local' ) ) {
            	// 是否在本地执行
            	isRunAtLocal = /^true$/i.test( this.getAttribute( 'local' ) );
                this.setAttribute( 'local', isRunAtLocal );
            } else {
                isRunAtLocal = /^file:$/i.test( location.protocol );
                this.setAttribute( 'local', isRunAtLocal );
            }
            
            // 取得preload预加载配置
            if ( this.getAttribute( 'preload' ) ) {
                // 初始化导入
                var preload = Fan.trimAll( this.getAttribute( 'preload' ) );
                var async = !/^false$/i.test( this.getAttribute( 'preload-async' ) || 'false' );
                this.setAttribute( 'preload', preload );
                this.setAttribute( 'preload-async', async );
                
                // 导入初始化的文件
                Fan( function () {
                    // 预载入文件, 从配置中读取preload-async,是否异步加载,取值true/false,默认缺省为false同步
                    Fan.ClassManager.preLoadFile( preload, async );
                    preload = async = null;
                } );
            }
            
            // 取得import配置
            if ( this.getAttribute( 'import' ) ) {
                // 初始化导入
                var imports = Fan.trimAll( this.getAttribute( 'import' ) );
                this.setAttribute( 'import', imports );

                // 导入初始化导入的文件
//                Fan.defer( function () {
//                    Fan.Import( imports );
//                    imports = null;
//                    importJsState = 'complete';
//                } );
                // 仅当内部所需js加载完毕后,才开始执行import
                Fan.notice( jsLoadNotice, function () {
                    Fan.Import( imports );
                    imports = null;
                    importJsState = 'complete';
                } );
            } else
            	importJsState = 'complete';
            
            // 取得fanx配置
            if ( this.getAttribute( 'fanx' ) ) {
                // 是否载入Fanx扩展, 初始化导入扩展内容
                loadFanx = 'true' === Fan.trimAll( this.getAttribute( 'fanx' ) );
                this.setAttribute( 'fanx', loadFanx );
            }
            
            return true;
        }
    } );
    
    // 消除内部变量
    scripts = null;

    /**
     * @staticProperty absRoot Fan home目录的绝对根路径
     */
    Fan.absRoot = Fan.getAbsPath( Fan.root );

    // -------------------------------------
    //
    // 需要加载的核心文件
    //
    // -------------------------------------
    var
    
    // Fan home路径
    root = Fan.absRoot,
    
    // 需要同步加载的核心文件, 一般是加载优先级高的文件
    syncCoreFiles = loadFanx ? [
        // 缓存
        '/src/core/util/Cached' + suffix
    ] : [],
    
    // 可异步加载的核心文件
    asyncCoreFiles = loadFanx ? [
        // Element 封装类
        '/src/core/dom/Element' + suffix,
        // Element 集合封装类
        '/src/core/dom/Elements' + suffix
    ] : [],

    // 总核心文件列表
    coreFiles = syncCoreFiles.concat( asyncCoreFiles ),
    
    // 总核心文件个数
    coreFilesCount = coreFiles.length,
    
    // 可并行加载的js文件位置
    canAsyncIdx = syncCoreFiles.length - 1;
        
    syncCoreFiles = asyncCoreFiles = null;
    
    if ( coreFilesCount <= 0 ) {
        coreFiles = null;
        Fan.defer( function() {
            jsLoadState = 'complete';
            Fan.fire( jsLoadNotice );
        } );
        return false;
    }
    
    // 输出核心文件列表
    coreFiles.length > 0 && logger.info( '[提示] 载入Fan核心文件:\n' + root + coreFiles.join( '\n' + root ) );

    // 【加载方案：1】script方式加载核心文件
    var doload4script = function ( i ) {
        if ( i >= coreFiles.length )
            return;

        var fileName = root + coreFiles[ i ];
        Fan.Loader.loadScript( fileName, Fan.proxy( function ( content ) {
            if ( --coreFilesCount <= 0 ) {
                jsLoadState = 'complete';
            	Fan.fire( jsLoadNotice );
            }
            
            // 执行成功
            logger.info( '[提示] 文件 "' + this + '" 加载成功' );

            // 需要串行加载的js
            if ( i <= canAsyncIdx ) {
                doload4script( i + 1 );
            }
        }, fileName ), Fan.proxy( function () {
            if ( --coreFilesCount <= 0 ) {
                jsLoadState = 'complete';
                Fan.fire( jsLoadNotice );
            }

            // 加载类文件失败
            throw new Error( '[严重] 文件 "' + this + '" 加载失败' );
        }, fileName ) );

        // 可被并行加载的js
        if ( i > canAsyncIdx ) {
            doload4script( i + 1 );
        }
    };

    // 启用方案1：script加载核心文件，从索引0开始
    setTimeout( function() {
        // 清除另一个方案
        doLoad4ajax = null;
        doload4script( 0 );
    }, 0 );
    
    // 【加载方案：2】AJAX方式加载核心文件
    var doLoad4ajax = function() {
        // 清除另一个方案
        doload4script = null;
        
        Fan.each( coreFiles, function( i ) {
            var fileName = root + coreFiles[ i ];
            Fan.Loader.loadFile( fileName, Fan.proxy( function( content ) {
                var fname = this + '';
                try {
                    // 尝试执行js文件
                    Fan.gEval( content, fname );

                    if ( --coreFilesCount <= 0 ) {
                        jsLoadState = 'complete';
                        Fan.fire( jsLoadNotice );
                    }

                    // 执行成功
                    logger.info( '[提示] 文件 "' + fname + '" 加载成功' );
                } catch ( e ) {
                    if ( --coreFilesCount <= 0 ) {
                        jsLoadState = 'complete';
                        Fan.fire( jsLoadNotice );
                    }

                    // 执行js出现异常
                    logger.error( '[严重] 类文件 "' + fname + '" 载入失败，' + e );
                    throw e;
                }
            }, fileName ), Fan.proxy( function() {
                if ( --coreFilesCount <= 0 ) {
                    jsLoadState = 'complete';
                    Fan.fire( jsLoadNotice );
                }

                var fname = this + '';
                // 加载类文件失败
                logger.error( '[严重] 文件 "' + fname + '" 加载失败' );
            }, fileName ), {
                async : i > canAsyncIdx
            } );
        } );
    };
    
    // 启用方案2：Ajax执行加载核心文件
    // setTimeout( doLoad4ajax, 0 );
})();


/**
 * 检测浏览器支持的特性
 */
Fan.support = (function() {
    var

    // 是否支持socket
    socket = !!window.WebSocket,
    // 是否支持触摸
    touch = 'ontouchend' in document,
    // 是否支持css3的transform样式
    css3transform = 'transform' in document.createElement( 'div' ).style;
    
    return {
        socket        : socket,
        touch         : touch,
        css3transform : css3transform
    };
})();

// 根据浏览器支持情况,特殊处理
if ( Fan.support.xxx ) {
    
}

/**
 * Fan类管理机制 v1.2
 */
(function ( Fan, undefined ) {
var
    window = this,

    // 默认日志输出对象
    // logger = Fan.getLogger(),
    
    // ECMAScript 6 编译器
    compiler = null,
    
    // 本地函数
    nativeFunction = function() { return 'function() { [native code] }'; },
    
    // Object.getClass方法
    objectClassFunction = function() { return Object; },
    
    // 扩展Loader
    loader = Fan.apply( Fan.Loader, {

        /**
         * AJAX方式加载类文件，并执行类文件
         * 
         * @param className -
         *            类完整名称
         * @param onSuccess -
         *            类文件加载并执行成功
         * @param onFailure -
         *            类文件加载异常
         * @param onResolveError -
         *            类文件解析错误
         * @param async -
         *            是否异步加载，默认false
         */
        loadClass : function ( className, onSuccess, onFailure, onResolveError, async ) {
            var 
            // js文件url
            url = '',
            // 'Fan.xxx.Class1' --> 'Fan/xxx/Class1'
            classPath = className.split( '.' ).join( KEYS.SPEED_CHAR ),
            // 是否使用script标签加载js文件
            useScriptLoading = false;

            if ( /^Fan[.]/.test( className ) ) {
                // 若是工作模式下，则以scirpt加载Fan内部js
                // useScriptLoading = 'operate' == classManager.getMode();
                url = classPath.replace( /^Fan[\/]/, Fan.root.replace( /\/+$/, '' ) + '/src' + KEYS.SPEED_CHAR ) + '.js';
            } else {
                // use ajax load file
                url = classManager.getClassPath().replace( /\/+$/, '' ) + KEYS.SPEED_CHAR + classPath + '.js';
            }

            // 加载类文件
            if ( useScriptLoading ) {
                this.loadScript( url, function ( content ) {
                    // 执行成功
                    Fan.call( onSuccess );
                }, function () {
                    // 加载类文件失败
                    Fan.call( onFailure );
                    throw new Error( KEYS.ERROR + '[严重] 类文件 "' + className + '" 加载失败' );
                }/*, { id : className }*/ );
            } else {
                this.loadFile( url, function ( content ) {
                    // this ==> xhr
                    try {
                        
                        // 编译代码, 若成功, 返回编译后的代码, 否则返回错误信息
                        var code = classManager.getCompiler().build( content );

                        if ( typeof code === 'string' )
                            // 解析类文件
                            classManager.parseClass( code );
                        else {
                            var errLine = code[ 0 ], errColumn = code[ 1 ], errMsg = code[ 2 ], errCode = code[ 3 ];
                            throw new CompilerError( '类文件编译异常:' + errMsg, className, '', errLine, errColumn, errCode );
                        }
                        
                        // 执行成功
                        Fan.call( onSuccess, this );
                    } catch ( e ) {
                        // 执行js出现异常, 打上写入异常信息, 在其他地方进行判别
                        e._errType = ErrorTypes.ClassFileParseError;
                        e._errClassName = className;
                        e._errMethodName = '';
                        
                        classManager.error( e );
                        
                        Fan.call( onResolveError, this, [ e ] );
                    }
                }, function () {
                    // this ==> xhr
                    // 加载类文件失败
                    Fan.call( onFailure, this );
                    // throw new Error( '[严重] 类文件 "' + className + '" 加载失败' );
                }, {
                    async : async,
                    mimeType : 'text/javascript',
                    headers : {
                        'Accept' : 'text/javascript'
                    }
                } );
            }
        }
    } ),
    
    // 内部空间，存放被加载的包与类,通过Fan.getSpace()获得该对象
    innerSpace = {
        Fan : Fan
    },

    // 常量键
    KEYS = Fan.apply( Fan.KEYS, {
        
        IS_CLASS : '.IS.FAN.CLASS.',
        IS_PACKAGE : '.IS.FAN.PACKAGE.',
        IS_INTERFACE : '.IS.FAN.INTERFACE.',
        IS_PRIVATE_PACKAGE : '.IS.FAN.PRIVATE.PACKAGE.',
        IS_UNIMPLEMENT_METHOD : '.IS.FAN.UNIMPLEMENT.METHOD.',

        CLAZZ_BODY : '.CLAZZ.BODY.',
        CLAZZ_NEW_SRC_CODE : '.CLAZZ.NEW.SRC.CODE.',
        METHOD_NAME : '.METHOD.NAME.',
        THIS : '.THIS.',
        SUPER : '.SUPER.',
        SET_SUPER : '.SET.SUPER.',
        GET_SUPER : 'getSuper',
        
        // 抽象类名称检测, 类名以Abstract开头则为抽象类, 不检测实现接口
        REG_ABSTRACT_CLASS_PREFIX : /^Abstract/,
        
        // 抓取Fan.Class定义的类代码, 注:classBody的function不能有参数
        REG_FAN_CLASS_DEFINED_CODE : /((?:^|[,;\(\){}=]|(?:\*[\/])|(?:\/\/[^\n]*\n))\s*(?:Fan|OOP)\s*\.\s*(Class|Interface)(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\((?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*(['"])([a-zA-Z0-9._$]+)\3(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*(?:,(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*[a-zA-Z0-9._$]+(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*)*?,(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*function(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\((?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\)(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*{)/g,
        // REG_FAN_CLASS_DEFINED_CODE : /((?:^|[,;\(\){}=]|(?:\*[\/])|(?:\/\/[^\n]*\n))\s*(?:Fan|OOP)\s*\.\s*(Class|class|Interface|interface)\s*\(\s*(['"])([a-zA-Z0-9.]+)\3[^{]+\s*[{])/g,
        
        // 检测包名最后的星号
        REG_CHECK_LAST_STAR : /\.\s*\*$/,

        // 导入js文件时的目录分隔符
        SPEED_CHAR : '/',
        
        // 检测信息输出的前缀
        ERROR : '[ERROR]: ',
        WARN : '[WARN]: ',
        INFO : '[INFO]: ',
        DEBUG : '[DEBUG]: '
    } ),
    
    /**
     * @staticProperty mode 运行模式，默认为operate（工作模式）；develop为开发模式
     */
    mode = 'operate',
    
    /**
     * @staticProperty classPath
     *                 类路径，当引入的类不在Fan根目录下，则可以通过Fan.ClassManager.setClassPath('classpath')进行修改
     *                 或者在引入Fan.js的标签中增加classpath属性指定
     */
    classPath = '',
    
    /**
     * 统计所有使用到的js类文件
     * 
     * 取出所用到的js类文件类表: 
     * 控制台敲(带引号):  ('"/'+Fan.ClassManager.getUsingFileNameList().join('\n').replace(/\./g, '/').replace(/\n/g, '.js",\n"/')+'.js"').replace( /"\/Fan/g, '"/lib/oop/fan_v1.1/src' ).replace( /[\/]+/g, '/' )
     * 控制台敲(不带引号): ('/'+Fan.ClassManager.getUsingFileNameList().join('\n').replace(/\./g, '/').replace(/\n/g, '.js,\n/')+'.js').replace( /(^|[\n])\/Fan/g, '\1/lib/oop/fan_v1.1/src' ).replace( /[\/]+/g, '/' )
     * 
     */
    usingFileNameList = [],
    
    /**
     * 临时存放同一文件中的类文件名
     */
    tempClassName = [],
    
    /**
     * 植入的新代码结构
     */
    newCode = [ '/* [system embedded code] */',
                // 新增关键字,不使用const定义
                'var Super=null,This=null;',
                // 一定要在数组下标2的位置
                // classManager.createDefaultConstructor( constructorMethodName ),
                null,
                'this["' + KEYS.SET_SUPER + '"]=function(s){Super=s;This=s?s["' + KEYS.THIS + '"]:null;};',
                'this["' + KEYS.GET_SUPER + '"]=function(b){return b?Super["' + KEYS.SUPER + '"]:Super;};',
                '/* [system embedded code] */' ],
                
//    /**
//     * 植入的新代码行数, 以便找到错误行
//     */
//    newCodeLineCount = -1,
                
    /**
     * 替换代码的处理函数
     */
    replaceCodeFn = function( v1, v2 , v3, v4, v5, v6,v7,v8 ){
        // console.log(v1 + ','+ v2 + ','+ v3+ ','+ v4+ ','+ v5+ ','+ v6+ ','+v7+ ','+v8);

    	// 类文件名称
        tempClassName.push( v5 );
        
        // 若是接口文件, 则不做处理
        if ( /^(I|i)nterface$/.test( v3 ) ) {
            return v1;
        }
        
        // 构造方法名
        var methodName = Fan.last( (v5 || '').split( '.' ) );
        
        // 创建构造方法
        newCode[ 2 ] = classManager.createDefaultConstructor( methodName );
        
        // 生成新代码
        // var code = v1 + newCode.join( '\n    ' );
        var code = v1 + newCode.join( '' );
        
        // 清理
        newCode[ 2 ] = null;
        
        return code;
    },
    
    // 类管理器
    classManager = {
        setCompiler : function( comp ) {
            if ( window.Compiler && comp instanceof Compiler )
                compiler = comp;
            else if( comp )
                logger.info( '编译器设置不正确, 编译器是 Compiler 类或其派生类' );
        },
        getCompiler : function() {
            if ( compiler )
                return compiler;
            
            if ( window.JavascriptCompiler )
                compiler = new window.JavascriptCompiler();
            else
                // 模拟一个编译器的接口
                compiler = { build : function( code ) { return code; } };
            
            return compiler;
        },
            
        /**
         * 异常对象处理, 便于控制台调试
         * @param errObj - 异常对象
         * 异常对象上扩展的私有属性:
         * _errType - 异常类型
         * _errMsg - 异常信息描述
         * _errClassName - 异常类文件名
         * _errMethodName - 异常的方法名
         * _errLineOffset - 异常代码行数偏移
         * @returns Error
         */
        error : function( errObj ) {
                
            // ==== 利于控制台排查错误 begin ==== //
            if ( window.console ) {
                // 若该异常已被捕获, 则不再处理
                if ( errObj && errObj._isProcessed ) {
                    return errObj;
                }
                
                var
                
                // class home : http://www.fan.com/classes/
                classHome = '/classes/',
                errFileName,
                errLine,
                errMsg,
                errClassName,
                errMethodName,
                errLineOffset;
                
                if ( !(errObj instanceof Error) ) {
                    // 若参数errObj非Error对象, 则无法得知错误行, 仅提示错误文件
                    errFileName = classHome + errClassName + '.class' + (errMethodName ? ' :' + errMethodName : '');
                    logger.error( KEYS.ERROR + errMsg + ', 错误文件: ' + errFileName + ' :未知行数' );
                    return errObj;
                }

                switch( true ) {
                case errObj._errType === ErrorTypes.RuntimeError :
                    errMsg = '运行时异常';
                    break;
                case errObj._errType === ErrorTypes.InvalidCallingError :
                    errMsg = '非法的调用';
                    break;
                case errObj._errType === ErrorTypes.InvalidCallingEvalError :
                    errMsg = '非法调用Fan.gEval(..)异常';
                    break;     
                case errObj._errType === ErrorTypes.InvokeError :
                    errMsg = '方法调用异常';
                    break;
                case errObj._errType === ErrorTypes.ClassInitError :
                    errMsg = '类初始化异常';
                    break;
                case errObj._errType === ErrorTypes.ClassFileParseError :
                    errMsg = '类文件解析异常';
                    break;
                case errObj._errType === ErrorTypes.ClassFileNotFindError :
                    errMsg = '找不到类文件异常';
                    errObj.lineNumber = -1;
                    break;
                case errObj instanceof SyntaxError : 
                    errMsg = '语法错误';
                    break;
                case errObj instanceof ReferenceError : 
                    errMsg = '引用错误';
                    break;
                case errObj instanceof TypeError : 
                    errMsg = '类型错误';
                    break;
                case errObj instanceof EvalError : 
                    errMsg = '非法调用eval';
                    break;
                default : errMsg = '文件出错';
                    break;
                }
                
                errMsg += ': ' + errObj.message;
                
                errClassName  = errObj._errClassName;
                errMethodName = errObj._errMethodName;
                errLineOffset = errObj._errLineOffset >> 0;

                var errStack = errObj.stack + '';
                
                // chrome 获取错误行
                if ( Fan.chrome ) {
                    // 仅限通过eval时的查找异常位置
                    // at eval (classes/Fan.ui.controller.NavigationViewController.class:10:11)
                    
                    var ms = errStack.match( /at [^\n]+?(?:\/classes\/([^\n]+?)\.class)?:(\d+)(:\d+)?[^\d]*\n/ ) || [];
                    errClassName = errClassName || ms[ 1 ];
                    errLine = ms[ 2 ] >> 0;
                    
                } else if ( Fan.firefox ) {
                    // firefox 获取错误行
                    getEvalRowNumber();
                    if ( checkLineErrObj.fileName == errObj.fileName ) {
                        // 文件名相同, 表示通过Fan.js文件中的gEval方式执行的代码, 故而需要减去eval的代码所在行
                        errLine = (errObj.lineNumber >> 0) - getEvalRowNumber() - (errLineOffset >> 0);
                        errLine = Math.abs( errLine ) + 1;
                    } else {
                        errLine = errObj.lineNumber >> 0;
                        if ( errLine > 0 )
                            errLine += 1;
                        else {
                            var ms = errStack.match( /:(\d+)\n/ );
                            errLine = ms[ 1 ] >> 0;
                        }
                    }
                } else {
                    // other
                    errLine = (errObj.lineNumber >> 0) - getEvalRowNumber() - (errLineOffset >> 0);
                    errLine = Math.abs( errLine ) + 1;
                }
                
                errMethodName = (errMethodName ? ' :' + (errMethodName.indexOf( ')' ) > 0 ? errMethodName : errMethodName + '(..)') : '');
                errFileName = errObj._errFileName || (errClassName ? classHome + errClassName + '.class' : '未知文件') + errMethodName;
                
                // 打出错误文件及错误行
                logger.error( KEYS.ERROR + errMsg + ', 错误文件: ' + errFileName + ' :' + errLine );
                
                // 重写异常信息
//                errObj.lineNumber = errLine;
//                errObj.fileName = errFileName;
                
                errObj._errMsg = errMsg;
                errObj._errLine = errLine;
                errObj._errFileName = errFileName;
                errObj._errClassName = errClassName;
                
                // 打上标识,表示该异常已被捕获并处理,避免重复处理
                errObj._isProcessed = 1;
            }
            // ==== 利于控制台排查错误 end ==== //
            return errObj;
        },
            
        /**
         * 获取所有js类文名称件列表
         */
        getUsingFileNameList : function() {
            return usingFileNameList;
        },
        
        /**
         * 载入预加载文件, 该文件符合一定规范
         */
        preLoadFile : function( fileUrl, async, callback ) {
            async = !(async === false);
            loader.loadFile( fileUrl, function( code ) {
                // 文件路径处理, 'res/lib/fan_v1.2/' -> 'res.lib.fan_v1.2.'
//                var root = Fan.root.replace( /\/+/g, '.' ).replace( /^\.+|\.+$/g, '' ) + '.';
//                var path = Fan.ClassManager.getClassPath().replace( /\/+/g, '.' ).replace( /^\.+|\.+$/g, '' ) + '.';
//                code.replace( root, '' );
                
                if ( async ) {
                    setTimeout( function() {
                        classManager.parseClass( code );
                    }, 0 );
                } else
                    classManager.parseClass( code );
                Fan.call( callback );
                callback = code = fileUrl = async = null;
            }, null, {
                headers : {
                    'Accept' : 'text/javascript'
                },
                async : async
            } );
        },
        
        /**
         * @staticMethod parseClass(classFile) 解析类文件代码，植入Fan部分代码
         * @param classFile - 代码文件
         */
        parseClass : function( classFile ) {
            // 清空同一文件中的类名列表
            tempClassName = [];
            
            // 抓取Fan.Class定义的类代码, 并植入新代码
            classFile = (classFile || '').replace( 
                KEYS.REG_FAN_CLASS_DEFINED_CODE,
                replaceCodeFn
            );
            
            // 取出类名, 同文件内多个类, 用$符号连接
            var className = 'classes/' + tempClassName.join( '&' );
            
            // 多个类文件名时, 截取到最长长度
            if ( tempClassName.length > 1 ) {
                className = className.length > 80 ? className.substring( 0, 80 ) + '..' : className;
            }
            
            className += '.class';
            
            // 语法排查正则, 以便在调试时能快速定位
            var regs = [ 
                // 检测逗号后面的大括号和中括号, 正则除外:/,],}/
                /,\s*[\}\]]/
            ];
            Fan.each( regs, function( i ) {
                classFile.replace( regs[ i ], function( v1, idx ) {
                    var tmp = classFile.substring( 0, idx );
                    tmp = tmp.split( /\n/ );
                    var reg = Fan.last( tmp ) + Fan.first( classFile.substring( idx ).split( /\n/ ) );
                    var m = reg.match( /\/[\s\S]+\// );
                    var isReg = m && m[ 0 ].match( /,\s*[\}\]]/ );
                    // alert( '正则表达式:' + reg + ', ' + !!isReg );
                    if ( !isReg )
                        logger.warn( '[不规范语法文件]:' + className + ':' + tmp.length );
                } );
            } );
                
            // 尝试执行js文件
            Fan.gEval( classFile, className );
        },
        
        /**
         * @staticMethod init(callback) 初始化classManager模块 callback - 初始化后的回调函数
         */
        init : function( initCallback ) {
            // 特殊标志
            Fan[ KEYS.IS_PACKAGE ] = true;
            
            // 初始化时,记录新插入的行数
            // newCodeLineCount = -1;//newCode.length;
            
            // 重写toString方法,以便输出文件列表
            Fan.apply( usingFileNameList, {
                toString : function() {

                    var files = [];
                    Fan.each ( this, function() {
                        var path = this.replace( /\./g, '/' );
                        if ( /^Fan\//.test( path ) )
                            files.push( path.replace( /^Fan\//, Fan.root + 'src/' ) );
                        else
                            files.push( Fan.ClassManager.getClassPath() + '/' + path );
                    } );
                    
                    return  ('"/' + files.join( '\n' ).replace( /\n/g, '.js",\n"/' ) + '.js"').replace( /[\/]+/g, '/' );
                
                    //return ('"/' + this.join( '\n' ).replace( /\./g, '/' ).replace( /\n/g, '.js",\n"/' ) + '.js"').replace( /"\/Fan/g, '"/' + Fan.root + 'src' ).replace( /[\/]+/g, '/' );
                }
            });

            // 取出所有script标签
            var scripts = document.getElementsByTagName( 'script' );

            /**
             * @privateProperty classpath 类的加载路径，当类不在Fan根目录下，则需要配置该项
             *                  可通过Fan.setClassPath(classpath)设置，或者在script标签中加入classpath='/xxx/xxx/'指定类路径
             */
            Fan.each( scripts, function( i ) {
                if ( /\bFan(-min)?\.js\s*$/.test( this.src ) ) {
                    classManager.setClassPath( Fan.trim( (this.getAttribute( 'classpath' ) || '') ) );
                    classManager.setMode( Fan.trim( this.getAttribute( 'mode' ) ) );
                    this.setAttribute( 'classpath',  classManager.getClassPath() );
                    this.setAttribute( 'mode',  classManager.getMode() );
                    return true;
                }
            } );

            // 消除内部变量 
            scripts = null;
            Fan.call( initCallback );
        },

        /**
         * @staticMethod setClassPath(String classPath)
         *               设置类路径，当Import的类包不在Fan根目录下，则需要设置类路径放能正确找到类
         */
        setClassPath : function( path ) {
            classPath = path;
        },

        /**
         * @staticMethod getClassPath() 获取类路径
         */
        getClassPath : function() {
            return classPath || Fan.root;
        },

        /**
         * @staticMethod setMode(String mode) 设置运行模式，仅当参数 mode 为 'develop'
         *               时才为开发模式， 所有非 'develop' 的模式均为 'operate' （工作模式）
         */
        setMode : function( _mode ) {
            mode = /^develop$/i.test( _mode ) ? 'develop' : 'operate';
        },

        /**
         * @staticMethod getMode() 获取运行模式
         */
        getMode : function() {
            return mode;
        },

        /**
         * @staticMethod applyPrototype(clazz, propertys, isOverried)
         *               专门给clazz增加或覆盖prototype
         * 
         * @param clazz -
         *            需要修改prototype的类或接口
         * @param propertys -
         *            属性对象
         * @param isOverried -
         *            是否完全覆盖
         * @returns {Function} - 返回clazz，当clazz不存在则主动构建一个并返回
         */
        applyPrototype : function( clazz, propertys, isOverried ) {
            clazz = clazz || Fan.newFunction();
            if ( isOverried )
                Fan.apply( clazz, {
                    prototype : propertys
                } );
            else
                Fan.apply( clazz.prototype, propertys );
            return clazz;
        },
        
        /**
         * @staticMethod createDefaultConstructor(String methodName) 创建默认构造函数
         */
        createDefaultConstructor : function( methodName ) {
            return 'this.' + methodName + '=this.' + methodName + '||function(){Super();};';
        },

        /**
         * 临时导入的列表，用于确定一组依赖关系
         */
        tmpList : [],

        /**
         * @staticMethod Import( String packageName,
         *                  String/Boolean packagePrefixChar,
         *                  Function callbeck,
         *                  Boolean async )
         *               导入需要依赖的类文件
         * 
         * 单个： Import('Fan.util.Map');
         * 多个以逗号区分或者数组方式:
         * Import('Fan.util.Map,Fan.net.Ajax');
         * Import(['Fan.util.Map', 'Fan.net.Ajax']);
         * 
         * TODO :
         * 当在多个script标签脚本中执行Fan.Import导入相同的文件时,存在异步问题,应尽量避免多个script同时导入相同的依赖文件
         * 
         * <pre>
         * 1、className - 类全名，命名空间结构名称（包名 + 类名）
         * 2、prefixCharOrPublic - 
         *         (1)名称前缀，当命名存在冲突时，可用指定增加前缀，给包中成员加上前缀, 默认不加前缀 如:
         *            公布Ajax为全局时，而Ajax名称已经被占用，则可以追加前缀 Import('Fan.net.Ajax', '$');
         *            var request = new $Ajax();
         *         (2)也可传递true和false，取值true时，公开包中所有成员，且不加前缀； 默认false，只引入完整命名空间结构，仍然需要用完整命名空间路
         *            径访问：Fan.net.Ajax.request
         * 3、callbeck - 在加载完成后，调用回调
         * 4、async - 是否异步导入，默认fasle
         * </pre>
         */
        Import : function( className, prefixCharOrPublic, callbeck, async ) {
            var names, isPublic, prefixChar;

            // 取出包名，包名可能多个，以数组形式存于names中
            switch ( Fan.type( className ) ) {
            case 'string' :
                names = Fan.trimAll( className ).split( ',' );
                if ( names.length === 1 && innerSpace[ names[ 0 ] ] ) {
                    // logger.info( '已存在类:' + names[ 0 ] );
                    return;
                }
                break;
            case 'array' :
                names = className;
                break;
            default :
                return;
            }

            // 不存在包名，直接退出
            if ( !names || names.length == 0 )
                return false;

            // 是否公开，取出前缀
            isPublic = prefixCharOrPublic === true || (typeof prefixCharOrPublic == 'string' && /\S+/.test( prefixCharOrPublic ));
            if ( isPublic )
                prefixChar = prefixCharOrPublic === true ? '' : Fan.trim( prefixCharOrPublic );
            else
                prefixChar = '';

            // 执行导入，处理多个包:'Fan.util.Map, Fan.net.Ajax'
            for ( var i = 0, len = names.length; i < len; ++i ) {
                classManager.doImport( names[ i ], isPublic, prefixChar, callbeck, async );
            }
        },

        // 存放预加载生成类文件的函数集合
        classesMap : {},
        
        /**
         * 执行导入
         * @private
         */
        doImport : function( className, isPublic, prefixChar, callbeck, async ) {

            // 'Fan.xxx.Class1'
            className = Fan.trimAll( className );

            // 加入到临时导入的列表中，被多次连续调用Import导入类文件时，确定一组依赖
            classManager.tmpList.push( className );

            // 防止重复加载，判断其是否已经载入
            if ( innerSpace[ className ] ) {
                // logger.info( '类已存在:' + className );
                return true;
            }
            
            // 当存在预加载的文件, 则从预加载的文件中取类文件代码的包装函数, 该包装函数由服务器端打包时对每个类的代码进行包装
            var rt = Fan.root.replace( /\/+/g, '.' ).replace( /^\.+|\.+$/g, '' );
            rt = rt ? rt + '.' : '';
            var cp = classManager.getClassPath().replace( /\/+/g, '.' ).replace( /^\.+|\.+$/g, '' );
            cp = cp ? cp + '.' : '';
            var tmpFileName = /^(?:Fan|OOP)\./.test( className ) ? rt + className.replace( /^(?:Fan|OOP)\./, 'src.' ) : cp + className;
            var codeWrapFn = classManager.classesMap[ tmpFileName ];
            if ( Fan.isFunction( codeWrapFn ) ) {
                // 若能取到, 则执行, 且执行完毕后, 从预加载文件列表中清除
                logger.info( '[加载类文件] - form 预加载: ' + className );
                classManager.classesMap[ tmpFileName ] = null;
                // 执行包装函数,载入类,并传入主函数对象给包装函数(Fan,OOP)
                codeWrapFn( Fan, Fan );
                delete classManager.classesMap[ tmpFileName ];
                return;
            }
            
            // 防止重复加载，判断其是否正在加载
            if ( this.hasLoadingFile( className ) ) {
                // logger.info( '类正在载入中:' + className );
                // this.removeLoadingFile( className );
                // 当以不同的script元素执行Fan.Import导入class的时候,存在异步问题,应尽量避免多个script同时导入依赖文件
                return true;
            }
            
            // --- 统计加载的所有资源文件 --- begin --- //
            usingFileNameList.push( className );
            // --- 统计加载的所有资源文件 ---- end ---- //

            // 列入到正在加载的列表中
            this.addLoadingFile( className );

            // 根据包路径取出相应的对象
            logger.debug( '[正在载入] ' + className );

            try {
                // 远程加载类文件并载入
                loader.loadClass( className, function() {
                    // this -> xhr
                    // 检测类文件是否载入正常
                    if ( null == innerSpace[ className ] ) {
                        // 报警告，类文件尚未载入
                        logger.warn( '[警告] 类文件 "' + className + '" 并未载入' );
    
                        // 是否在全局对象window中公开
                        if ( isPublic ) {
                            // 公共类名
                            var publicClassName = prefixChar + Fan.trim( className.substring( className.lastIndexOf( '.' ) + 1 ) );
    
                            // 异步操作时， 监听类文件载入事件
                            var eventId = Fan.on( className, function( evtType ) {
                                Fan.un( evtType, eventId );
                                !window[ publicClassName ] && (window[ publicClassName ] = innerSpace[ evtType ]);
                                publicClassName = eventId = null;
                            } );
                        }
                    } else if ( isPublic ) {
                        var publicClassName = prefixChar + Fan.trim( className.substring( className.lastIndexOf( '.' ) + 1 ) );
                        !window[ publicClassName ] && (window[ publicClassName ] = innerSpace[ className ]);
                    }
                }, function() {
                    // this -> xhr
                    if ( 404 == this.status ) {
                        var e = new Error( KEYS.ERROR + '找不到类文件错误: ' + className );
                        e._errType = ErrorTypes.ClassFileNotFindError;
                        e._errClassName = className;
                        e._errMethodName = '';
                        throw e;
                    } else
                        throw new Error( KEYS.ERROR + '类文件加载错误: ' + className );
                }, function( e ) {
                    // this -> xhr
                    logger.error( KEYS.ERROR + '[严重] 类 "' + className + '" 载入错误' );
                    throw e;
                }, async );
            } catch ( e ) {
                // 从正在加载的名单中移出
                this.removeLoadingFile( className );

                e._errClassName = className;
                Fan.ClassManager.error( e );
                
                throw e;
            }
        },

        /**
         * @staticMethod deferImport(String className, String/Boolean
         *               prefixCharOrPublic, Function callbeck) 异步导入命名空间包,
         *               用法与Import一致，多个异步导入过程中会按照优先顺序导入
         * 
         * <pre>
         * 1、className - 命名空间结构名称（包名）
         * 2、prefixCharOrPublic - 
         *         (1)名称前缀，当命名存在冲突时，可用指定增加前缀，给包中成员加上前缀, 默认不加前缀 如:
         *            公布Ajax为全局时，而Ajax名称已经被占用，则可以追加前缀 Import('Fan.net.Ajax', '$');
         *            var request = new $Ajax();
         *         (2)也可传递true和false，取值true时，公开包中所有成员，且不加前缀； 默认false，只引入完整命名空间结构，仍然需要用完整命名空间路
         *            径访问：Fan.net.Ajax.request
         * 3、callbeck - 在加载完成后，调用回调
         * </pre>
         */
        deferImport : function( className, prefixCharOrPublic, callbeck ) {
            setTimeout( function() {
                classManager.Import( className, prefixCharOrPublic, callbeck, true );
            }, 0 );
        },

        /**
         * @staticMethod Package(String packageName, Boolean isPrivatePackage)
         *               创建 "命名空间结构"，所有的命名空间结构，会自动创建，由function作为载体。
         *               命名空间且具有一个特殊的属性：IS_PACKAGE 为 true。
         *               判断一个function是否是命名空间结构，使用Fan.isPackage(package)
         * 
         * <pre>
         * 1、packageName - 包名，当创建的命名空间结构已经存在，则使用已存在的空间
         * 2、isPrivatePackage - 是否为私有包，即不可直接访问
         * 
         * 命名空间结构对象具有的特殊属性与方法
         * @attribute {boolean} IS_PACKAGE 为 true
         * 
         * @attribute {String} packageName 命名空间的目录结构名
         * 
         * @attribute {Srting} parentPackageName 父级命名空间结构名
         * 
         * @attribute {String} currentPackageName 当前命名空间的节点名
         * 
         * @method enable() 启用该命名空间结构
         * 
         * @method disable() 停用该命名空间结构
         * 
         * @method isEnable() 是否已经启用
         * 
         * @method isPrivatePackage() 是否是隐私包，默认false，当取值为true时通过Fan.Import引入时不会将包中成员公开
         * </pre>
         */
        Package : function( packageName, isPrivatePackage ) {
            if ( !packageName || typeof packageName != 'string' ) {
                return null;                
            }
            
            packageName = packageName.replace( /\s+/g, '' );
            if ( innerSpace[ packageName ] ) {
                // logger.info( '已存在包:' + packageName );
                return innerSpace[ packageName ];
            }

            // 拆分,names
            var ns = packageName.split( '.' );

            // 临时存放,tmpPackages
            var tps = [];
            
            // 检测命名空间是否存在，不存在时创建新的命名空间结构
            for ( var i = 0, l = ns.length, ans = [], pk; i < l; ++i ) {
                pk = Fan.trim( ns[ i ] );
                if ( !pk ) {
                    throw new Error( KEYS.ERROR + 'package name error "' + packageName + '"' );
                }
                
                ans.push( pk );

                // 检测，创建新的命名空间并返回。
                var tp = classManager.checkPackage( ans.join( '.' ) );

                // 当存在创建失败时，视为命名空间冲突，直接抛出异常
                if ( !Fan.isPackage( tp ) ) {
                    tps = ns = null;
                    throw new Error( KEYS.ERROR + 'the package name conflict "' + ans.join( '.' ) + '"' );
                }
                tps.push( tp );
            }

            // 若能执行到此，表示成功创建命名空间，则将临时命名空间结构引用
            // var rt = tps[ 0 ];
            for ( var i = 0, l = tps.length; i < l; ++i ) {
                // 从根到叶，一层层启用
                tps[ i ].enable();
            }
            
            if ( isPrivatePackage ) {
                var n = tps[ tps.length - 1 ];
                n[ KEYS.IS_PRIVATE_PACKAGE ] = true;
            }

            // 清空列表，从新开始计算
            classManager.tmpList = [];
            
            return tps[ tps.length - 1 ];
        },

        /**
         * @staticMethod checkPackage(String packageName)
         *               检查命名空间结构是否已经存在或存在名称占用冲突，并尝试返回一个尚未启用的新的命名空间结构对象
         * 
         * <pre>
         * 1、packageName - 命名空间完整名称
         * </pre>
         * 
         * @return {Function}
         *         尝试返回一个Function对象，package包结构的原型由函数搭建，因此返回的类型是Function
         */
        checkPackage : function( packageName ) {
            var n = innerSpace[ packageName ];
            
            // 判断命名空间是否已存在
            if ( n ) {
                if ( Fan.isPackage( n ) ) {
                    // 命名空间存在，直接返回可用的命名空间对象
                    return n;
                } else {
                    // 命名空间名称被 类名或者接口名占用
                    return null;
                }
            } else {
                // 父级命名空间结构
                var ppn = Fan.trim( packageName.replace( /\.\s*[^.]+$/i, '' ) );

                // 当前命名空间结构
                var cpn = packageName.split( '.' );
                cpn = cpn[ cpn.length - 1 ];

                n = Fan.newFunction( {
                    // 父级目录结构名称
                    parentPackageName : ppn,

                    // 当前一个节点的名称
                    currentPackageName : cpn,

                    // 完整目录名称
                    packageName : packageName,

                    toString : function() {
                        return '[package ' + packageName + ']';
                    }
                } );

                // 启用命名空间结构
                n.enable = Fan.proxy( function() {
                    // 若已经启用，直接返回
                    if ( innerSpace[ this.packageName ] ) {
                        return;
                    }

                    innerSpace[ this.packageName ] = this;

                    // 关联当前命名空间节点的父级结构
                    // 取得父级结构
                    var pp = innerSpace[ this.parentPackageName ];

                    // 当命名空间完整路径和当前命名空间结构一致，为单个目录节点的情况，则无需关联父级，子父目录路径不相等时才关联
                    if ( this.packageName != this.currentPackageName && Fan.isPackage( pp ) ) {
                        // 进行关联父级
                        pp[ this.currentPackageName ] = this;
                    } else if ( this.packageName == this.currentPackageName ) {
                        // 根路径的包, 暴露到window下
                        if ( window[ this.currentPackageName ] && !Fan.isPackage( window[ this.currentPackageName ] ) ) {
                            throw new Error( KEYS.ERROR + 'the package name conflict "' + this.currentPackageName + '"' );
                        }
                        window[ this.currentPackageName ] = this;
                    } else {
                        // 父级目录无效时，则不做处理
                        // 原因：
                        // 尚未启用
                        // 找不到父级结构，父级命名空间名称已经被其他使用
                    }
                }, n );

                // 停用，废弃命名空间结构
                n.disable = Fan.proxy( function() {
                    innerSpace[ this.packageName ] = undefined;
                    var pp = innerSpace[ this.parentPackageName ];
                    if ( Fan.isPackage( pp ) ) {
                        // 断开关联
                        pp[ this.currentPackageName ] = undefined;
                        delete pp[ this.currentPackageName ];
                    }
                    return this;
                }, n );

                // 返回当前命名空间结构是否已经启用
                n.isEnable = Fan.proxy( function() {
                    var pp = innerSpace[ this.parentPackageName ];
                    var flag = false;
                    if ( Fan.isPackage( pp ) ) {
                        // 判断当前节点是否隶属于父级节点
                        if ( this == pp[ this.currentPackageName ] ) {
                            flag = true;
                        }
                    }
                    return !!innerSpace[ this.packageName ] && flag;
                }, n );

                // 特殊属性标志
                n[ KEYS.IS_PACKAGE ] = true;

                return n;
            }
        },

        /**
         * @staticMethod interfaceExtend(Interface subInterface, Interface/Array
         *               superInterfaces) 接口继承
         * 
         * <pre>
         * 1、subInterface - 子接口
         * 2、superInterfaces - 父接口或父接口集合
         * </pre>
         * 
         * @return 返回子接口
         */
        interfaceExtend : function( subInterface, superInterfaces ) {
            if ( !Fan.isArray( superInterfaces ) ) {
                superInterfaces = [ superInterfaces ];
            }
            var o = {}, it;
            for ( var i = 0, l = superInterfaces.length; i < l; ++i ) {
                it = superInterfaces[ i ];
                if ( Fan.isInterface( it ) ) {
                    it.call( o );
                }
            }
            Fan.apply( subInterface.prototype, o );
            return subInterface;
        },

        /**
         * @staticMethod Extends(Class subClass, Class superClass, Object overriders)
         *  类继承，或者接口的多重继承。 实例鉴别instanceof 父类、父父类...，均为true
         * 
         * <pre>
         * 1、subClass - 子类
         * 2、superClass - 父类
         * 3、overriders - 重写父类成员
         * </pre>
         * 
         * @return 返回子类
         */
        Extends : function( subClass, superClass, overriders ) {
            
            // 判断第一参数是否是接口对象，是则调用接口间继承
            if ( Fan.isInterface( subClass ) )
                return classManager.interfaceExtend( subClass, superClass );
            
            // 否则判断是否是普通对象（非Class，非Object），是则视为属性追加，调用Fan.apply方法进行追加属性
            else if ( !Fan.isClass( subClass ) && subClass !== Object ) {
                return Fan.apply( subClass, superClass );
            }

            /**
             *   // -- 继承实现的原型 -- begin --
             *   // cp -- clsProxy, c -- cls
             *   var cp = sbc, c = cp[KEYS.FAN_CLAZZ_BODY];
             *   var spp = spc === Object ? spc.prototype : spc[KEYS.FAN_CLAZZ_BODY].prototype;
             *   
             *   var f = function(){};
             *   f.prototype = spp;
             *   
             *   // 覆盖前保存
             *   var gc = c.prototype.getClass;
             *   
             *   cp.prototype = c.prototype = new f();
             *   
             *   // 覆盖后还原
             *   c.prototype.getClass = gc;
             *   // -- 继承实现的原型 -- end --
             */
            
            // step 0: 准备好: 类的包装(classProxy), 类的主体(clazz, 类主体的引用存于类包装的KYES.CLASS_BODY属性中)
            var classProxy = subClass, clazz = classProxy[ KEYS.CLAZZ_BODY ];
            
            // step 1: 取得父类原型
            var spp = superClass === Object ? superClass.prototype : superClass[ KEYS.CLAZZ_BODY ].prototype;
            
            // step 2: 创建一个新的function对象,并将原型对象覆盖新的function.prototype
            var f = classManager.applyPrototype( null, spp, true );

            // step 3: 覆盖前保存原型链中的getClass函数
            var getClass = clazz.prototype.getClass;

            // step 4: 以拥有父类原型的function创建新的原型对象
            var propertys = new f();

            // step 5:
            // 再把新的原型对象完全覆盖子类function.prototype属性
            // Fan的类主function和包装function共享同一个父类原型对象
            // 使得new出来的对象,能够通过类型鉴别关键字"instanceof"的校验
            classManager.applyPrototype( classProxy, propertys, true );
            classManager.applyPrototype( clazz, propertys, true );

            // step 6: 覆盖后还原之前的getClass函数
            classManager.applyPrototype( clazz, {
                getClass : getClass
            } );

            // 如果有重写的属性,则覆盖到新的类原型中
            typeof overriders == 'object' && Fan.apply( clazz.prototype, overriders );

            // step 7: 设置构造器属性指向包装类
            classManager.applyPrototype( classProxy, {
                constructor : classProxy
            } );

            // step 8: 增加superclass属性,指向父类包装类
            classProxy.superclass = superClass;

            return classProxy;
        },

        /**
         * @staticMethod Super()
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
         *  字，该变量在js类文件通过eval函数解析执行时插入到Fan类定义中，使得Super成为一个私有变量，而能够直接被其
         *  
         *  他类定义中的函数访问到，并把js文件编译成后缀为class的类文件。
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
         *  法名“show”，并向逐层向父类中查找“show”方法，未找到则报出异常，之所以能找到方法名，是Super在第一生命周期
         *  
         *  内，对子类中重写了父类方法的函数，增加了一个隐式的名字）。
         *  
         *  4、Super的销毁
         *  
         *      Super在对象创建和消费时，都是起“关键字”的作用，销毁Super则是随对象销毁时而销毁，或主动调用继承
         *      
         *  自基类Fan.Object中定义的destroy方法释放对象，亦或调用隐式函数（setSuper）将其设置为null。
         *  
         */
        Super : function() {
            var _this = this,
                tmpObj = this;
            
            // 特殊传递的参数
            if ( tmpObj[ KEYS.THIS ] )
                _this = tmpObj[ KEYS.SUPER ];
            else {
                // 首次进来tmpObj为普通对象，不带有KEYS.THIS属性
                // 为了让Super能跨父子类中上下嵌套调用
                // 保存实例对象的传递，使得Super的this永远指向实例对象
                tmpObj = {};
                tmpObj[ KEYS.THIS ] = _this;
            }
            
            // subObject : 首次构造的时候,指向真实this, 递归构造中,指向直系子类对象
            var subObject = _this,
                subClass = subObject.getClass(),
                superClass = subClass.superclass,
            
                // 真实this对象
                me = tmpObj[ KEYS.THIS ];
            
            // 当父类为Object时
            if ( superClass === Object ) {
                tmpObj = {};
                // 必需方法
                tmpObj[ 'getClass' ] = objectClassFunction;
                tmpObj[ KEYS.GET_SUPER ] = Fan.noop;
                tmpObj[ KEYS.SET_SUPER ] = Fan.noop;
                
                subObject[ KEYS.SET_SUPER ]( tmpObj );
                
                // 给所有的方法加上方法名, 以便多态调用时找到对应的方法
                var tmp_m;
                for ( var k in subObject ) {
                    switch ( true ) {
                    case undefined == k :
                    case 'constructor' == k :
                    case 'getClass' == k :
                    case KEYS.SET_SUPER == k :
                    case KEYS.GET_SUPER == k :
                        break;
                    default :
                        tmp_m = subObject[ k ];
                        if ( Fan.isFunction( tmp_m ) && tmp_m[ KEYS.METHOD_NAME ] != k )
                            tmp_m[ KEYS.METHOD_NAME ] = k;
                        break;
                    }
                }
                
                me = _this = tmpObj = subClass = subObject = superClass = tmp_m = null;
                return;
            }

            // new 父类对象，需要传递变长参数列表，new class_body，并手动调用构造方法
            var superObject = new superClass[ KEYS.CLAZZ_BODY ]();
            tmpObj[ KEYS.SUPER ] = superObject;
            
            // 判断是否支持Super设置, 若缺少自动植入的代码则抛出异常
            if ( !Fan.isFunction( superObject[ KEYS.SET_SUPER ] ) )
                throw new Error( KEYS.ERROR + '"' + superObject.getClass().className + '" does not support "Super".' );
            
            // Super:第一生命周期, 创建一个父类构造方法
            var superProxy = Fan.proxy( classManager.Super, tmpObj );
            superObject[ KEYS.SET_SUPER ]( superProxy );

            // 截取类的简短名称，作为构造方法名称
            var n = Fan.fn.last( superClass.className.split( '.' ) ),
                superConstructor = superObject[ n ];
            
            if ( Fan.isFunction( superConstructor ) ) {
                // 移除构造方法
                delete superObject[ n ];
            } else {
                // 没有构造函数
                throw new Error( KEYS.ERROR + '"' + superClass.className + '" has not constructor.' );
            }

            var
            // 临时变量
            method,
            member,
            
            // 更改Super关键的指向
            _super = [ function() {
                // 调用者
                var __super = arguments.callee;
                var method = arguments.callee.caller;
                var methodName = method[ KEYS.METHOD_NAME ];

                // 逐级向父类检索同名方法
                var sp = __super, tmpSp = __super;

                while ( sp ){
                    
                    // 取出真实super
                    sp = sp[ KEYS.SUPER ];
                    
                    // 从代理super上取得同名方法,通过代理方法调用父类方法,实现this永远指向子类对象
                    method = sp[ methodName ];
                    
                    // 该方法需要在父类中明确定义
                    // 因为原型链中的方法属于多实例共享方法, 其方法内部不能使用Super()
                    // 因此过滤掉原型链中继承的方法, 当sp为顶级父类Fan.Object除外
                    if ( method && (sp.hasOwnProperty( methodName ) || sp.getClass() === Fan.Object ) ) {
                        if ( methodName == method[ KEYS.METHOD_NAME ] ) {
                            try {
                                return method.apply( __super[ KEYS.THIS ], arguments );
                            } catch ( e ) {
                                // 捕获实例方法中调用父类方法时的异常
                                e._errType = ErrorTypes.InvokeError;
                                e._errClassName = sp.getClass().className;
                                e._errMethodName = methodName;
                                
                                classManager.error( e );
                                
                                throw e;
                            } finally {
                                tmpSp = sp = null;
                            }
                        } else if ( null == method[ KEYS.METHOD_NAME ] ) {
                            logger.warn( '[检测异常] - has not method name in "' + sp.getClass().className + '.' + methodName + '".' );
                        }
                    }
                    
                    // 在父类对象中取到获取Super的方法
                    if ( !(sp = sp[ KEYS.GET_SUPER ]) ) {
                        break;
                    }
                    
                    // 调用获取Super的方法取得Super
                    sp = sp();
                };

                // 未找到,则抛出异常
                var className = tmpSp.getClass().className;
                tmpSp = null;
                throw new Error( KEYS.ERROR + '[检测异常] - 类 "' + className + '" 中找不到方法:"' + methodName + '"' );
            } ][ 0 ];
            
            // 父类成员追加到子类对象上
            for ( var k in superObject ) {
                switch ( true ) {
                
                // 过滤不必追加到子类对象上的成员
                case undefined == k :
                case 'constructor' == k :
                    break;
                
                case 'getClass' == k :
                case KEYS.SET_SUPER == k :
                case KEYS.GET_SUPER == k :
                    // 重写toString方法，屏蔽细节
                    Fan.isFunction( me[ k ] ) && (me[ k ].toString = nativeFunction);
                
                    // Super中不需要用到this的方法，则无需代理, 直接把原方法赋给super代理对象
                    _super[ k ] = superObject[ k ];
                    break;
                    
                default :
                    // 取出superObject对象中的成员
                    member = superObject[ k ];
                
                    // 方法覆盖
                    if ( Fan.isFunction( member ) ) {
                        
                        // 为Super代理每一个可能用到this的方法，通过代理更改this指向
                        var tmpM = Fan.proxy( member, me );
                        
                        // 每个被代理的方法都加上名字
                        tmpM[ KEYS.METHOD_NAME ] = k;
                        _super[ k ] = tmpM;
                        tmpM = null;
                        
                        // -- 真实this
                        // 在子类对象中取得同名方法，则为override的方法
                        method = me[ k ];
                        
                        // 覆盖条件：在父类中明确定义的方法, 且必须是未实现的方法或者子类中未明确定义的方法
                        superObject.hasOwnProperty( k ) && (classManager.isUnimplement( method ) || !me.hasOwnProperty( k )) && (me[ k ] = member);
                    } else if ( undefined === me[ k ] ) {

                        // 属性覆盖子类中未声明的属性，即：值为undefined的属性
                        me[ k ] = member;
                        
                        // Super属性追加
                        _super[ k ] = member;
                    } else {
                        // Super属性追加
                        _super[ k ] = member;
                    }
                    break;
                }
            }
            method = member = null;
            
            // 给所有的方法加上方法名, 以便多态调用时找到对应的方法
            for ( var k in subObject ) {
                switch ( true ) {
                case undefined == k :
                case 'constructor' == k :
                case 'getClass' == k :
                case KEYS.SET_SUPER == k :
                case KEYS.GET_SUPER == k :
                    break;
                default :
                    method = subObject[ k ];
                    if ( Fan.isFunction( method ) && method[ KEYS.METHOD_NAME ] != k )
                            method[ KEYS.METHOD_NAME ] = k;
                    break;
                }
            }
            method = member = null;
            
            // 给代理super绑定真实this和super对象
            _super[ KEYS.THIS ] = tmpObj[ KEYS.THIS ];
            _super[ KEYS.SUPER ] = superObject;
            
            // 覆盖代理super的toString和constructor成员
            _super.toString = Fan.newClosure( superObject.toString() );
            _super.constructor = superObject.constructor;
            
            // 设置到子类对象中
            subObject[ KEYS.SET_SUPER ]( _super );
            
            // 父类属性覆盖到子类对象上之后, 以真实实例, 调用父类构造方法
            if ( Fan.isFunction( superConstructor ) ) {
                superConstructor.apply( me, arguments );
                
                // 检测是否调用过Super()
                if ( superObject[ KEYS.GET_SUPER ]() === superProxy ) {
                    if ( superObject.getClass() !== Fan.Object )
                        throw new Error( KEYS.ERROR + '[检测异常] - 类 "' + superObject.getClass().className + '" 构造方法中，缺少Super(...)调用。' );
                }
            }

            me = superProxy = superConstructor = superClass = subClass = subObject = n = tmpObj = _this = null;
            _super = null;

            return superObject;
        },
        
        /**
         * 对象销毁
         */
        destroyObject : function( fanObj ) {
            var curr = fanObj, superObj, tmpSuper, msg = [];
            // logger.warn( '[destroyObject] - begin' );
            while ( curr instanceof Object && !Fan.isFunction( curr ) && curr[ KEYS.GET_SUPER ] ) {
                msg.push( curr.getClass().className );
                tmpSuper = curr[ KEYS.GET_SUPER ]();
                superObj = tmpSuper[ KEYS.SUPER ];
                
                tmpSuper[ KEYS.SUPER ] = null;
                tmpSuper[ KEYS.THIS ] = null;
                curr[ KEYS.SET_SUPER ]( null );
                
                for ( var n in curr ) {
                    if ( null == n )
                        continue;
                    null != tmpSuper[ n ] && (tmpSuper[ n ] = null);
                    curr[ n ] = null;
                    
                    delete curr[ n ];
                }
                
                delete curr[ 'constructor' ];
                delete curr[ 'destroy' ];
                delete curr[ 'getClass' ];
                delete curr[ 'toString' ];
                
                // clear __proto__ in firefox
                curr.__proto__ = null;
                delete curr[ '__proto__' ];
                
                curr = superObj;
                superObj = tmpSuper = null;
            }
            
            logger.debug( '[对象销毁] destroy: ' + msg.join( ' >> ' ) + ' >> Object' );
            msg = curr = null;
            // logger.warn( '[destroyObject] - end' );
        },

        /**
         * 返回一个纯接口对象数组，interfaces是字符串和接口对象的混合数组，字符串是接口名称
         */
        getInterfaceByItfs : function( interfaces ) {
            var tmp = [];

            // 遍历，并取出字符串对应的接口对象
            for ( var t, itface, i = 0, l = interfaces.length; i < l; ++i ) {
                t = interfaces[ i ];
                itface = typeof t == 'string' ? innerSpace[ t ] : t;
                if ( Fan.isInterface( itface ) ) {
                    tmp.push( itface );
                } else {
                    throw new Error( KEYS.ERROR + 'The "' + t + '" is not a interface.' );
                }
            }
            return tmp;
        },

        /**
         * @staticMethod Implements(Class classImpl, Interface/Array
         *               interfaces) 实现接口, 满足instanceof实例鉴别
         * 
         * <pre>
         * 1、classImpl - 实现类
         * 2、interfaces - 被实现的接口或接口数组
         * </pre>
         */
        Implements : function( classProxy, interfaces ) {
            if ( !interfaces )
                return classProxy;

            if ( !Fan.isArray( interfaces ) ) {
                interfaces = [ interfaces ];
            }

            for ( var i in interfaces ) {
                var it = interfaces[ i ];
                if ( Fan.isInterface( it ) ) {
                    var o = {};
                    it.call( o );

                    /**
                     * 使得 classProxy instanceof it 为真, 暂未实现， 需用Fan.instance(classProxy, it)来进行鉴别
                     * var f = function(){}; f.prototype = it.prototype;
                     */
                    classManager.applyPrototype( it, classProxy.prototype, true );
                    var propertys = new it();

                    classManager.applyPrototype( classProxy, propertys, true );
                    classManager.applyPrototype( classProxy[ KEYS.CLAZZ_BODY ], propertys, true );
                    propertys = null;

                    // -- 新的检测接口实现类 -- begin --
                    var ms = {};

                    try {
                        var s = classProxy;
                        while ( s && s !== Object ) {
                            s[ KEYS.CLAZZ_BODY ].call( ms );
                            s = s.superclass;
                        }
                    } catch ( e ) {
                        throw new Error( KEYS.ERROR + '"' + classProxy.className + '" 缺少默认无惨构造方法，请支持无惨构造。' );
                    }
                    // -- 新的检测接口实现类 -- end --
                    
                    for ( var k in o ) {
                        // 接口定义中，凡是值为Function的，视为接口方法，其余一律视为静态属性
                        if ( o[ k ] === Function ) {
                            if ( classProxy.prototype[ k ] === Function ) {
                                if ( !Fan.isFunction( ms[ k ] ) && !KEYS.REG_ABSTRACT_CLASS_PREFIX.test( Fan.last( classProxy.className.split( '.' ) ) ) ) {
                                    logger.warn( '[接口实现检测] [ERROR] - 类 "' + classProxy.className + '" 未实现的方法:' + k );

                                    // 调用未实现的方法，直接抛出异常
                                    classProxy.prototype[ k ] = Fan.proxy( function() {
                                        throw new Error( this );
                                    }, KEYS.ERROR + '"' + classProxy + '" 未实现的方法: "' + k + '"' );

                                    // 打上未实现方法的标记
                                    (classProxy.prototype[ k ])[ KEYS.IS_UNIMPLEMENT_METHOD ] = true;
                                } else if ( ms[ k ] !== Function ) {
                                    // 检测正常
                                    logger.debug( '[接口实现检测] [OK] - 类 "' + classProxy.className + '" 已实现方法:' + k );
                                }
                            }
                        }
                    }
                }
            }

            return classProxy;
        },

        // 类加载完毕事件通知，用于确定有依赖关系的类文件是否加载完成

        // -- 防止重复加载 -- begin --
        // 当前正在导入的文件列表
        loadingFileMap : null,
        
        // 在统计列表中增加一个需要加载的文件
        addLoadingFile : function( name ) {
            this.loadingFileMap || (this.loadingFileMap = Fan.newMap());
            this.loadingFileMap.put( name, 1 );
        },
        
        // 从正在加载的文件列表中移除一项
        removeLoadingFile : function( name ) {
            this.loadingFileMap && this.loadingFileMap.remove( name );
        },
        
        // 获取加载列表中的文件个数
        getLoadingFileCount : function() {
            return this.loadingFileMap ? this.loadingFileMap.size() : 0;
        },
        
        // 检测文件是否在加载列表中
        hasLoadingFile : function( name ) {
            return this.loadingFileMap ? this.loadingFileMap.has( name ) : false;
        },
        // -- 防止重复加载 -- end --

        /**
         * @staticMethod Class(String className, Class superClass, Interface interfaces, Function classBody)
         * 
         * <pre>
         * 创建一个类，Fan.Class等价于Fan.$class
         * 
         * 1、className - 完整类名:Fan.test.TestCreateClass，永远占据参数列表的第一个位置
         * 
         * 2、superClass - 该类继承自指定的类，缺省时将会继承Object，有则占据参数列表第二个位置
         * 
         * 3、interfaces - 可变长度的参数列表，当有superClass时，从参数列表第三个位置开始，到倒数
         *                 第二个参数为止，全部为interface；也可以是一个包含了多个接口的数组对象
         * 
         * 4、classBody - 类是实现部分，由一个function构成，永远占据参数列表最后一个位置
         * 
         * 参数列表使用示例：
         * Fan.Class(className, classBody)
         * Fan.Class(className, superClass, classBody)
         * Fan.Class(className, superClass, interface, classBody)
         * Fan.Class(className, superClass, interface1, interface2, interface3, interface..., classBody)
         * Fan.Class(className, superClass, [interface1, interface2, interface3], classBody)
         * Fan.Class(className, interface, classBody)
         * </pre>
         */
        Class : function( className, superClass, interfaces, classBody ) {
            var len = arguments.length;
            switch ( len ) {
            case 0 :
            case 1 :
                throw new Error( KEYS.ERROR + '类 "' + className + '" 创建异常, 参数列表错误.' );

            case 2 :
                classBody = superClass;
                superClass = interfaces = null;
                break;

            case 3 :
                classBody = interfaces;
                var tmp;
                if ( typeof superClass == 'string' ) {
                    tmp = superClass == 'Object' ? Object : innerSpace[ superClass ];
                } else
                    tmp = superClass;

                if ( Fan.isClass( tmp ) || tmp === Object ) {
                    // 是 class 的情况
                    superClass = tmp;
                    interfaces = null;
                } else {
                    // 是 interface 或 interface 数组的情况
                    if ( Fan.isArray( superClass ) ) {
                        interfaces = classManager.getInterfaceByItfs( superClass );
                    } else {
                        interfaces = tmp ? [ tmp ] : null;
                    }
                    superClass = null;
                }
                tmp = null;
                break;

            case 4 :
                var tmp;
                if ( typeof superClass == 'string' ) {
                    tmp = superClass == 'Object' ? Object : innerSpace[ superClass ];
                } else
                    tmp = superClass;

                if ( Fan.isClass( tmp ) || tmp === Object ) {
                    // 是 class 的情况
                    superClass = tmp;

                    // 是 interface 或 interface 数组的情况
                    tmp = Fan.isArray( interfaces ) ? interfaces : [ interfaces ];
                    interfaces = classManager.getInterfaceByItfs( tmp );
                } else {
                    // 是 interface 或 interface 数组的情况
                    tmp = [ superClass, interfaces ];
                    interfaces = classManager.getInterfaceByItfs( tmp );
                    superClass = null;
                }
                tmp = null;
                break;

            // len > 4
            default :
                var itfs = [];
                var tmp;
                if ( typeof superClass == 'string' ) {
                    tmp = superClass == 'Object' ? Object : innerSpace[ superClass ];
                } else
                    tmp = superClass;

                if ( Fan.isClass( tmp ) || tmp === Object ) {
                    // is class
                    superClass = tmp;
                } else if ( Fan.isInterface( superClass ) ) {
                    // is interface
                    itfs.push( superClass );
                    superClass = null;
                }
                for ( var i = 2, l = arguments.length - 1; i < l; ++i ) {
                    itfs.push( arguments[ i ] );
                }
                classBody = arguments[ len - 1 ];
                interfaces = classManager.getInterfaceByItfs( itfs );
                itfs = tmp = null;
                break;
            }
            
            if ( Fan.isPackage( Fan.getSpace()[ className ] ) )
                throw new Error( KEYS.ERROR + ' "' + className + '" 类名冲突' );

            // 只能继承Fan定义的类
            superClass = classManager.isClass( superClass ) || ('Fan.Object' === className) ? superClass : Fan.Object;
            interfaces = interfaces || null;

            // 检测父类是否实现过接口，并取出
            if ( Fan.isClass( superClass ) ) {
                var itfs = superClass.getInterfaces();
                if ( itfs.length > 0 ) {
                    interfaces = interfaces || [];
                    for ( var i = 0, l = itfs.length; i < l; ++i ) {
                        interfaces.push( itfs[ i ] );
                    }
                }
            }

            // 原始的类主体。
            var clazz = classBody,

            // 构造方法名称
            n = Fan.fn.last( className.split( '.' ) ),

            // class proxy
            classProxy = classManager.createClassProxy( className, n );

            // 保存最初源码
            classProxy.srcCode = fun_toString.call( clazz );

            // 新生成的源码，提供一个默认构造方法在类的最前端，当自身有定义构造方法是，将会覆盖默认的构造方法
            // var newSrcCode = classManager.createNewClassCode( clazz, n );

            // 重新生成类的主体
            // classProxy[ KEYS.CLAZZ_BODY ] = clazz = Fan.gEval( '[' + newSrcCode + ']' + (KEYS.EVAL_JS_CODE_SUFFIX_FOR_AJAX + className.replace( /[.]/g, '/' )) + '.class' )[ 0 ];
            // 保存新组织的源码
            // classProxy[ KEYS.CLAZZ_NEW_SRC_CODE ] = newSrcCode;
            // newSrcCode = null;
            
            classProxy[ KEYS.CLAZZ_BODY ] = clazz;
            
            classManager.applyPrototype( classProxy, clazz.prototype, true );

            // 类名
            classProxy.className = className;

            // 类特殊标识
            classProxy[ KEYS.IS_CLASS ] = true;

            // 实例均可通过getClass获得类的定义
            classManager.applyPrototype( clazz, {
                getClass : Fan.fn.newClosure( classProxy )
            } );

            // 取出所有接口放在数组中，并去除冗余
            if ( interfaces ) {
                var m = Fan.newMap(), t;
                for ( var i = 0, len = interfaces.length; i < len; ++i, t = null ) {
                    t = interfaces[ i ];
                    if ( !Fan.isInterface( t ) )
                        throw new Error( KEYS.ERROR + '类 "' + className + '" 创建异常, 参数列表中含有非法的接口.' );

                    m.put( t, true );

                    t = t.getInterfaces();
                    if ( t.length > 0 ) {
                        for ( var j = 0, l = t.length; j < l; ++j ) {
                            m.put( t[ j ], true );
                        }
                    }
                }
                m.size() > 0 && (interfaces = m.getKeySet());
                m = null;
            }

            classProxy.toString = Fan.fn.newClosure( '[class ' + classProxy.className + ']' );

            classProxy.getInterfaces = Fan.fn.newClosure( interfaces || [] );
            classProxy.getInterfaces.toString = nativeFunction;

            // 根据类名，查找并安置在其对应的命名空间下
            // 'Fan.util.Class1' --> ['Fan', 'util', 'Class1']
            var ns = className.split( '.' );

            if ( ns.length == 1 ) {
                // 'Class1' --> innerSpace['Class1'] = c;
                innerSpace[ ns[ 0 ] ] = classProxy;

            } else {
                // 'Fan.util.Class1' --> 'Fan'
                var tn = ns[ 0 ];

                // 'Fan.util.Class1' --> 'Class1'
                var name = ns[ ns.length - 1 ];

                // 'Fan' --> Fan object
                tn = innerSpace[ tn ];

                var n = tn;
                // Fan --> Fan['util'] --> Fan.util['Class1']
                for ( var i = 1, l = ns.length; i < l; ++i ) {
                    if ( !n ) {
                        var e = new Error( KEYS.ERROR + '命名空间错误: ' + className );
                        e._errType = ErrorTypes.ClassInitError;
                        e._errClassName  = className;
                        e._errMethodName = '';
                        // 命名空间错误, 则错行为文件的第1行
                        e._errLineOffset = (e.lineNumber >> 0) - getEvalRowNumber();
                        classManager.error( e );
                        throw e;
                    }
                    if ( Fan.isPackage( n[ ns[ i ] ] ) ) {
                        n = n[ ns[ i ] ];
                    } else if ( !n[ ns[ i ] ] && name == ns[ i ] ) {
                        // Fan.util['Class1'] = c
                        n[ name ] = classProxy;
                        break;
                    }
                }
            }

            // 继承
            classManager.Extends( classProxy, superClass );

            // 实现接口
            classManager.Implements( classProxy, interfaces );

            // 发布到innerSpace域中，以className为句柄名称
            innerSpace[ className ] = classProxy;

            // 当是非Fan根目录下的类，则发布到window上，如：com.aaa.A
            if ( !/^Fan[.]/.test( className ) ) {
                var firstName = Fan.fn.first( className.split( '.' ) );
                window[ firstName ] = innerSpace[ firstName ];
            }

            // 从正在加载的列表中移除
            classManager.removeLoadingFile( className );

            // 触发事件，接口加载完毕
            Fan.fire( 'classload', [ className, classProxy ] );

            return classProxy;
        },
        
        /**
         * @staticMethod Interface(String interfaceName, Interface/Array
         *               extendInterfaces, Function classBody)
         *               创建一个接口，Interface成员：{interfaceName、getInterfaces、srcCode}
         * 
         * <pre>
         * 1、interfaceName - 完整接口名:Fan.test.ICreate
         * 2、extendInterfaces - 继承自指定的接口，可多重继承，单一接口或接口数组
         * 3、classBody - 接口的主题部分，由一个function构成
         * </pre>
         */
        Interface : function( interfaceName, extendInterfaces, classBody ) {
            var len = arguments.length;
            switch ( len ) {
            case 0 :
            case 1 :
                throw new Error( KEYS.ERROR + '接口 "' + interfaceName + '" 创建异常, 参数列表错误.' );

            case 2 :
                classBody = extendInterfaces;
                extendInterfaces = null;
                break;

            case 3 :
                extendInterfaces = classManager.getInterfaceByItfs( Fan.isArray( extendInterfaces ) ? extendInterfaces : [ extendInterfaces ] );
                break;

            // len > 3
            default :
                var itfs = [];
                for ( var i = 1, l = arguments.length - 1; i < l; ++i ) {
                    itfs.push( arguments[ i ] );
                }
                classBody = arguments[ len - 1 ];
                extendInterfaces = classManager.getInterfaceByItfs( itfs );
                break;
            }

            var itface = [ classBody || Fan.newFunction() ][ 0 ];

            // itface.defer = itface.proxy = undefined;
            // 接口名
            itface.interfaceName = interfaceName;

            // 接口特殊标识
            itface[ KEYS.IS_INTERFACE ] = true;

            // 保存接口定义的源码
            itface.srcCode = fun_toString.call( itface );

            // 取出接口定义的属性成员，将其追加在接口function上
            var o = {};
            itface.call( o );
            for ( var k in o ) {
                if ( o[ k ] != Function && Fan.checkName( k ) ) {
                    itface[ k ] = o[ k ];
                }
            }

            itface.toString = Fan.fn.newClosure( '[interface ' + itface.interfaceName + ']' );

            // 取出所有接口放在数组中，并去除冗余
            if ( extendInterfaces ) {
                var a = Fan.newMap(), t;
                for ( var i = 0, len = extendInterfaces.length; i < len; ++i, t = null ) {
                    t = extendInterfaces[ i ];
                    if ( !Fan.isInterface( t ) ) {
                        throw new Error( KEYS.ERROR + '[检测异常] - 接口创建异常, 参数列表中含有非法的接口.' );
                    }
                    a.put( t, true );

                    t = t.getInterfaces();
                    if ( t.length > 0 ) {
                        for ( var j = 0, l = t.length; j < l; ++j ) {
                            a.put( t[ j ], true );
                        }
                    }
                }
                a.size() > 0 && (extendInterfaces = a.getKeySet());
                a = null;
            }

            // 获取当前接口继承的所有父级接口
            itface.getInterfaces = Fan.fn.newClosure( extendInterfaces || [] );
            itface.getInterfaces.toString = nativeFunction;

            // 根据接口名，查找并安置在其对应的命名空间下
            // 'Fan.test.ICreate' --> ['Fan', 'test', 'ICreate']
            var ns = interfaceName.split( '.' );

            if ( ns.length == 1 ) {
                // 'ICreate' --> innerSpace['ICreate'] = itface;
                innerSpace[ ns[ 0 ] ] = itface;

            } else {
                // 'Fan.test.ICreate' --> 'Fan'
                var tn = ns[ 0 ];

                // 'Fan.test.ICreate' --> 'ICreate'
                var name = ns[ ns.length - 1 ];

                // 'Fan' --> Fan object
                tn = innerSpace[ tn ];

                var n = tn;
                // Fan --> Fan['test'] --> Fan.test['ICreate']
                for ( var i = 1, l = ns.length; i < l; ++i ) {
                    if ( Fan.isPackage( n[ ns[ i ] ] ) ) {
                        n = n[ ns[ i ] ];
                    } else if ( !n[ ns[ i ] ] && name == ns[ i ] ) {
                        // Fan.test['ICreate'] = itface
                        n[ name ] = itface;
                        break;
                    }
                }
            }

            // 接口继承
            extendInterfaces && classManager.Extends( itface, extendInterfaces );

            // 发布到innerSpace域中，以interfaceName为句柄名称
            innerSpace[ interfaceName ] = itface;

            // 当是非Fan根目录下的类，则发布到window上，如：com.aaa.ICreate
            if ( !/^Fan[.]/.test( interfaceName ) ) {
                var firstName = Fan.fn.first( interfaceName.split( '.' ) );
                window[ firstName ] = innerSpace[ firstName ];
            }

            // 从正在加载的列表中移除
            classManager.removeLoadingFile( interfaceName );

            // 触发全局事件
            Fan.fire( 'classload', [ interfaceName, itface ] );

            return itface;
        },

        /**
         * @staticMethod createClassProxy(String className, String methodName)
         *               创建一个代理类
         * 
         * <pre>
         * 1、className - 类的全名称
         * 2、methodName - 类的构造方法名称
         * </pre>
         * 
         * @return {Function} 返回一个代理类或者null
         */
        createClassProxy : function( className, methodName ) {
            return function () {
                
                // 判断是否为通过new关键字调用
                if ( this instanceof arguments.callee ) {
                    
                    // 构造对象，主动调用构造函数
                    var o;
                    try {
                        o = new arguments.callee[ KEYS.CLAZZ_BODY ]();
                    } catch ( e ) {
                            
                        e._errType = ErrorTypes.ClassInitError;
                        e._errClassName = className;
                        e._errMethodName = methodName;
                        classManager.error( e );

                        throw e;
                    }
                    
                    if ( Fan.isFunction( o[ KEYS.SET_SUPER ] ) )
                        o[ KEYS.SET_SUPER ]( Fan.proxy( classManager.Super, o ) );
                    else
                        throw new Error( KEYS.ERROR + '"' + className + '" has not Super.' );

                    if ( Fan.isFunction( o[ methodName ] ) ) {
                        
// ======================================================
//                      该异常捕获代码暂时注释                             begin
//                      原因是从新throw异常后
//                      浏览器定位的错误位置是throw这一刻
//                      不便查找真正的错误代码
//                      解开注释即可恢复
// ======================================================
                        try {
                            o = o[ methodName ].apply( o, arguments ) || o;
                        } catch ( e ) {
                            e._errType = ErrorTypes.ClassInitError;
                            e._errClassName = className;
                            e._errMethod = methodName;
                            classManager.error( e );
                            throw e;
                        }
// ======================================================
//                      该异常捕获代码暂时注释
//                      原因是从新throw异常后
//                      浏览器定位的错误位置是throw这一刻
//                      不便查找真正的错误代码
//                      解开注释即可恢复                                                 end
// ======================================================
                            
                        // 删除新对象中的构造方法
                        delete o[ methodName ];
                    } else {
                        throw new Error( KEYS.ERROR + '"' + className + '" has not constructor.' );
                    }
                    
                    return o;
                    
                } else if ( !classManager.isClass( this ) && !classManager.isPackage( this ) && !classManager.isInterface( this ) ) {
                    return arguments.callee[ KEYS.CLAZZ_BODY ].apply( this, arguments );
                }
                return null;
            };
        },

        /**
         * @staticMethod instance(Object obj, Interface itface)
         *               仅用于鉴别一个类或类的实例对象是否属于接口的派生 instance
         *               作用相当于：obj instanceof interface
         * 
         * <pre>
         * 1、obj - 被鉴别的对象
         * 2、itface - 被鉴别的对象是否属于itface接口的派生对象
         * </pre>
         * 
         * @return {Boolean}
         */
        instance : function( obj, itface) {
            if ( null == obj || null == itface ) {
                return false;
            }
            if ( !Fan.isClass( obj ) && !Fan.isInterface( obj ) ) {
                obj = obj.getClass();
            }

            var interfaces = obj.getInterfaces();
            if ( !interfaces || interfaces.length == 0 ) {
                return false;
            }

            return !!Fan.each( interfaces, function() {
                if ( itface.interfaceName == this.interfaceName )
                    return true;
            } );
        },

        /**
         * @staticMethod isPackage(Function pack) 判断一个function对象是否是命名空间结构对象
         * 
         * <pre>
         * 1、fn - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isPackage : function( pack ) {
            if ( !pack || typeof pack != 'function' )
                return false;
            return !!pack[ KEYS.IS_PACKAGE ];
        },

        /**
         * @staticMethod isClass(Function clazz) 判断一个function对象是否为Class
         * 
         * <pre>
         * 1、fn - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isClass : function( clazz ) {
            if ( !clazz || typeof clazz != 'function' )
                return false;
            return !!clazz[ KEYS.IS_CLASS ];
        },

        /**
         * @staticMethod isInterface(Function itface) 判断一个function对象是否为Interface
         * 
         * <pre>
         * 1、fn - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isInterface : function( itface ) {
            if ( !itface || typeof itface != 'function' )
                return false;
            return !!itface[ KEYS.IS_INTERFACE ];
        },

        /**
         * @staticMethod isUnimplement(Function method) 判断一个function对象是否属于未实现的方法
         * 
         * <pre>
         * 1、fn - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isUnimplement : function( method ) {
            return undefined === method || method === Function || (method && method[ KEYS.IS_UNIMPLEMENT_METHOD ] ? true : false);
        },
        
        // 判断某个类文件是否已经载入
        hasLoaded : function ( className ) {
            return !!innerSpace[ className ];
        }
    };
    
    // 增加类注册机制
    classManager.Class.forName = function ( className ) {
        if ( classManager.isClass( className ) )
            return className;
        else if ( Fan.type( className ) != 'string' )
            return null;
        
        var clazz = innerSpace[ className ];
        if ( !clazz )
            classManager.Import( className );
        clazz = innerSpace[ className ];
        
        return clazz;
    };
    
    // 创建一个实例对象
    classManager.Class.instance = function( className, config ) {
        var clazz = classManager.Class.forName( className );
        var obj;
        if ( clazz ) {
            obj = new clazz( config );
        } else {
            logger.warn( '[警告] - 缺少类文件:' + className );
        }
        return obj || null;
    };
    
    // 重写toString
    classManager.Class.toString       = nativeFunction,
    classManager.Interface.toString   = nativeFunction,
    classManager.Package.toString     = nativeFunction,
    classManager.Import.toString      = nativeFunction,
    classManager.deferImport.toString = nativeFunction,
    classManager.instance.toString    = nativeFunction,
    classManager.isPackage.toString   = nativeFunction,
    classManager.isClass.toString     = nativeFunction,
    classManager.isInterface.toString = nativeFunction;

    // 暴露特性
    Fan.apply( Fan, {
        // 父级目录结构名称
        parentPackageName : '',
        // 当前一个节点的名称
        currentPackageName : 'Fan',
        // 完整目录名称
        packageName : 'Fan',

        // Fan不实现这三个方法
        enable   : Fan.newFunction(),
        disable  : Fan.newFunction(),
        isEnable : function() {
            return true;
        },
        
        // 当前时间毫秒数
        now : Date.now || function() { return new Date().getTime(); },

        // 获取内部存储对象，该对象存储加载过的类和接口
        getSpace : function() {
            return innerSpace;
        },
        ErrorTypes : ErrorTypes,
        // 缓存
        cache : {}
    } );
    
    // 类管理
    Fan.ClassManager = Fan.OOP = classManager;
    
    // 暴露主要方法
    Fan.Class       = classManager.Class,
    Fan.Interface   = classManager.Interface,
    Fan.Package     = classManager.Package,
    Fan.Import      = classManager.Import,
    Fan.deferImport = classManager.deferImport,
    Fan.instance    = classManager.instance,
    Fan.isPackage   = classManager.isPackage,
    Fan.isClass     = classManager.isClass,
    Fan.isInterface = classManager.isInterface,
    
    // 首字母小写（不推荐，避免将来与保留关键字产生冲突）
    /*Fan[ 'class' ] = classManager.Class,
    Fan[ 'interface' ] = classManager.Interface,
    Fan[ 'package' ] = classManager.Package,
    Fan[ 'import' ] = classManager.Import;*/

    // 初始化一次
    classManager.init( function() {
        Fan.fire( 'oop-initialized' );
    } );
    
})( Fan );


/**
 * 封装常用操作DOM的函数
 */
(function( Fan, undefined ) {
var
    
    window = this,

    // 日志
    // logger = Fan.getLogger(),
    
    // 常量键
    KEYS = Fan.apply( Fan.KEYS, {
        // 清除前后分号，在修改css中使用
        REG_CLEAR_SEMICOLON : /^(\s*;)|(;\s*)$/g,
        
        FAN_DOM_ANIM_ELEM_ID : '_FAN_DOM_ANIM_ELEM_ID_'
    } ),
    
    // 便于访问 ==> Fan.util.anim.Anim.getNowValueByProgressAndConfig
    getNowValueByProgressAndConfig = null,

    // 封装了Anim，提供Dom元素简易使用Anim制作动画
    Anim = {
        // 当前执行动作的元素对象集合
        currDoActionObject : {},
        
        // 停止元素上的动作
        stop : function( elem ) {
            if ( typeof elem === 'string' )
                return Anim.stopAction( animId );
            
            // 动画id
            var animId = elem && elem[ KEYS.FAN_DOM_ANIM_ELEM_ID ];
            
            // 停止原先动作，执行当前动作
            animId && Anim.stopAction( animId );
        },

        // 停止元素上的动作
        stopAction : function( animId ) {
            if ( Anim.currDoActionObject[ animId ] ) {
                Anim.currDoActionObject[ animId ].stop();
                Anim.currDoActionObject[ animId ] = null;
                delete Anim.currDoActionObject[ animId ];
            }
        },

        /**
         * 根据属性获取动画的参数
         */
        getPropAction : function( elem, prop, propValue, propsConfig ) {
            var action;

            switch ( prop ) {
            // 支持动作的CSS
            case 'width' :
            case 'height' :
            case 'top' :
            case 'left' :
            case 'right' :
            case 'bottom' :
            case 'marginLeft' :
            case 'marginTop' :
            case 'marginRight' :
            case 'marginBottom' :
            case 'paddingLeft' :
            case 'paddingTop' :
            case 'paddingRight' :
            case 'paddingBottom' :
            case 'fontSize' :
                action = Anim.animPropActions.defaultsCSSAction( elem, prop, propValue, propsConfig );
                break;

            // case 'backgroundColor' :
            // case 'color' :

            // 支持动作的属性
            case 'scrollTop' :
            case 'scrollLeft' :
                action = Anim.animPropActions.scrollAction( elem, prop, propValue, propsConfig );
                break;

            // 测试动作
            case 'test' :
                action = Anim.animPropActions.testAction( elem, prop, propValue, propsConfig );
                break;

            // 默认的动作处理，按照CSS处理
            default :
                return null;
                // 返回null
                // action = Anim.animPropActions.defaultsCSSAction( elem, prop, propValue, propsConfig );
                // break;
            }

            return action;
        },

        /**
         * 定义属性参数取值方式
         */
        animPropActions : {
            // 默认CSS动作
            defaultsCSSAction : function( elem, prop, propValue, propsConfig ) {
                var start = dom.getCss( elem, prop );
                start = parseFloat( start );
                var end = parseFloat( propValue );
                var unit = (propValue + '').replace( /[^a-z]/ig, '' ) || 'px';
                return {
                    start : start,
                    end : end,
                    step : function( now, progress ) {
                        elem.style[ prop ] = now + unit;
                    }
                };
            },

            // 滚轮动作
            scrollAction : function( elem, prop, propValue, propsConfig ) {
                var start = elem[ prop ], end = propValue;
                return {
                    start : start,
                    end : end,
                    step : function( now, progress ) {
                        elem[ prop ] = now;
                    }
                };
            },

            // 测试动作
            testAction : function( elem, prop, propValue, propsConfig ) {
                return {
                    start : propsConfig[ 'start' ],
                    end : propsConfig[ 'end' ],
                    step : function( now, progress ) {
                        //logger.warn('now:'+progress);
                        //propsConfig[ prop ] = now;
                    }
                };
            }
        },
        
        /**
         * 给一个html元素定制样式平滑动作
         * 
         * @param {HtmlElement/String}
         *            elem - 需要定制动画的html元素
         * @param {Object}
         *            propsConfig - 需要制作动画的属性配置
         * @param {Object/Function/Number}
         *            animConfig - 动画配置，可选，配置参照Anim类的构造参数
         * 
         * <pre>
         * animConfig配置:
         * 1、animConfig : {
         *        longTime : 动画执行的时长
         *        step 每一个子动作后被调用的函数，该函数返回false则可以终止动作，接受参数：now,progress,propName
         *        callback 动作完毕后调用的函数
         *    }
         * 2、animConfig : function(now, progress) {} callback函数
         * 3、animConfig : longTime 执行的动画时长
         * </pre>
         * 
         * 示例1： Fan.anim('#test-upload-div', {top:0,left:0,width:1438,height:400}, 50)
         * 示例2:
         *       Fan.anim( wrap, {
         *           test : true,
         *           start : curxy.xx,
         *           end : -xy.xx
         *       }, {
         *           longTime : 200,
         *           step : function( now, progress ) {
         *               var css = cssText.replace( _reg_ig, ':translate(' + now + 'px,' + curxy.yy + 'px)' );
         *               wrap.style.cssText = css;
         *           },
         *           callback : function() {
         *               //_currViewController = _centerViewController;
         *               me = wrap = xy = curxy = cssText = null;
         *           } 
         *       } );
         */
        anim : function( elem, propsConfig, animConfig ) {
            if ( typeof elem == 'string' ) {
                elem = Fan.$( elem )[ 0 ];
            }

            if ( !elem || !propsConfig )
                return;

            // 便于访问
            if ( !getNowValueByProgressAndConfig ) {
                Fan.Import( 'Fan.util.anim.Anim' );
                getNowValueByProgressAndConfig = Fan.util.anim.Anim.getNowValueByProgressAndConfig;
            }
            
            // 动画id
            var animId = elem[ KEYS.FAN_DOM_ANIM_ELEM_ID ];
            // 停止原先动作，执行当前动作
            animId && Anim.stopAction( animId );

            // 给执行动作的元素生成一个动画ID
            animId = Fan.id( 'FAN_DOM_ANIM_ELEM_ID_' );
            elem[ KEYS.FAN_DOM_ANIM_ELEM_ID ] = animId;

            // 动作集合缓存，避免重复获取属性的动作
            var actions = {};

            // Anim的初始配置
            if ( Fan.isFunction( animConfig ) ) {
                animConfig = {
                    callback : animConfig
                };
            } else if ( Fan.isNum( animConfig ) ) {
                animConfig = {
                    longTime : animConfig
                };
            }

            // 用于通过主Anim对象的progress取得子Anim的now值
            animConfig = Fan.apply( {}, animConfig );
            var _step = animConfig.step, _callback = animConfig.callback;

            // 若是测试模式
            if ( propsConfig[ 'test' ] ) {
                animConfig.start = propsConfig.start >> 0;
                animConfig.end = propsConfig.end >> 0;
            } else {
                // 主代理动画的起始和结束
                animConfig.start = 0;
                animConfig.end = 100;
            }
            
            // 覆盖step和callback回调函数
            animConfig.callback = function( now, progress ) {
                _callback && _callback.call( this, now, progress );
                Anim.stopAction( animId );
            };
            animConfig.step = function( now, progress ) {
                // 判断_step是否关闭了主动画对象
                if ( this.isStop() ) {
                    Anim.stopAction( animId );
                    return;
                }
                for ( var prop in propsConfig ) {
                    if ( prop ) {
                        var propAction;

                        // 判断属性动作是否存在
                        if ( !(propAction = actions[ prop ]) && null !== propAction ) {
                            // 若不存在，获取属性动作
                            actions[ prop ] = propAction = Anim.getPropAction( elem, prop, propsConfig[ prop ], propsConfig );
                        }

                        if ( propAction ) {
                            // 设置起点和终点
                            animConfig.start = propAction.start;
                            animConfig.end = propAction.end;
                            var nowVal = getNowValueByProgressAndConfig( progress, animConfig );
                            // 调用动作处理
                            propAction.step( nowVal, progress );
                            
                            // 每一步的回调
                            _step && _step.call( this, nowVal, progress, prop );
                        } else {
                            // 删除不支持动画的属性
                            delete propsConfig[ prop ];
                        }
                    }
                }
                
                // 是否为空对象
                if ( Fan.isEmptyObject( propsConfig ) ) {
                    logger.debug( '[动画停止] 无支持动画的属性' );
                    this.stop();
                    Anim.stopAction( animId );
                }
            };

            // 创建主Anim对象
            var anim = new Fan.util.anim.Anim( animConfig );

            // 缓存当前正在动作的元素，动作完毕后需将其移除
            Anim.currDoActionObject[ animId ] = {
                stop : function() {
                    elem[ KEYS.FAN_DOM_ANIM_ELEM_ID ] = undefined;
                    try {
                        // IE 7 BUG
                        delete elem[ KEYS.FAN_DOM_ANIM_ELEM_ID ];
                    } catch ( _ ) {
                    }
                    anim.destroy();
                    actions = elem = animId = anim = animConfig = propsConfig = _step = _callback = null;
                    logger.debug( '[动画停止]' );
                }
            };

            // 启动动画
            anim.start();
        }
    },

    // 扩展Fan.dom
    dom = Fan.dom = {
        Anim : Anim,
        
        // 文本框中的常用操作，在textarea中也通用
        input : {
            // 选中文本
            select : function( ipt, start, end ) {
                if ( ipt.setSelectionRange ) {
                    // for firefox|chrome|safari|opera
                    ipt.setSelectionRange( start || 0, Fan.isNum( end ) ? end : ipt.value.length );
                } else if ( ipt.createTextRange ) {
                    // for ie
                    var r = ipt.createTextRange();
                    r.collapse( true );
                    r.moveStart( 'character', start || 0 );
                    r.moveEnd( 'character', Fan.isNum( end ) ? end : ipt.value.length );
                    r.select();
                }
                ipt.focus();
            },

            // 取出选择的文本
            getSelectText : function( ipt ) {
                if ( document.selection ) {
                    return document.selection.createRange().text;
                } else {
                    return ipt.value.substring( ipt.selectionStart, ipt.selectionEnd );
                }
            },
            
            // 输入限制
            // valueAreaReg - 合法值域
            // illegalValueReg - 非法值
            keypress : function ( input, valueAreaReg, illegalValueReg ) {
                if ( !input || !valueAreaReg )
                    return;
                
                // 粘贴校验
                illegalValueReg && (Fan.addEvent( input, 'paste', function ( event ) {
                    // 此处this在IE7下,指向window, 因此不用this指向当前元素, 改用event的srcElement
                    var ipt = Fan.Event.getTarget( event );
                    Fan.defer( function() {
                        // 粘贴时,去除非法字符
                        ipt.value = ipt.value.replace( illegalValueReg, '' );
                        ipt = null;
                    } );
                } ));
                
                // 输入校验
                Fan.addEvent( input, 'keypress', function ( event ) {
                    var keyCode = event.keyCode || event.charCode || event.which;
                    switch ( true ) {
                    // 放开校验
                    case event.ctrlKey && (keyCode == 97 || keyCode == 65) :  // 全选
                    case event.ctrlKey && (keyCode == 99 || keyCode == 67) :  // 复制
                    case event.ctrlKey && (keyCode == 118 || keyCode == 86) : // 粘贴
                    case event.ctrlKey && (keyCode == 120 || keyCode == 88) : // 剪切
                    case keyCode == 8 :  // 退格
                    case keyCode == 9 :  // tab
                    case keyCode == 13 : // 回车
                    case keyCode == 35 : // home
                    case keyCode == 36 : // end
                    case keyCode == 37 : // 左
                    case keyCode == 38 : // 上
                    case keyCode == 39 : // 右
                    case keyCode == 40 : // 下
                    case keyCode == 46 : // 删除
                        break;
                    // 禁止输入
                    case !( valueAreaReg.test( String.fromCharCode( keyCode ) ) ) : 
                        logger.debug( 'reg:' + valueAreaReg + '\tkeycode:' + event.keyCode );
                        Fan.Event.cancel( event );
                        return false;
                    }
                } );
                input = null;
            }
        },

        // file元素的相关操作
        file : {
            /**
             * 建立一個可存取到該file的url PS: 浏览器需支持HTML5 File API
             */
            getUrl : function( file ) {
                switch ( true ) {
                case Fan.isFunction( window.createObjectURL ) :
                    // basic
                    return window.createObjectURL( file );
                case window.URL && Fan.isFunction( window.URL.createObjectURL ) :
                    // mozilla firefox
                    return window.URL.createObjectURL( file );
                case window.webkitURL && Fan.isFunction( window.webkitURL.createObjectURL ) :
                    // webkit chrome
                    return window.webkitURL.createObjectURL( file );
                default : return null;
                }
            }
        },

        // img元素的相关操作
        img : {
            /**
             * 自适应大小，让不规则大小的图片能够自适应给定的标准大小比例，不产生拉伸效果 该方法用于img的onload事件中
             * 避免闪烁,可在img元素增加样式visibility:hidden;以及父容器增加超出隐藏
             */
            autoSize4ImgOnload : function( img, width, height ) {
                if ( !img )
                    return;

                // 改成自适应，恢复真实大小
                img.style.width = 'auto';
                img.style.height = 'auto';

                try {
                    // 真实大小
                    var w = img.offsetWidth;
                    var h = img.offsetHeight;

                    // 限制大小与比例
                    var p = width / height;

                    // 真实比例
                    var sp = w / h;

                    // 根据比例调整
                    if ( w > width || h > height ) {
                        if ( p > sp ) {
                            // 真实width过大
                            img.style.height = height + 'px';
                        } else if ( p < sp ) {
                            // 真实height过大
                            img.style.width = width + 'px';
                        } else {
                            // 比例相同，但真实大小超过限制
                            img.style.height = height + 'px';
                        }
                    } else {
                        // 没有超过限制，则不限制，如需拉伸限制，则可在此控制
                    }
                    
                    // 调整完大小后,显示出来
                    img.style.visibility = 'inherit';
                    img.setAttribute( '_auto_size_img_size_', w + ',' + h );
                } catch ( _ ) {
                }
            }
        },
        
        /**
         * @staticMethod textOverflow(HTMLElement/Jquery elem, String text, int width)
         *  字符超出后显示省略号
         * 
         * <pre>
         * 1、elem - 文本的容器元素，html元素或者jquery对象，注意：文本容器元素的宽度样式必须是随文本长度可变的。
         * 2、text - 文本内容
         * 3、width - 文本容器的限定宽度，超出此宽度，则显示省略号
         * 4、isOverride - 可选,当没有超出时,也使用text参数覆盖元素innerHTML属性
         * </pre>
         */
        textOverflow : function( elemOrJqueryObj, text, width, isOverride ) {
            if ( !elemOrJqueryObj )
                return;
            var jqEl = jQuery( elemOrJqueryObj );

            var t = text;
            var len = (t + '').replace( /[^\x00-\xff]/g, '' ).length + (t + '').replace( /[\x00-\xff]/g, '' ).length * 1.829268292682927;

            if ( len > 0 ) {
                var fontSize = parseInt( Fan.dom.getCss( jqEl[ 0 ], 'font-size' ) ) || 12;
                // 间距 : 1.1614583333333333
                fontSize = (fontSize / 2) * 1.1614583333333333;

                // logger.debug( '原始长度:' + len );
                // logger.debug( '英文字宽:' + fontSize );
                
                len = len * fontSize;

                // logger.debug( '实际长度:' + len );
                // logger.debug( '限定长度:' + width );

                // 超出长度限制
                if ( len > width ) {
                    var i, s;
                    
                    // logger.debug( '超出长度:' + (len - width - 3 * fontSize) );
                    
                    len = width + (3 * fontSize);

                    // logger.debug( '截取后长度:' + len );

                    // 循环累积法可以换成其他更高效的算法
                    for ( i = 0, s = t.length; 0 < len && i < s; i++ ) {
                        var l = t.charAt( i ).replace( /[^\x00-\xff]/g, 'ii' ).length;
                        if ( l > 1 ) {
                            // 1个中文宽度是1个英文的1.829268292682927倍
                            l = 1.829268292682927;
                        }
                        len -= (l * fontSize);
                        if ( 0 >= len ) {
                            if ( l == 1 ) {
                                i--;
                                if ( t.charAt( i ).replace( /[^\x00-\xff]/g, 'ii' ).length == 1 ) {
                                    i--;
                                    if ( t.charAt( i ).replace( /[^\x00-\xff]/g, 'ii' ).length == 1 ) {
                                        i--;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    // logger.warn(t.length + ',' + i);
                    if ( i < t.length ) {
                        jqEl.text( t.substring( 0, i ) + '...' );
                        jqEl.attr( 'title', t );
                    } else if ( isOverride ) {
                        jqEl.text( t );
                        jqEl.attr( 'title', '' );
                    }
                } else if ( isOverride ) {
                    jqEl.text( t );
                    jqEl.attr( 'title', '' );
                }
            } else if ( isOverride ) {
                jqEl.text( t );
                jqEl.attr( 'title', '' );
            }

            jqEl = elemOrJqueryObj = width = null;
        },

        /**
         * @staticMethod xmlToString(XMLObject xmlObj) 将xml对象（dom对象）转换成字符串形式
         * 
         * <pre>
         * 1、xmlObj - 需要被序列化成字符串的xml对象
         * </pre>
         * 
         * @return 返回字符串形式的xml
         */
        xmlToString : function( xmlObj ) {
            if ( typeof XMLSerializer != 'undefined' )
                return (new XMLSerializer()).serializeToString( xmlObj );
            else if ( Fan.type( xmlObj.xml ) != 'undefined' )
                return xmlObj.xml;
            else if ( document.implementation.hasFeature( 'LS', '3.0' ) ) {
                var serialier = document.implementation.createLSSerializer();
                return serialier.writeToString( xmlObj );
            } else {
                throw new Error( 'Error::浏览器不支持序列化XML对象' );
            }
        },

        /**
         * @staticMethod stringToXml(String xmlStr) 将字符串形式的xml转换成xml对象
         * 
         * <pre>
         * 1、xmlStr - 需要被构建成xml对象的字符串
         * </pre>
         * 
         * @return 返回xml对象
         */
        stringToXml : function( xmlStr ) {
            if ( null == xmlStr )
                return null;
            var doc;

            if ( typeof DOMParser != 'undefined' ) {
                doc = (new DOMParser()).parseFromString( xmlStr, 'text/xml' );
            } else if ( document.implementation.hasFeature( 'LS', '3.0' ) ) {
                var impl = document.implementation;
                var parser = impl.createLSParser( impl.MODE_SYNCHRONOUS, null );
                var ipt = impl.createLSInput();
                ipt.stringData = xmlStr;
                doc = parser.parse( ipt );
            } else if ( typeof ActiveXObject != 'undefined' ) {
                doc = new ActiveXObject( 'Microsoft.XMLDOM' );
                doc.async = 'false';
                doc.loadXML( xmlStr );
                if ( doc.parseError != 0 ) {
                    throw new Error( 'Error::解析xml字符串异常，错误原因:' + doc.parseError.reason );
                }
            }

            return doc;
        },

        /**
         * @method attr(key, val) 获取或设置元素属性值
         * 
         * @param {String}
         *            key 返回key对应的值
         * 
         * @param {Object}
         *            val 可选，存在val参数时，则是存值
         */
        attr : function( el, key, val ) {
            if ( null == el || null == key )
                return null;

            var v;

            // 仅当元素节点才有具有attribute
            if ( el.nodeType !== 1 )
                return null;

            if ( el.hasAttribute && el.hasAttribute( key ) || el.getAttribute( key ) != null )
                v = el.getAttribute( key );
            else
                v = el[ key ];

            if ( arguments.length > 2 ) {
                if ( null == val )
                    el.removeAttribute( key );
                else
                    el.setAttribute( key, val );
            }
            return v;
        },

        /**
         * 创建html元素，接受一个html的字符串形式
         * 
         * <code>
         * var div = Fan.dom.create( '<div>Fan.dom.' + '   <span onclick="window.location=\'/fan/dom/create\'">' + '      create(String/elementhtml)' + '   </span>' + '</div>' );
         * </code>
         */
        create : (function() {
            var div, ul, tbl, row, sel;
            return function( html ) {
                var type = Fan.type( html );
                if ( type == 'string' ) {
                    var tag = '';
                    html.replace( /^\s*[<]([^>\s]+)([>]|\s)/, function( v1, v2, v3 ) {
                        // logger.debug('_' + v2 + '_');
                        tag = v2;
                    } );
                    switch ( tag.toLowerCase() ) {
                    case 'td' :
                        if ( !row ) {
                            row = document.createElement( 'tr' );
                            row.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        row.innerHTML = html;
                        html = [];
                        while ( row.cells[ 0 ] ) {
                            html.push( row.cells[ 0 ] );
                            row.removeChild( row.cells[ 0 ] );
                        }
                        break;
                    case 'tr' :
                        if ( !tbl ) {
                            tbl = document.createElement( 'table' );
                            tbl.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        tbl.innerHTML = '<tbody>' + html + '</tbody>';
                        html = [];
                        while ( tbl.rows[ 0 ] ) {
                            html.push( tbl.rows[ 0 ] );
                            tbl.removeChild( tbl.rows[ 0 ] );
                        }
                        break;
                    case 'tbody' :
                        if ( !tbl ) {
                            tbl = document.createElement( 'table' );
                            tbl.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        tbl.innerHTML = html;
                        html = [];
                        html.push( tbl.getElementsByTagName( "tbody" )[ 0 ] );
                        html[ 0 ] && tbl.removeChild( html[ 0 ] );
                        break;
                    case 'option' :
                        if ( !sel ) {
                            sel = document.createElement( 'select' );
                            sel.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        sel.innerHTML = html;
                        html = [];
                        while ( sel.firstChild ) {
                            html.push( sel.firstChild );
                            sel.removeChild( sel.firstChild );
                        }
                        break;
                    case 'li' :
                        if ( !ul ) {
                            ul = document.createElement( 'ul' );
                            ul.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        ul.innerHTML = html;
                        html = [];
                        while ( ul.firstChild ) {
                            html.push( ul.firstChild );
                            ul.removeChild( ul.firstChild );
                        }
                        break;
                    default :
                        if ( !div ) {
                            div = document.createElement( 'div' );
                            div.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        div.innerHTML = html;
                        html = [];
                        while ( div.firstChild ) {
                            html.push( div.firstChild );
                            div.removeChild( div.firstChild );
                        }
                        break;
                    }
                    return Fan.isArray( html ) && html.length > 1 ? html : html[ 0 ];
                } else if ( type == 'element' ) {
                    return html;
                } else
                    return null;
            };
        })(),

        /**
         * @method show() 显示元素
         * @return this
         */
//        show : function( el ) {
//            el && (el.style.display = '');
//        },

        /**
         * @method hide() 隐藏元素
         * @return this
         */
//        hide : function( el ) {
//            el && (el.style.display = 'none');
//        },

        // 获取元素的所有子节点，返回节点数组
//        subNodes : function( el ) {
//            return el.childNodes;
//        },

        // 获取元素所有的attribute
//        attrs : function( el ) {
//            return el.attributes;
//        },

        // 获取元素内最后一个子节点
//        last : function( el ) {
//            return el.lastChild;
//        },

        // 获取元素内第一个子节点
//        first : function( el ) {
//            return el.firstChild;
//        },

        // 获取当前元素的下一个元素
//        next : function( el ) {
//            return el.nextSibling;
//        },

        // 获取当前元素的上一个元素
//        prev : function( el ) {
//            return el.previousSibling;
//        },

        // 获取当前元素的父级节点
//        parent : function( el ) {
//            return el.parentNode;
//        },

        /**
         * @method checkIn(parentEl, subEl, ref) 检测元素是否存在包含关系,Array ref外部引用数据，传递一个空数组，方便把更多细节结果传递出去
         * 
         * <pre>
         * 1、parentEl - 父元素 
         * 2、subEl - 子元素
         * 3、refArray - 数组形式表示从父元素到子元素的层次，数组中每一项对应一个dom层次
         * </pre>
         * 
         * @return {boolean} 返回是否包含
         */
        checkIn : function( parentEl, subEl, refArray ) {
            if ( !parentEl || !subEl )
                return false;
            refArray && refArray.push( subEl );
            subEl = subEl.parentNode;
            var r;
            while ( !r && subEl ) {
                r = subEl == parentEl;
                refArray && refArray.push( subEl );
                subEl = subEl.parentNode;
            }
            parentEl = null, subEl = null, refArray = null;
            return !!r;
        },

        /**
         * @method contains(parentEl, subEl) 检测元素是否存在包含关系, 自身不算
         * 
         * <pre>
         * 1、parentEl - 父元素 
         * 2、subEl - 子元素
         * </pre>
         * 
         * @return {boolean} 返回是否包含
         */
        contains : function( parentEl, subEl ) {
            if ( !subEl || !parentEl )
                return false;
            if ( parentEl.contains && Fan.browser.engine.webkit > 522 )
                return parentEl.contains( subEl ) && parentEl != subEl;
            else if ( parentEl.compareDocumentPosition )
                return !!(parentEl.compareDocumentPosition( subEl ) & 16);
            else
                return this.checkIn( parentEl, subEl, null );
        },

        /**
         * 获取元素的绝对位置x/y和相对位置xx/yy
         * 
         * @param el
         *            被获取未知的元素，或元素的ID
         * @param relative
         *            是否仅获取相对位置, 默认false
         * @return {x, y, xx, yy}
         */
        getXY : function( el, relative ) {
            // 取得x坐标
            var x = el.offsetLeft, xx = x, r = /\babsolute\b|\brelative\b/i, flg = 1;
            var tmp = el.offsetParent;
            while ( null != tmp ) {
                if ( flg && tmp.style && r.test( this.getCss( tmp, 'position' ) ) ) {
                    flg = 0;
                    xx = x;
                    if ( relative ) {
                        x = 0;
                        break;
                    }
                }
                x += tmp.offsetLeft;
                tmp = tmp.offsetParent;
            }
            flg = 1;
            // 取得y坐标
            var y = el.offsetTop, yy = y;
            tmp = el.offsetParent;
            while ( null != tmp ) {
                if ( flg && tmp.style && r.test( this.getCss( tmp, 'position' ) ) ) {
                    flg = 0;
                    yy = y;
                    if ( relative ) {
                        y = 0;
                        break;
                    }
                }
                y += tmp.offsetTop;
                tmp = tmp.offsetParent;
            }
            return {
                x : x,
                y : y,
                xx : xx,
                yy : yy
            };
        },

        /**
         * @method height(element, height) 设置或获取元素的高度值
         * @return offsetHeight
         */
//        height : function( el, h ) {
//            0 <= h && (el.style.height = h + 'px');
//            return el.offsetHeight;
//        },

        /**
         * @method width(element, width) 设置或获取元素的宽度值
         * @return offsetHeight
         */
//        width : function( el, w ) {
//            0 <= w && (el.style.width = w + 'px');
//            return el.offsetWidth;
//        },

        /**
         * 设置dom上的cssText
         */
        css : function( el, cssText, val ) {
            // 如果是json对象的样式，则解析并组成字符串形式
            if ( val != null ) {
                cssText += ':' + val + ';';
            } else if ( cssText && typeof cssText == 'object' ) {
                var t = [];
                Fan.each( cssText, function( k ) {
                    t.push( k + ':' + this );
                } );
                cssText = t.join( ';' );
                t = null;
            }
            el.style.cssText = el.style.cssText + ';' + cssText;
        },

        /**
         * @method checkCollision(element1, element2 [,depth] [,depthArray] [,depthX [,depthY]]) 检测两个元素是否碰撞
         * depth为碰撞深度:{x, y} / [x[, y]] / x / x,y
         * @return boolean
         */
        checkCollision : function( el1, el2, deX, deY ) {
            var de = [ 0, 0 ];
            if ( null != deX )
                if ( Fan.isNumber( deX ) ) {
                    de[ 0 ] = deX, de[ 1 ] = deY || 0;
                } else if ( Fan.isArray( deX ) ) {
                    de[ 0 ] = deX[ 0 ] || 0, de[ 1 ] = deX[ 1 ] || 0;
                } else {
                    de[ 0 ] = deX.x || 0, de[ 1 ] = deX.y || 0;
                }

            // 取得双方xy坐标
            var xy1 = this.getXY( el1 );
            var xy2 = this.getXY( el2 );
            // 计算双方各一半的宽高
            var l1 = {
                x : this.width( el1 ) / 2,
                y : this.height( el1 ) / 2
            };
            var l2 = {
                x : this.width( el2 ) / 2,
                y : this.height( el2 ) / 2
            };
            // 计算双方中心点坐标
            var o1 = {
                x : xy1.x + l1.x,
                y : xy1.y + l1.y
            };
            var o2 = {
                x : xy2.x + l2.x,
                y : xy2.y + l2.y
            };
            // 计算双方的中心点坐标x和y的距离
            var x = o1.x - o2.x, y = o1.y - o2.y;
            x = x < 0 ? -x : x;
            y = y < 0 ? -y : y;
            // 判断双方最短距离：当连心线距离小于双方最短距离（el1/2 + el2/2），则相碰撞
            return ((x < l1.x + l2.x - de[ 0 ]) && (y < l1.y + l2.y - de[ 1 ]));
        },

        /**
         * @method checkMouseCollision(element, event [,depth] [,depthArray] [,depthX [,depthY]]) 检测鼠标是否碰撞了指定元素
         * depth为碰撞深度:{x, y} / [x[, y]] / x / x,y
         * @return boolean
         */
        checkMouseCollision : function( el1, evt, deX, deY ) {
            var de = [ 0, 0 ];
            if ( null != deX )
                if ( Fan.isNumber( deX ) ) {
                    de[ 0 ] = deX, de[ 1 ] = deY || 0;
                } else if ( Fan.isArray( deX ) ) {
                    de[ 0 ] = deX[ 0 ] || 0, de[ 1 ] = deX[ 1 ] || 0;
                } else {
                    de[ 0 ] = deX.x || 0, de[ 1 ] = deX.y || 0;
                }

            // 取得双方xy坐标
            var xy1 = this.getXY( el1 );
            var xy2 = Fan.Event.getXY( evt );
            // 计算双方各一半的宽高
            var l1 = {
                x : this.width( el1 ) / 2,
                y : this.height( el1 ) / 2
            };
            var l2 = {
                x : 1 / 2,
                y : 1 / 2
            };
            // 计算双方中心点坐标
            var o1 = {
                x : xy1.x + l1.x,
                y : xy1.y + l1.y
            };
            var o2 = {
                x : xy2.x + l2.x,
                y : xy2.y + l2.y
            };
            // 计算双方的中心点坐标x和y的距离
            var x = o1.x - o2.x, y = o1.y - o2.y;
            x = x < 0 ? -x : x;
            y = y < 0 ? -y : y;
            // 判断双方最短距离：当连心线距离小于双方最短距离（el1/2 + el2/2），则相碰撞
            return ((x < l1.x + l2.x - de[ 0 ]) && (y < l1.y + l2.y - de[ 1 ]));
        },
        
        /**
         * @method checkMousedownInScroll(element, event)
         * 检测鼠标是否按住了滚动条
         * @return object or null, object:{right:true,down:false}
         */
        checkMousedownInScroll : function( elem, mouseEvent ) {
            var inRightScroll, inDwonScroll;
            
            // 检测是否存在滚动条
            if ( elem.offsetWidth > elem.clientWidth ) {
                var eXY = Fan.dom.getXY( elem );
                var mXY = Fan.Event.getXY( mouseEvent );
                var scrollWidth = elem.offsetWidth - elem.clientWidth;
                var minX = eXY.x + elem.offsetWidth - scrollWidth;
                var maxX = eXY.x + elem.offsetWidth;
                
                // 判断鼠标是否在右侧滚动条上
                inRightScroll = minX < mXY.x && mXY.x < maxX;
            }
            if ( !inRightScroll && elem.offsetHeight > elem.clientHeight ) {
                var eXY = Fan.dom.getXY( elem );
                var mXY = Fan.Event.getXY( mouseEvent );
                var scrollHeight = elem.offsetHeight - elem.clientHeight;
                var minY = eXY.y + elem.offsetHeight - scrollHeight;
                var maxY = eXY.y + elem.offsetHeight;
                
                // 判断鼠标是否在下侧滚动条上
                inDwonScroll = minY < mXY.y && mXY.y < maxY;
            }
            
            return (inRightScroll || inDwonScroll) ? {
                right : !!inRightScroll,
                dwon : !!inDwonScroll
            } : null;
        },

        /**
         * 移动元素 将指定元素移动到指定坐标位置
         * 
         * @param el
         *            需要移动的html元素
         * @param x,y
         *            新的坐标位置，对应el的左上角
         * @param isMust
         *            是否强制移动，取值为true时，会更改元素的样式:position='absolute'
         */
        // 样式存在相对和绝对，需要判断更准确
//        moveTo : function( el, x, y, isMust ) {
//            isMust && (el.style.position = 'absolute');
//            el.style.left = x + 'px';
//            el.style.top = y + 'px';
//        },

//        moveBy : function( el, x, y, isMust ) {
//            isMust && (el.style.position = 'absolute');
//            var xy = this.getXY( el );
//            el.style.left = (xy.xx + x) + 'px';
//            el.style.top = (xy.yy + y) + 'px';
//        },

        /**
         * 动态添加style标签，接受一个字符串形式的style样式表的所有内容
         * 
         * 如： div {margin:0px;} table {border:0px;}
         * 
         * @param styleString
         *            字符串形式的样式表
         * @param id
         *            给样式表指定id，不建议指定id，IE中暂不兼容，不允许更改样式表id
         * @return Style元素
         */
        addStyle : function( styleString, id ) {
            var style;
            if ( Fan.ie ) {
                style = document.createStyleSheet();
                style.cssText = styleString;
            } else {
                style = document.createElement( 'style' );
                style.type = 'text/css';
                style.innerHTML = styleString;

                var head = document.getElementsByTagName( 'head' )[ 0 ] || document.documentElement;
                head.insertBefore( style, head.firstChild );
                id && (style.id = id + '');
            }
            return style;
        },

        /**
         * 从DOM中删除一个style元素
         * 
         * @param style
         *            style的id或style元素
         */
        removeStyle : function( style ) {
            if ( null == style )
                return null;

            // 取得style
            style = typeof style == 'string' ? document.getElementById( style ) : style;
            this.remove( style );
        },

        /**
         * @method addClass(element, className) 增加类样式引用 className:样式名称
         */
        addClass : function( el, className ) {
            var r = new RegExp( '(\\s+|^)' + className + '(\\s+|$)', 'gi' );
            r.lastIndex = 0;
            !r.test( el.className ) && (el.className = (el.className + ' ' + className).trim());
        },

        /**
         * @method removeClass(element, className) 删除类样式引用 className:样式名称
         */
        removeClass : function( el, className ) {
            var r = new RegExp( '(\\s+|^)' + className + '(\\s+|$)', 'gi' );
            r.lastIndex = 0;
            r.test( el.className ) && (el.className = el.className.replace( r, ' ' ).trim());
        },

        /**
         * @method hasClass(element, className) 判断元素是否存在指定class样式 className:样式名称
         */
        hasClass : function( el, className ) {
            var r = new RegExp( '(\\s+|^)' + className + '(\\s+|$)', 'gi' );
            r.lastIndex = 0;
            return r.test( el.className );
        },

        /**
         * @method alterClass(element, className) class样式交替，有则删，无则加 className:样式名称
         */
        alterClass : function( el, className ) {
            var r = new RegExp( '(\\s+|^)' + className + '(\\s+|$)', 'gi' );
            r.lastIndex = 0;
            if ( r.test( el.className ) )
                this.removeClass( el, className );
            else
                this.addClass( el, className );
        },

        // 删除指定的html元素
        remove : (function() {
            var d = document.createElement( 'div' );
            return function( el ) {
                if ( el.parentNode ) {
                    el.parentNode.removeChild( el );
                    if ( Fan.ie ) {
                        d.appendChild( el );
                        d.innerHTML = '';
                    }
                }
            };
        })(),

        // 返回元素指定的样式值 styleName 必须为驼峰风格
        // TODO 部分样式名和关键字冲突，暂未处理
        getCss : function( el, styleName ) {
            var style;
            if ( (style = el.style[ styleName ]) ) {
            } else if ( document.defaultView && document.defaultView.getComputedStyle ) {
                styleName = styleName.replace( /([A-Z])/g, '-$1' ).toLowerCase();
                style = document.defaultView.getComputedStyle( el, null );
                style = style ? style.getPropertyValue( styleName ) : '';
            } else if ( el.currentStyle ) {
                style = el.currentStyle[ styleName ];
            }

            style = style == null ? '' : style;

            switch ( style ) {
            case 'auto' :
                switch ( styleName ) {
                case 'width' :
                    style = el.offsetWidth + 'px';
                case 'height' :
                    style = el.offsetHeight + 'px';
                    break;
                }
                break;
            }

            return style;
        },

        // 默认的公用动作，支持格式：(数值[单位]) 如123, 123px, 123em, 23pt,
        // 默认单位(px)
        _defaultAction : function( el, endValue, totalStep, property ) {
            var start = dom.getCss( el, property );
            start = parseFloat( start );

            var end = parseFloat( endValue );
            var unit = (endValue + '').replace( /[-\d]/g, '' ) || 'px';
            var unitFn = Fan.proxy( function( curr ) {
                return Math.ceil( curr ) + this;
            }, unit );

            var initAction = dom.initAction( property, start, end, unitFn, totalStep );
            start = end = unit = unitFn = el = endValue = totalStep = property = null;

            try {
                return initAction;
            } finally {
                initAction = null;
            }
        },

        // 背景色渐变+背景透明渐变
        _backgroundColorAction : function( el, endValue/* rgb(x,x,x)|rgba(x,x,x,x) */, totalStep, property ) {
            var old = dom.getCss( el, property );
            el = null;
            old = old.replace( /[^\d,\.]/g, '' ).split( ',' );

            var end = endValue; // 需要转换成rgb(x,x,x)/rgba(x,x,x,x)
            var prefix = /^(rgba|rgb)/.exec( end )[ 1 ]; // rgb/rgba
            end = end.replace( /[^\d,\.]/g, '' ).split( ',' );

            var regRGBA = /rgba/;

            var cssTextArr = [];
            // 通过组装单位时，将值传出来赋予cssTextArr数组中，返回虚假的内容
            var unitR = function( curr ) {
                cssTextArr[ 0 ] = Math.ceil( curr );
                return '';
            }, unitG = function( curr ) {
                cssTextArr[ 1 ] = Math.ceil( curr );
                return '';
            }, unitB = function( curr ) {
                cssTextArr[ 2 ] = Math.ceil( curr );
                return '';
            }, unitA = function( curr ) {
                cssTextArr[ 3 ] = curr;
                return '';
            };

            var startR = parseInt( old[ 0 ] ), startG = parseInt( old[ 1 ] ), startB = parseInt( old[ 2 ] ), startA = regRGBA.test( prefix ) && parseFloat( old[ 3 ] );
            startA = startA != 0 && !startA ? 1 : startA;

            var endR = parseInt( end[ 0 ] ), endG = parseInt( end[ 1 ] ), endB = parseInt( end[ 2 ] ), endA = regRGBA.test( prefix ) && parseFloat( end[ 3 ] );

            var r = dom.initAction( property + '_r', startR, endR, unitR, totalStep ), g = dom.initAction( property + '_g', startG, endG, unitG, totalStep ), b = dom.initAction( property + '_b',
                    startB, endB, unitB, totalStep ), a = regRGBA.test( prefix ) && dom.initAction( property + '_a', startA, endA, unitA, totalStep );

            return {
                step : function( currStep, cssTextArray ) {
                    var overCount = 0, tmp = [];

                    r.step( currStep, tmp ) && overCount++;
                    g.step( currStep, tmp ) && overCount++;
                    b.step( currStep, tmp ) && overCount++;
                    regRGBA.test( prefix ) && a.step( currStep, tmp ) && overCount++;

                    var rgba = prefix + '(' + cssTextArr.join( ',' ) + ')';
                    cssTextArray.push( property.replace( /([A-Z])/g, '-$1' ).toLowerCase() + ':' + rgba );

                    // logger.warn(property.replace(/([A-Z])/g,
                    // '-$1').toLowerCase() + ':' + rgba);

                    // 执行完毕，清空所有临时内容
                    if ( a && overCount >= 4 || !a && overCount >= 3 ) {
                        cssTextArr = tmp = overCount = rgba = prefix = null;
                        startR = startG = startB = startA = null;
                        unitR = unitG = unitB = unitA = null;
                        endR = endG = endB = endA = null;
                        old = end = regRGBA = null;
                        r = g = b = a = null;
                        return true;
                    }
                },
                stop : function() {
                    cssTextArr = prefix = r = g = b = a = null;
                    startR = startG = startB = startA = null;
                    unitR = unitG = unitB = unitA = null;
                    endR = endG = endB = endA = null;
                    old = end = regRGBA = null;
                }
            };
        },

        // 滚动条滑动动作
        _scrollAction : function( el, endValue, totalStep, property ) {
            var start = el[ property ], end = endValue, unitFn = '';
            var action = dom.initAction( property, start, end, unitFn, totalStep );
            return action;
        },

        /**
         * 定制各种样式的动作处理方式
         */
        initActionHandler : function() {

            // 属性动作对应处理
            this.propAction = {
                // 无效的属性，用于测试生成连续动作点，并在step中使用这些点，达到任意动画
                'test' : this._testAction,

                scrollTop : this._scrollAction,
                scrollLeft : this._scrollAction
            };

            // css样式动作对应处理
            this.cssAction = {
                // 支持动作的样式
                width           : this._defaultAction,
                height          : this._defaultAction,
                top             : this._defaultAction,
                left            : this._defaultAction,
                right           : this._defaultAction,
                bottom          : this._defaultAction,
                marginLeft      : this._defaultAction,
                marginTop       : this._defaultAction,
                marginRight     : this._defaultAction,
                marginBottom    : this._defaultAction,
                paddingLeft     : this._defaultAction,
                paddingTop      : this._defaultAction,
                paddingRight    : this._defaultAction,
                paddingBottom   : this._defaultAction,

                backgroundColor : this._backgroundColorAction,
                color           : this._backgroundColorAction,
                fontSize        : this._defaultAction,

                // 暂不支持动作的样式
                padding         : false,
                margin          : false,
                border          : false,
                borderLeft      : false,
                borderTop       : false,
                borderRight     : false,
                borderBottom    : false,
                background      : false

            // 背景定位
            // ...
            };
        }

    };

    // 公布到Fan上
    Fan.anim = Anim.anim;
    Fan.stopAnim = Anim.stop;
    
})( Fan );


// Lang Class

/**
 * 所有Fan类都继承自Fan.Object类。 Fan.Object继承自原生Object
 * @class Fan.Object
 */
Fan.Class( 'Fan.Object', 'Object', function() {
    /* [system embedded code] */
    var Super = null, This = null;
    this.Object = this.Object || function() {
        Super();
    };
    this[ KEYS.SET_SUPER ] = function( s ) {
        Super = s;
        This = s ? s[ KEYS.THIS ] : null;
    };
    this[ KEYS.GET_SUPER ] = function( b ) {
        return b ? Super[ KEYS.SUPER ] : Super;
    };
    /* [system embedded code] */
} );

// override toString
Fan.Object.prototype.toString = function() {
    return '[object ' + this.getClass().className + ']';
};

// 对象销毁,所有从当前类继承下去的子类,皆可调用此方法销毁对象
Fan.Object.prototype.destroy = function() {
    // 启动一个对象深度销毁任务，必须用延迟方式, 避免销毁复杂对象时的阻塞时间过长
    var me = this;
    setTimeout( function () {
        Fan.ClassManager.destroyObject( me );
        me = null;
    }, 0 );
};


/**
 * @class 浏览器封装类, 单例 包含系统平台信息，展示引擎及版本
 */
Fan.Package( 'Fan.core.bom' );
Fan.Class( 'Fan.core.bom.Browser', function() {
    
    /**
     * @property urlRequest url请求对象，处理请求url上的参数
     */
    this.urlRequest = null;

    /**
     * @property selectorOpened 是否启用了浏览器内置的css选择器
     */
    this.selectorOpened = null;

    /**
     * @property name 浏览器名称
     */
    this.name = null;

    /**
     * @property version 浏览器版本
     */
    this.version = null;

    this.ver = null;

    /**
     * @property engine 呈现引擎
     */
    this.engine = null;

    /**
     * @property os 系统平台
     */
    this.os = null;

    /**
     * @method Browser() 构造方法，该方法会做单例检测
     */
    this.Browser = function() {
        Super();

        if ( Fan.browser ) {
            return Fan.browser;
        }

        // 取得url参数
        function f( url ) {
            var urlParams = url || window.location.search + '';
            var idx = urlParams.indexOf( '?' );
            var map = Fan.newMap();
            if ( -1 != idx ) {
                urlParams = urlParams.substring( idx + 1 );
                urlParams = urlParams.trim();
                if ( '' == urlParams ) {
                    return map;
                }
                var pms = urlParams.split( '&' );
                for ( var i = 0; i < pms.length; ++i ) {
                    var p = pms[ i ];
                    p = p.split( '=' );
                    p[ 0 ] = (p[ 0 ] + '').trim();
                    if ( '' !== p[ 0 ] ) {
                        map.put( p[ 0 ], p[ 1 ] ? (p[ 1 ] + '').trim() : '' );
                    }
                }
                return map;
            } else
                return map;
        };

        Fan.apply( f, {
            get : function( paramName ) {
                if ( !f.map ) {
                    f.map = f() || Fan.newMap();
                }
                return f.map.get( paramName );
            }
        } );

        this.urlRequest = f;
        this.selectorOpened = true;
        this.name = Fan.browserName;
        this.version = this.ver = Fan.browserVersion;

        // 显示引擎
        this.engine = {
            ie : 0,
            gecko : 0,
            webkit : 0,
            khtml : 0,
            opera : 0,
            ver : null
        };

        // 系统平台
        this.os = {
            win : false,
            mac : false,
            x11 : false,

            iphone : false,
            ipod : false,
            nokiaN : false,
            winMobile : false,
            macMobile : false,

            // 游戏系统
            wii : false,
            ps : false
        };

        // 检测浏览器使用的显示引擎
        var ua = navigator.userAgent;
        switch ( true ) {
        case !!window.opera :
            this.engine.ver = this.ver = this.version = Fan.opera = Fan.browserVersion = window.opera.version;
            this.engine.opera = parseFloat( this.engine.ver );
            break;

        case /AppleWebKit\/(\S+)/.test( ua ) :
            this.engine.ver = RegExp[ '$1' ];
            this.engine.webkit = parseFloat( this.engine.ver );

            if ( !Fan.chrome && !Fan.safari ) {
                if ( this.engine.webkit < 100 ) {
                    this.ver = 1;
                } else if ( this.engine.webkit < 312 ) {
                    this.ver = 1.2;
                } else if ( this.engine.webkit < 412 ) {
                    this.ver = 1.3;
                } else
                    this.ver = 2;
            }
            break;

        case /KHTML\/(\S+)/.test( ua ) || /Konqueror\/([^;]+)/.test( ua ) :
            this.engine.ver = this.ver = RegExp[ '$1' ];
            this.engine.khtml = Fan.konq = parseFloat( this.engine.ver );
            break;

        case /rv:([^\)]+)\) Gecko\/\d{8}/.test( ua ) :
            this.engine.ver = RegExp[ '$1' ];
            this.engine.gecko = parseFloat( this.engine.ver );
            break;
        }

        // 检测平台
        var p = navigator.platform;
        this.os.win = p.indexOf( 'Win' ) == 0;
        this.os.mac = p.indexOf( 'Mac' ) == 0;
        this.os.x11 = (p == 'X11') || p.indexOf( 'Linux' ) == 0;

        // 检测windows平台
        if ( this.os.win ) {
            if ( /Win(?:dows )?([^do]{2})\s?(\d+\.\d+)?/.test( ua ) ) {
                if ( RegExp[ '$1' ] == 'NT' ) {
                    switch ( RegExp[ '$2' ] ) {
                    case '5.0' :
                        this.os.win = '2000';
                        break;

                    case '5.1' :
                        this.os.win = 'XP';
                        break;

                    case '6.0' :
                        this.os.win = 'Vista';
                        break;

                    case '6.1' :
                        this.os.win = '7';
                        break;

                    case '6.2' :
                        this.os.win = '8';
                        break;

                    default :
                        this.os.win = 'NT';
                        break;
                    }
                } else if ( RegExp[ '$1' ] == '9x' ) {
                    this.os.win = 'ME';
                } else
                    this.os.win = RegExp[ '$1' ];
            }
        }

        // 移动设备检测
        this.os.iphone = ua.indexOf( 'iPhone' ) > -1;
        this.os.ipod = ua.indexOf( 'ipod' ) > -1;
        this.os.nokiaN = ua.indexOf( 'NokiaN' ) > -1;
        this.os.winMobile = this.os.win == 'CE';
        this.os.mac = this.os.iphone || this.os.ipod;

        // 游戏平台
        this.os.wii = ua.indexOf( 'Wii' ) > -1;
        this.os.ps = /playstation/i.test( ua );
    };

    /**
     * @method openSelector() 开启浏览器内置的选择器，需要浏览器支持，默认为开启状态；在使用Fan选择器时会优先使用内置选择器
     */
    this.openSelector = function() {
        this.selectorOpened = true;
    };

    /**
     * @method closeSelector() 关闭浏览器内置的选择器，在使用Fan选择器时，仅使用Fan的选择器实现，性能会有所影响
     */
    this.closeSelector = function() {
        this.selectorOpened = false;
    };

    /**
     * @method querySelector(selector, dom) 使用浏览器css选择器，返回第一个查找到的结果
     */
    this.querySelector = function( s, d ) {
        d = d || document;
        if ( this.selectorOpened && d.querySelector ) {
            return d.querySelector( s );
        } else
            return false;
    };

    /**
     * @method querySelectorAll(selector, dom) 使用浏览器css选择器，返回查询到的所有结果
     */
    this.querySelectorAll = function( s, d ) {
        d = d || document;
        if ( this.selectorOpened && d.querySelectorAll ) {
            return d.querySelectorAll( s );
        } else
            return false;
    };

    // 函数:获取客户端视窗可见区域大小，不包含滚动区域
    // return {w,h}
    this.getBodyWH = function() {
        var dom = document.documentElement;
        return {
            w : dom.clientWidth || dom.scrollWidth,
            h : dom.clientHeight || dom.scrollHeight
        };
    };

    // 函数:获取文档总高度，包含滚动区域
    // return {w,h}
    this.getBodyAndScrollWH = function() {
        var body = document.body;
        var html = document.documentElement;
        return {
            w : Math.max( body.scrollWidth, body.clientWidth, html.scrollWidth, html.scrollWidth ),
            h : Math.max( body.scrollHeight, body.clientHeight, html.scrollHeight, html.clientHeight )
        };
    };

    // 函数:获得浏览器可见区域的左上角坐标xy
    // return {x,y}
    this.getBrowserLeftTop = function() {
        var doc = document.documentElement, bd = document.body;
        return {
            x : doc.scrollLeft || bd.scrollLeft,
            y : doc.scrollTop || bd.scrollTop
        };
    };

    // 函数:获得浏览器可见区域的右上角坐标xy
    // return {x,y}
    this.getBrowserRightTop = function() {
        return {
            x : this.getBodyAndScrollWH().w,
            y : document.documentElement.scrollTop || document.body.scrollTop
        };
    };

    // 函数:获得浏览器可见区域的左下角坐标xy
    // return {x,y}
    this.getBrowserLeftBottom = function() {
        return {
            x : document.documentElement.scrollLeft || document.body.scrollLeft,
            y : this.getBodyAndScrollWH().h
        };
    };

    // 函数:获得浏览器可见区域的右下角坐标xy
    // return {x,y}
    this.getBrowserRightBottom = function() {
        var wh = this.getBodyAndScrollWH();
        return {
            x : wh.w,
            y : wh.h
        };
    };

    // 函数:添加页面地址到收藏夹, 返回:true|false 表示成功与否
    this.addFavorite = function( url, title ) {
        try {
            if ( Fan.ie ) {
                window.external.AddFavorite( url, title );
                return true;
            } else if ( window.sidebar ) {
                window.sidebar.addPanel( title, url, '' );
                return true;
            }
        } catch ( e ) {
            logger.error( '收藏失败, 请使用Ctrl + D快捷键收藏.' );
        }
        return false;
    };

    // 函数:设置指定页面url为首页, 返回:true|false 表示成功与否
    var aTag;
    this.setHomePage = function( url ) {
        try {
            !aTag && (aTag = Fan.newElement( 'a' ));
            aTag.style.behavior = 'url(#default#homepage)';
            aTag.setHomePage( url );
            return true;
        } catch ( e ) {
            if ( window.netscape ) {
                try {
                    netscape.security.PrivilegeManager.enablePrivilege( 'UniversalXPConnect' );
                } catch ( e ) {
                    alert( '此操作被浏览器拒绝！\n请在浏览器地址栏输入“about:config”并回车\n然后将 [signed.applets.codebase_principal_support]的值设置为\'true\',双击即可。' );
                }
                try {
                    var prefs = Components.classes[ '@mozilla.org/preferences-service;1' ].getService( Components.interfaces.nsIPrefBranch );
                    prefs.setCharPref( 'browser.startup.homepage', url );
                    return true;
                } catch ( e ) {
                    logger.error( '设置主页失败, ' + e );
                }
            }
        }
        return false;
    };

    /* [system embedded code] */
    var Super = null, This = null;
    this.Browser = this.Browser || function() {
        Super();
    };
    this[ KEYS.SET_SUPER ] = function( s ) {
        Super = s;
        This = s ? s[ KEYS.THIS ] : null;
    };
    this[ KEYS.GET_SUPER ] = function( b ) {
        return b ? Super[ KEYS.SUPER ] : Super;
    };
    /* [system embedded code] */

} );

// 获得一个实例，该实例为单例，重复调用将返回同一个实例
Fan.core.bom.Browser.getInstance = function() {
    if ( Fan.browser instanceof Fan.core.bom.Browser )
        return Fan.browser;
    return (Fan.browser = new Fan.core.bom.Browser());
};

// 创建一个浏览器单例对象
Fan.browser = Fan.core.bom.Browser.getInstance();


/**
 * 字符串辅助类
 * @class
 */
Fan.Class( 'Fan.String', function() {
    /* [system embedded code] */
    var Super = null, This = null;
    this.String = this.String || function() {
        Super();
    };
    this[ KEYS.SET_SUPER ] = function( s ) {
        Super = s;
        This = s ? s[ KEYS.THIS ] : null;
    };
    this[ KEYS.GET_SUPER ] = function( b ) {
        return b ? Super[ KEYS.SUPER ] : Super;
    };
    /* [system embedded code] */

    var _str;
    this.String = function( str ) {
        // 字符串
        if ( Fan.isString( str ) ) {
            _str = str;
        } 
        // 字节数组
        else if ( Fan.isArray( str ) ) {
            var bytes = str;
            str = [];
            for( var i = 0, len = bytes.length; i < len; i++ ) {
                str.push( String.fromCharCode( bytes[ i ] ) );
            }
            _str = str.join( '' );
        }
        // 其他参数
        else {
            _str = str != null ? str + '' : '';
        }
    };
    
    this.getBytes = function( charset ) {
        return Fan.String.toBytes( _str, charset );
    };
    
    this.toString = function() {
        return _str;
    };
    
    this.trim = function() {
        return Fan.trim( _str );
    };
} );
Fan.String.prototype.toString = function() {
    return '[object ' + this.getClass().className + ']';
};

(function() {
    // 编码器
    var encoders = {};
    
    // 解码器
    var decoders = {};
    
    /**
     * 增加一个编码器
     * @param charsetName - 编码类型
     * @param encoderFn - 进行编码的处理函数, 该函数接受一个需要被编码的字符原串
     * @returns {String} 返回编码后的字符串
     */
    Fan.String.addEncoder = function ( charsetName, encoderFn ) {
        encoders[ charsetName.toLowerCase() ] = encoderFn;
    };
    
    /**
     * 增加一个解码器
     * @param charsetName - 解码类型
     * @param decoderFn - 进行解码的处理函数, 该函数接受一个需已被编码的字符串
     * @returns {String} 返回解码后的字符串
     */
    Fan.String.addDecoder = function ( charsetName, decoderFn ) {
        decoders[ charsetName.toLowerCase() ] = decoderFn;
    };
    
    // 添加默认的编码器
    Fan.String.addEncoder( 'utf-8', function( str ) {
        str = str.replace( /\r\n/g, '\n' );
        var code = '';
        for ( var i = 0, len = str.length; i < len; ++i ) {
            var c = str.charCodeAt( i );
            switch ( true ) {
            case c < 128 :
                code += String.fromCharCode( c );
                break;
            case c > 127 && c < 2048 :
                code += (String.fromCharCode( (c >> 6) | 192 ) +
                        String.fromCharCode( (c & 63) | 128 ));
                break;
            default :
                code += (String.fromCharCode( (c >> 12) | 224 ) +
                        String.fromCharCode( ((c >> 6) & 63) | 128 ) +
                        String.fromCharCode( (c & 63) | 128 ));
                break;
            }
        }
        return code;
    } );
    
    // 添加默认的解码器
    Fan.String.addDecoder( 'utf-8', function( code ) {
        var str = '';
        var c1 = 0, c2 = 0, c3 = 0;
        for ( var i = 0, len = code.length; i < len; ++i ) {
            c1 = code.charCodeAt( i );
            switch ( true ) {
            case c1 < 128 :
                str += String.fromCharCode( c1 );
                break;
            case c1 > 191 && c1 < 224 :
                c2 = code.charCodeAt( i + 1 );
                str += String.fromCharCode( ((c1 & 31) << 6) | (c2 & 63) );
                i++;
                break;
            default :
                c2 = code.charCodeAt( i + 1 );
                c3 = code.charCodeAt( i + 2 );
                str += String.fromCharCode( ((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63) );
                i += 2;
                break;
            }
        }
        return str;
    } );
    
    /**
     * 获取字符串的字节长度
     * @param str - 原字符串
     * @param charset - 编码的格式
     * @returns {int} 字节长度
     */
    Fan.String.getStringByteLength = function( str, charset ) {
        // 先根据编码格式进行编码
        var encoder = encoders[ (charset || 'utf-8').toLowerCase() ];
        
        // 没有对应的编码格式, 则抛出异常
        if ( !Fan.isFunction( encoder ) ) {
            throw new Error( '[Error] - 未知的编码格式:' + charset );
        }
        
        str = encoder( str );
        
        return str.length;
    };
    
    /**
     * 字符串转字节数组
     * @param str - 原字符串
     * @param charset - 编码的格式
     * @returns {bytes} 字节数组
     */
    Fan.String.toBytes = function( str, charset ) {
        // 获取编码处理函数
        var encoder = encoders[ (charset || 'utf-8').toLowerCase() ];
        
        // 没有对应的编码格式, 则抛出异常
        if ( !Fan.isFunction( encoder ) ) {
            throw new Error( '[Error] - 未知的编码格式:' + charset );
        }
        
        // 先根据编码格式进行编码
        str = encoder( str );
        
        // 编码后再转成字节数组
        var bytes = [];
        for ( var i = 0, len = str.length; i < len; i++ ) {
            bytes.push( str.charCodeAt( i ) );
        }
        return str == null ? null : bytes;
    };

    /**
     * 字节数组转字符串
     * @param bytes - 字节数组
     * @param charset - 解码格式
     * @returns {String} 返回解码后字符串
     */
    Fan.String.bytesToString = function( bytes, charset ) {
        // 获取解码处理函数
        var decoder = decoders[ (charset || 'utf-8').toLowerCase() ];
        
        // 没有对应的编码格式, 则抛出异常
        if ( !Fan.isFunction( decoder ) ) {
            throw new Error( '[Error] - 未知的编码格式:' + charset );
        }
        
        var str = '';
        
        // 先将字节数组转成字符串
        for ( var i = 0, len = bytes.length; i < len; i++ ) {
            str += String.fromCharCode( bytes[ i ] );
        }
        
        // 再根据字符编码进行解码
        str = decoder( str );
        return str;
    };
})();


/**
 * DOM事件辅助类
 * @class
 */
Fan.Class( 'Fan.Event', function() {
    
    /**
     * @property clickCount 单击量
     */
    this.clickCount = null;

    /**
     * @property screenX 屏幕x坐标
     */
    this.screenX = null;

    /**
     * @property screenY 屏幕y坐标
     */
    this.screenY = null;

    /**
     * @property x 客户端x坐标
     */
    this.x = null;

    /**
     * @property y 客户端y坐标
     */
    this.y = null;

    /**
     * @property ctrlKey 是否在 Event 期间按下 control 键
     */
    this.ctrlKey = null;

    /**
     * @property altKey 是否在 Event 期间按下 alt 键
     */
    this.altKey = null;

    /**
     * @property shiftKey 是否在 Event 期间按下 shift 键
     */
    this.shiftKey = null;

    /**
     * @property metaKey 是否在 Event 期间按下 meta 键
     */
    this.metaKey = null;

    /**
     * @property button 鼠标按键：1左键，2右键，4中键，3左右键同按。firefox中 0代表左键，1代表中间键，2代表右键
     */
    this.button = null;

    /**
     * @property target 关联的事件目标
     */
    this.target = null;

    /**
     * @property event 原始事件对象
     */
    this.event = null;

    /**
     * @property type event类型
     */
    this.type = null;

    /**
     * @property leftKey 是否在 Event 期间按下 鼠标左键
     */
    this.leftKey = false;

    /**
     * @property rightKey 是否在 Event 期间按下 鼠标右键
     */
    this.rightKey = false;

    /**
     * @property middleKey 是否在 Event 期间按下 鼠标中键
     */
    this.middleKey = false;

    /**
     * @property fromElement 指在mouseover事件中鼠标移动过的文档元素
     */
    this.fromElement = null;

    /**
     * @property toElement 指在mouseout事件中鼠标移动到的文档元素
     */
    this.toElement = null;

    /**
     * @method Event(event) 构造方法, 需要一个原始事件
     */
    this.Event = function( e ) {
        Super();
        e = e || window.event;
        this.event = e;
        var xy = Fan.Event.getXY( e );
        this.x = xy.x;
        this.y = xy.y;
        this.type = e.type;
        this.button = e.button;
        this.altKey = e.altKey;
        this.ctrlKey = e.ctrlKey;
        this.shiftKey = e.shiftKey;
        this.fromElement = e.fromElement;
        this.toElement = e.toElement;
        this.target = e.srcElement || e.target;
        this.keyCode = Fan.Event.getKeyCode( this.event );
        this.detail = Fan.Event.getDetail( this.event );
        this.screenX = e.screenX;
        this.screenY = e.screenY;
        if ( Fan.ie ) {
            switch ( this.button ) {
            case 1 :
                this.leftKey = true;
                break;
            case 2 :
                this.rightKey = true;
                break;
            case 3 :
                this.leftKey = true;
                this.rightKey = true;
                break;
            case 4 :
                this.middleKey = true;
                break;
            case 5 :
                this.leftKey = true;
                this.middleKey = true;
                break;
            case 6 :
                this.rightKey = true;
                this.middleKey = true;
                break;
            case 7 :
                this.leftKey = true;
                this.rightKey = true;
                this.middleKey = true;
                break;
            }
        } else if ( Fan.firefox || Fan.chrome ) {
            switch ( this.which ) {
            case 1 :
                this.leftKey = true;
                break;
            case 2 :
                this.middleKey = true;
                break;
            case 3 :
                this.rightKey = true;
                break;
            }
        } else {
            switch ( this.button ) {
            case 0 :
                this.leftKey = true;
                break;
            case 1 :
                this.middleKey = true;
                break;
            case 2 :
                this.rightKey = true;
                break;
            case 3 :
                this.leftKey = true;
                this.rightKey = true;
                break;
            case 4 :
                this.leftKey = true;
                this.rightKey = true;
                this.middleKey = true;
                break;
            }
        }
    };

    /**
     * @method stop() 停止事件冒泡
     */
    this.stop = function() {
        Fan.Event.stop( this.event );
    };

    /**
     * @method cancel() 取消事件的默认执行
     */
    this.cancel = function() {
        Fan.Event.cancel( this.event );
    };
    
    /* [system embedded code] */
    var Super = null, This = null;
    this.Event = this.Event || function() {
        Super();
    };
    this[ KEYS.SET_SUPER ] = function( s ) {
        Super = s;
        This = s ? s[ KEYS.THIS ] : null;
    };
    this[ KEYS.GET_SUPER ] = function( b ) {
        return b ? Super[ KEYS.SUPER ] : Super;
    };
    /* [system embedded code] */
} );
Fan.Event.prototype.toString = function() {
    return '[object ' + this.getClass().className + ']';
};

/**
 * @staticMethod getXY(event) 获取事件上的鼠标xy坐标
 */
Fan.Event.getXY = function( e ) {
    e = e || window.event;
    if ( e )
        if ( e.pageX || e.pageY )
            return {
                x : e.pageX,
                y : e.pageY
            };
        else
            return {
                x : e.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft),
                y : e.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop)
            };
};

/**
 * @staticMethod getDetail(event) 获取滚轮滚动状态
 */
Fan.Event.getDetail = function( event ) {
    var detail = 0;
    if ( event.wheelDelta ) {
        detail = event.wheelDelta;
        if ( Fan.chrome || Fan.ie || Fan.opare < 10 ) {
            detail = -detail;
        }
    } else {
        detail = event.detail;
    }
    
    detail = detail < 0 ? -1 : 1;
    
    // 由于事件对象的原有属性是只读，通过添加一个私有属性detailOffset来解决兼容问题
    event.detailOffset = detail || 0;
    
    return event.detailOffset;
};

/**
 * @staticMethod getTarget(event) 获取事件关联的DOM元素
 */
Fan.Event.getTarget = function( e ) {
    e = e || window.event;
    return e.srcElement || e.target;
};

/**
 * @staticMethod getKeyCode(event) 获取键盘看下的ASCii键码
 */
Fan.Event.getKeyCode = function( e ) {
    e = e || window.event;
    return e.keyCode || e.charCode || e.which;
};

/**
 * @staticMethod stop(event) 停止事件冒泡
 */
Fan.Event.stop = function( e ) {
    e = e || window.event;
    if ( e.stopPropagation )
        e.stopPropagation();
    else
        e.cancelBubble = true;
};

/**
 * @staticMethod cancel(event) 取消事件默认执行
 */
Fan.Event.cancel = function( e ) {
    e = e || window.event;
    if ( e.preventDefault )
        e.preventDefault();
    else
        e.returnValue = false;
};

/**
 * @staticMethod getClipboardText(event) 获取剪切板中的文本，适用于copy、cut、paste事件中
 */
Fan.Event.getClipboardText = function( e ) {
    e = e || window.event;
    var clipboardData = e.clipboardData || window.clipboardData;
    if ( clipboardData ) {
        return clipboardData.getData( 'text' );
    }
};

/**
 * @staticMethod setClipboardText(event, text) 设置剪切板中的文本，适用于copy、cut、paste事件中
 */
Fan.Event.setClipboardText = function( e, text ) {
    e = e || window.event;
    if ( e.clipboardData ) {
        return e.clipboardData.setData( 'text/plain', text );
    } else if ( window.clipboardData ) {
        // for ie
        return window.clipboardData.setData( 'text', text );
    }
};

/**
 * @staticMethod fire(element, eventType|eventObject, args) 触发指定的事件
 * 注: args参数将绑定在event对象的_args属性上传递给监听者
 */
Fan.Event.fire = function( elem, type, args ) {
    var ret, evt, target;

    // 标准浏览器
    if ( document.createEvent ) {
        // 已指定事件对象, 则无需构造一个事件对象
        if ( type && type.type && type.target ) {
            target = type.target;
            type = type.type;
        }
        
        if ( /^mouse|^(contextmenu$|DOMMouseScroll)$/i.test( type ) ) {
            evt = document.createEvent( 'MouseEvents' );
            evt.initEvent( type, false, true, document.defaultView );
        } else {
            evt = document.createEvent( 'HTMLEvents' );
            evt.initEvent( type, false, true, document.defaultView );
        }

        if ( target ) {
            evt._target = target;
        }
        evt._args = args || [];
        ret = elem.dispatchEvent( evt );
    } else if ( document.createEventObject ) {
        // 已指定事件对象, 则无需构造一个事件对象
        if ( type && type.type && type.target ) {
            target = type.target;
            type = type.type;
        }
        
        // if IE
        var eventType = 'on' + type;
        
        // 判断是否属于自定义事件
        var isSupportEvent = eventType in elem;
        if ( isSupportEvent ) {
            evt = document.createEventObject();
            evt.screenX  = 0;
            evt.screenY  = 0;
            evt.clientX  = 0;
            evt.clientY  = 0;
            evt.ctrlKey  = false;
            evt.altKey   = false;
            evt.shiftKey = false;
            evt.button   = 0;
            evt.type     = type;
            
            if ( target ) {
                evt._target = target;
            }
            evt._args = args || [];
            ret = elem.fireEvent( eventType, evt );
        } else {
            /*
             * 自定义事件的触发
             * 需要通过Fan.addEvent(..)添加监听事件
             */
            
            // 已指定事件对象, 则无需构造一个事件对象
            if ( type && type.type && type.target ) {
                target = type.target;
                type = type.type;
            }
            
            // var keyId = Fan.getElemKeyId( elem );
            
            // 通过keyId或者elem查找该元素绑定的事件集合
            var eventMap = Fan.getCustomEventMap( elem );
            
            // 从绑定的事件集合中查找与本次事件对应的处理函数集合
            var handlers = eventMap.get( type );
            
            // 遍历函数集合,逐个调用
            var handler;
            Fan.each( handlers, function( i ) {
                handler = this;
                ret = handler.apply( elem, [ { _args : args || [], _target : target } ] );
                
                // 当事件函数中返回false则结束事件调用
                if ( ret === false )
                    return false;
            } );
            eventMap = handlers = handler = ret = elem = args = null;
        }
    }
    evt = elem = null;
    return ret;
};


/**
 * @class 事件管理类
 */
Fan.Package( 'Fan.lang' );
Fan.Class( 'Fan.lang.Event', function() {
    /**
     * 存放监听的事件处理函数
     */
    var _eventMap;
    
    this.Event = function( cfg ) {
        Super();
        if ( cfg && cfg.on ) {
            Fan.each( cfg.on, function( k ) {
                This.on( k, this, 'event-' + This.id );
            } );
        }
    };

    /**
     * @method on(String eventType, Function handler, String eventId)
     *         增加事件监听器
     * 
     * <pre>
     * 1、eventType - 事件类型
     * 2、handler - 事件处理函数，该处理函数中this指向组件本身
     * 3、eventId - 事件id标识，便于区别其他同类型事件，可选，缺省时，会自动生成
     * </pre>
     * 
     * @return eventId
     */
    this.on = function ( eventType, handler, eventId ) {
        _eventMap || (_eventMap = Fan.newMap());
        var fnMap = _eventMap.get( eventType );
        eventId = eventId || Fan.id( 'event-' );
        if ( fnMap ) {
            fnMap.put( eventId, handler );
        } else {
            fnMap = Fan.newMap();
            fnMap.put( eventId, handler );
            _eventMap.put( eventType, fnMap );
        }
        logger.debug( '[增加监听] [ ' + eventType + ' ] \t[ ' + eventId + ' ]' );
        return eventId;
    };

    /**
     * @method un(String eventType, String eventId) 移除事件监听器
     * 
     * <pre>
     * 1、eventType - 事件类型
     * 2、eventId - 事件id标示，可选，是在注册事件时指定的eventid，或者返回的id。该参数缺省时，将移除所有同类型事件
     * </pre>
     */
    this.un = function ( eventType, eventId ) {
        if ( !_eventMap || !_eventMap.size() )
            return;
        logger.debug( '[移除监听] [ ' + eventType + ' ] \t[ ' + (eventId || '') + ' ]' );
        if ( arguments.length <= 1 ) {
            _eventMap.remove( eventType );
            return;
        }
        var fnMap = _eventMap.get( eventType );
        if ( !fnMap || !fnMap.size() )
            return;
        fnMap.remove( eventId );
        !fnMap.size() && _eventMap.remove( eventType );
    };

    /**
     * @method fire(String eventType, Array args) 触发指定的事件
     * 
     * 【注】：相同的事件，触发时，return false则会终止事件链调用。
     * 
     * <pre>
     * 1、eventType - 事件类型
     * 2、args - 给事件处理函数传入的参数列表，以数组形式
     * </pre>
     * 
     * @return 返回事件处理函数的返回值
     */
    this.fireEvent = function ( eventType, args ) {
        logger.debug( '[触发监听] [ ' + eventType + ' ] \t参数:' + (arguments.length > 1 ? '[ ' + args + ' ]' : '[]') );
        if ( !_eventMap )
            return;
        var fnMap = _eventMap.get( eventType );
        if ( fnMap && fnMap.size() ) {
            var argsLen = arguments.length;
            args = Fan.isArray( args ) ? args : argsLen > 1 ? ((args && args.callee && args.length != null) ? args : [ args ]) : [];
            argsLen = null;
            var ret;
          
// ======================================================
//            该异常捕获代码暂时注释                                                           begin
//            原因是从新throw异常后
//            浏览器定位的错误位置是throw这一刻
//            不便查找真正的错误代码
//            解开注释即可恢复
// ======================================================
            try {
                ret = fnMap.each( function ( k, es, v ) {
                    if ( Fan.isFunction( v ) ) {
                        var r = v.apply( this, args || [] );
                        if ( false === r ) {
                            return r;
                        }
                    }
                }, this );
            } catch ( e ) {
                e._errType = ErrorTypes.RuntimeError;
                e._errClassName = this.getClass().className;
                e._errMethodName = 'fireEvent( "' + eventType + '", ' + args + ' )';
                Fan.ClassManager.error( e );
                // 运行时异常, 输入日志, 以便调试
                logger.error( e );
                throw e;
            }
// ======================================================
//              该异常捕获代码暂时注释
//              原因是从新throw异常后
//              浏览器定位的错误位置是throw这一刻
//              不便查找真正的错误代码
//              解开注释即可恢复                                                                         end
// ======================================================
                
            return ret;
        }
        eventType = args = fnMap = null;
    };
    
    // 销毁
    this.destroy = function() {
        if ( _eventMap ) {
            if ( logger.getLevel() < 2 ) {
                var keyset = _eventMap.getKeySet();
                keyset.length > 0 && logger.debug( '[移除事件] ' + keyset.join( ' | ' ) );
                keyset = null;
            }
            _eventMap.clear();
        }
        _eventMap = null;
        return Super();
    };
    
    /* [system embedded code] */
    var Super = null, This = null;
    this.Event = this.Event || function() {
        Super();
    };
    this[ KEYS.SET_SUPER ] = function( s ) {
        Super = s;
        This = s ? s[ KEYS.THIS ] : null;
    };
    this[ KEYS.GET_SUPER ] = function( b ) {
        return b ? Super[ KEYS.SUPER ] : Super;
    };
    /* [system embedded code] */
} );
Fan.lang.Event.prototype.toString = function() {
    return '[object ' + this.getClass().className + ']';
};


/**
 * 数组辅助类
 * @class
 */
Fan.Class( 'Fan.Array', function () {
    /* [system embedded code] */
    var Super = null, This = null;
    this.Array = this.Array || function() {
        Super();
    };
    this[ KEYS.SET_SUPER ] = function( s ) {
        Super = s;
        This = s ? s[ KEYS.THIS ] : null;
    };
    this[ KEYS.GET_SUPER ] = function( b ) {
        return b ? Super[ KEYS.SUPER ] : Super;
    };
    /* [system embedded code] */
} );
Fan.Array.prototype.toString = function() {
    return '[object ' + this.getClass().className + ']';
};


/**
 * 日期辅助类
 * @class
 */
Fan.Class( 'Fan.Date', function() {
    /* [system embedded code] */
    var Super = null, This = null;
    this.Date = this.Date || function() {
        Super();
    };
    this[ KEYS.SET_SUPER ] = function( s ) {
        Super = s;
        This = s ? s[ KEYS.THIS ] : null;
    };
    this[ KEYS.GET_SUPER ] = function( b ) {
        return b ? Super[ KEYS.SUPER ] : Super;
    };
    /* [system embedded code] */
} );
Fan.Date.prototype.toString = function() {
    return '[object ' + this.getClass().className + ']';
};


/**
 * 函数辅助类
 * @class
 */
Fan.Class( 'Fan.Function', function() {
    /* [system embedded code] */
    var Super = null, This = null;
    this.Function = this.Function || function() {
        Super();
    };
    this[ KEYS.SET_SUPER ] = function( s ) {
        Super = s;
        This = s ? s[ KEYS.THIS ] : null;
    };
    this[ KEYS.GET_SUPER ] = function( b ) {
        return b ? Super[ KEYS.SUPER ] : Super;
    };
    /* [system embedded code] */
} );
Fan.Function.prototype.toString = function() {
    return '[object ' + this.getClass().className + ']';
};


/**
 * Number辅助类
 * @class
 */
Fan.Class( 'Fan.Number', function() {
    /* [system embedded code] */
    var Super = null, This = null;
    this.Number = this.Number || function() {
        Super();
    };
    this[ KEYS.SET_SUPER ] = function( s ) {
        Super = s;
        This = s ? s[ KEYS.THIS ] : null;
    };
    this[ KEYS.GET_SUPER ] = function( b ) {
        return b ? Super[ KEYS.SUPER ] : Super;
    };
    /* [system embedded code] */
} );
Fan.Number.prototype.toString = function() {
    return '[object ' + this.getClass().className + ']';
};


// 判断网页加载完毕, 采用轮询的方式，避免各浏览器加载完成时间不一致
var pollTimer = Fan.defer( function () {
    clearTimeout( pollTimer );
    if ( 'complete' == importJsState && 'complete' == jsLoadState && 'complete' == document.readyState ) {
        Fan.each( readyList, function ( i ) {
            setTimeout( this, 0 );
        } );
        readyList = pollTimer = null;
    } else {
        pollTimer = Fan.defer( arguments.callee, 20 );
    }
}, 50 );

// 注册全局事件，监听类加载情况
var classFileCount = 0;
Fan.on( 'classload', function ( name, clazz ) {
    // 触发事件，类加载完毕
    Fan.fire( name, [ clazz ] );
    logger.debug( '[载入完成] ' + name + ', 已载入' + (++classFileCount) + '个类文件' );

    if ( Fan.ClassManager.getLoadingFileCount() <= 0 ) {
        logger.debug( '[-- 类文件加载完毕 --]' );
    }
} );

// 常用频繁触发的事件缓冲
(function () {
    //-- 监听未捕获的异常 -- begin --
    Fan.addEvent( window, 'error', function( evt ) {
        logger.warn( '%c[存在未捕获的异常]', [ 'color:red' ] );
        
        // 有error对象时, 打出精准的异常信息
        if ( evt.error instanceof Error ) {
            Fan.ClassManager.error( evt.error );
            logger.dir( evt.error );
        }
    } );
    // -- 监听未捕获的异常 -- end --
    
    var
    winResizeTimer, winScrollTimer,
    // 键位记录
    leftKey  = 'o', middleKey = 'o',
    rightKey = 'o', mouseWhichKey = 0,
    mousedownFn, mouseupFn,
    // 鼠标按键统一组合值:(xoo:对应鼠标左中右三个键位,x:按下,o:未按下)
    keyMap = {
        ooo : 0,
        xoo : 1,
        oxo : 2,
        oox : 3,
        xxo : 4,
        xox : 5,
        oxx : 6,
        xxx : 7
    };
    
    // 浏览器窗口大小发生改变
    Fan.addEvent( window, 'resize', function () {
        clearTimeout( winResizeTimer );
        
        var args = arr_slice.call( arguments, 0 );
        
        winResizeTimer = setTimeout( function() {
            Fan.fire( 'window-resize', args );
        }, 50 );
    } );
    
    // 浏览器全局滚动条发生改变
    Fan.addEvent( window, 'scroll', function ( evt ) {
        clearTimeout( winScrollTimer );
        var doc = document.documentElement, body = document.body;
        var top = doc.scrollTop || body.scrollTop,
            left = doc.scrollLeft || body.scrollLeft;
        
        winScrollTimer = setTimeout( function() {
            Fan.fire( 'window-scroll', [ top >> 0, left >> 0 ] );
        }, 50 );
    } );
    
    // 若是移动设备, 监听设备摆放
    if ( 'orientation' in window ) {
        var types = {
            // 默认
            '0' : 'top',
            // 颠倒
            '180' : 'bottom',
            // 左倾斜
            '-90' : 'left',
            // 右倾斜
            '90' : 'right'
        };
        
        // 监听窗口变化
        Fan.addEvent( window, 'onorientationchange' in window ? 'orientationchange' : 'resize', function() {
            logger.debug( '移动设备摆放变动: ' + window.orientation );
            Fan.fire( 'window-orientationchange', [ types[ (window.orientation >> 0) + '' ], window.orientation >> 0 ] );
        } );
    }
    
    // -- 统一记录鼠标按键 -- begin --
    
    // 获取组合键位值
    Fan.getMouseWhichKey = function( event, eventType ) {
        if ( event && eventType ) {
            // 当传递了event参数时,则表示按此事件参数刷新一次组合键值
            if ( /^mousedown$/i.test( eventType ) )
                mousedownFn( event );
            else if ( /^mouseup$/i.test( eventType ) )
                mouseupFn( event );
        }
        return mouseWhichKey || 0;
    };
    Fan.addEvent( document, 'mousedown', mousedownFn = function( event ) {
        if ( !event || event._oop_mousedown_used_ )
            return;
        // 对使用过的event对象做个标记
        event._oop_mousedown_used_ = 1;

        if ( Fan.ieDocMode < 9 ) {
            switch ( event.button ) {
            case 1 : leftKey   = 'x'; break;
            case 2 : rightKey  = 'x'; break;
            case 3 : leftKey   = 'x'; rightKey  = 'x'; break;
            case 4 : middleKey = 'x'; break;
            case 5 : leftKey   = 'x'; middleKey = 'x'; break;
            case 6 : rightKey  = 'x'; middleKey = 'x'; break;
            case 7 : leftKey   = 'x'; rightKey  = 'x'; middleKey = 'x'; break;
            }
        } else {
            switch ( event.which ) {
            case 1 : leftKey   = 'x'; break;
            case 2 : middleKey = 'x'; break;
            case 3 : rightKey  = 'x'; break;
            }
        }
        mouseWhichKey = keyMap[ [ leftKey, middleKey, rightKey ].join( '' ) ];
        // logger.debug('按下:mousedown::' + [ leftKey, middleKey, rightKey ].join( '' ));
    } );
    Fan.addEvent( document, 'mouseup', mouseupFn = function( event ) {
        if ( !event || event._oop_mouseup_used_ )
            return;
        // 对使用过的event对象做个标记
        event._oop_mouseup_used_ = 1;
        
        if ( Fan.ieDocMode < 9 ) {
            switch ( event.button ) {
            case 1 : leftKey   = 'o'; break;
            case 2 : rightKey  = 'o'; break;
            case 3 : leftKey   = 'o'; rightKey  = 'o'; break;
            case 4 : middleKey = 'o'; break;
            case 5 : leftKey   = 'o'; middleKey = 'o'; break;
            case 6 : rightKey  = 'o'; middleKey = 'o'; break;
            case 7 : leftKey   = 'o'; rightKey  = 'o'; middleKey = 'o'; break;
            }
        } else {
            switch ( event.which ) {
            case 1 : leftKey   = 'o'; break;
            case 2 : middleKey = 'o'; break;
            case 3 : rightKey  = 'o'; break;
            }
        }
        mouseWhichKey = keyMap[ [ leftKey, middleKey, rightKey ].join( '' ) ];
        // logger.debug('释放:mouseup::' + [ leftKey, middleKey, rightKey ].join( '' ));
    } );
    // -- 统一记录鼠标按键 -- end --
})();


// Expose Fan to the global object
window.Fan = window.OOP = Fan;

})( this );