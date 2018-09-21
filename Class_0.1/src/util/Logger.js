Package( 'Fan.util' );

/**
 * @class Logger
 * 
 * 负责向控制台打印运行日志
 * 
 * @param level
 *            日志级别，0-3对应：'debug'、'info'、'warn'、'error'，缺省为0
 * 
 * <pre>
 * 示例:
 * 
 * 1、构造一个日志输出对象，并设定输出级别
 * 方式1、var logger = new Logger(0);
 * 方式2、var logger = new Logger('debug');
 * 方式3、var logger = new Logger(); logger.setLevel(1);
 * 
 * 2、输入日志 
 * logger.debug('debug %c msg...', 'color:red');
 * logger.info('info msg...');
 * logger.warn('warn msg...');
 * logger.error('error msg...');
 * 
 * 3、清空控制台信息
 * logger.clear();
 * 
 * 4、关闭日志
 * logger.close();
 * 
 * 5、重新开启日志
 * logger.open(level); level：见构造参数说明
 * </pre>
 */
Class( 'Fan.util.Logger', function () {
    
    var
    
    // 日志的可用级别
    _levelEnum = {
        debug : 0,
        info : 1,
        warn : 2,
        error : 3,
        off : -1,
        on : 0,
        '0' : 0,
        '1' : 1,
        '2' : 2,
        '3' : 3,
        '-1' : -1
    },

    /**
     * @property _currResult 当前已经输出的记录数
     */
    _currResult = 0,

    /**
     * @property _level 日志级别，-1 ~ 3 对应：'close'、'debug'、'info'、'warn'、'error'，缺省为-1
     */
    _level = -1,

    // 其他控制台实现
    _console = null,
    
    // 日志界级别标志的颜色[DEBUG] | [INFO] | [WARN] | [ERROR]的颜色
    _levelColor = 'color:highlight',
    
    // 日志时间的颜色
    _timeColor = 'color:yellowgreen';

    /**
     * @property maxResult 控制台最大日志信息行数，默认512，超过则自动清空控制台，当 maxResult 不大于 0
     *           时，则不会自动清空控制台
     */
    this.maxResult = 1024;

    /**
     * @property format 指定日志输出的格式，默认：'yyyy-MM-dd
     *           hh:mm:ss:nnn::{msg}'，{msg}表示内容输入部分
     */
    this.format = '%cyyyy-MM-dd hh:mm:ss:nnn::%c {msg}';

    /**
     * @method construct(int/String level) 构造方法
     * 
     * <pre>
     * 1、level - 日志级别，-1 ~ 3 对应：'close'、'debug'、'info'、'warn'、'error'，缺省为-1
     * </pre>
     */
    this.Logger = function ( level ) {
    	Super();
        _level = _levelEnum[ level + '' ];
        _level = _level == null ? -1 : _level;
    };

    // 时间输出格式
    this._formatMsg = function ( msg ) {
        if ( msg instanceof Error ) {
            msg = [ '\n[友情提示]',
                    '\t本次调试信息, 仅在firefox|chrome下可用, 可能出现错误文件不准确, 但错误行数准确.',
                    '\t若无法查找到对应错误文件, 请尝试用chrome调试并查看分析堆栈信息以定位错误.',
                    '\t目前尚不能解决因事件触发的错误精准定位至错误文件问题, 因暂无法提供更好的排错信息, 在此深表歉意!',
                    '\tFan 2013/9/28 21:01',
                    '错误信息:' + (msg._errMsg || msg.message || ''),
                    '错误位置:' + (msg._errFileName || msg._errClassName || msg.fileName || '') + ' ' + (msg._errLine || msg.lineNumber || ''),
                    '堆栈信息:\n' + msg.stack ].join( '\n' );
        }

        var format = this.format;
        if ( format ) {
            // 格式化年月日时分秒
            var dt = new Date();
            var M = '0' + (dt.getMonth() + 1),
                d = '0' + dt.getDate(),
                h = '0' + dt.getHours(),
                m = '0' + dt.getMinutes(),
                s = '0' + dt.getSeconds(),
                n = '00' + dt.getMilliseconds();
            var flg = dt.getTime() + '\n' + dt.getTime();
            return format.replace( '{msg}', '{' + flg + '}' )
                         .replace( /yyyy/gi, dt.getFullYear() )
                         .replace( /M{1,2}/g, M.substring( M.length - 2 ) )
                         .replace( /d{1,2}/gi, d.substring( d.length - 2 ) )
                         .replace( /h{1,2}/gi, h.substring( h.length - 2 ) )
                         .replace( /m{1,2}/g, m.substring( m.length - 2 ) )
                         .replace( /s{1,2}/gi, s.substring( s.length - 2 ) )
                         .replace( /n{3}/g, n.substring( n.length - 3 ) )
                         .replace( '{' + flg + '}', msg );
        } else {
            return new Date();
        }
    };

    // 检测控制台信息数量是否已经超过最大值
    this._checkResultCount = function () {
        if ( this.maxResult > 0 && _currResult >= this.maxResult - 1 ) {
            this.clear();
            _currResult = 0;
        }
        return true;
    };
    
    // 最终打印接口,支持Console API:
    // https://developers.google.com/chrome-developer-tools/docs/console-api
    // 格式化字符
    // %s   Formats the value as a string.
    // %d or %i    Formats the value as an integer.
    // %f  Formats the value as a floating point value.
    // %o  Formats the value as an expandable DOM element (as in the Elements panel).
    // %O  Formats the value as an expandable JavaScript object.
    // %c  Formats the output string according to CSS styles you provide.
    // 用法:
    // this._print( '%c红色信息, %c图片', ['color:red', 'line-height:100px;padding:50px 50px;background:url(xxx.jpg) no-repeat;'] )
    // this._print( '%s %d %i %f', ['字符串', 123, 456, 3.14] );
    // this._print( '%o %O', [document.body, {jsObject:123}] );
    this._print = function( msg, formats, level ) {
        if ( _console ) {
            msg = (msg + '').replace( /</g, '&lt;' ).replace( />/g, '&gt;' );
            _console.print.apply( _console, [ msg ].concat( formats ) );
            return;
        }
        
        if ( window.console ) {
            var params = [ msg ].concat( formats );
            
            // IE使用原生日志输出方式, 不支持 Console API
            if ( Class.ie ) {
                var f = ([ 'info', 'log', 'warn', 'error' ])[ _levelEnum[ level ] ] || 'log';
                if ( console[ f ] )
                    console[ f ]( msg.replace( /%(c|s|d|i|f|o|O)/g, '' ) ); // 清除不支持的格式化符号
                return;
            }
            
            if ( console.log ) {
                console.log.apply( console, params );
            } else if ( console.info ) {
                console.info.apply( console, params );
            } else if ( console.debug ) {
                console.debug.apply( console, params );
            }
        }
    };
    
    // 对外暴露最终打印接口, 支持Console API
    this.print = function( msg, formats ) {
        var fs = arguments.length > 2 ? [].slice.call( arguments, 1 ) : formats;
        this._print( msg, fs );
    };

    /**
     * @method debug(msg) 输出调试级别的日志
     */
    this.debug = function ( msg, formats ) {
        if ( _level !== 0 )
            return;
        
        if ( this._checkResultCount() ) {
            var fs = arguments.length > 2 ? [].slice.call( arguments, 1 ) : formats;
            this._print( '%c[DEBUG]\t' + this._formatMsg( msg ), [ _levelColor, _timeColor, 'color:darkgrey' ].concat( fs || [] ), 'debug' );
            _currResult++;
        }
    };

    /**
     * @method info(msg) 输出普通级别的日志
     */
    this.info = function ( msg, formats ) {
        if ( _level <= 1 && _level >= 0 ) {
            if ( this._checkResultCount() || _console ) {
                var fs = arguments.length > 2 ? [].slice.call( arguments, 1 ) : formats;
                this._print( '%c[INFO]\t' + this._formatMsg( msg ), [ _levelColor, _timeColor, 'color:lightslategray' ].concat( fs || [] ), 'info' );
                _currResult++;
            }
        }
    };

    /**
     * @method warn(msg) 输出警告级别的日志
     */
    this.warn = function ( msg, formats ) {
        if ( _level <= 2 && _level >= 0 ) {
            if ( this._checkResultCount() || _console ) {
                var fs = arguments.length > 2 ? [].slice.call( arguments, 1 ) : formats;
                this._print( '%c[WARN]\t' + this._formatMsg( msg ), [ _levelColor, _timeColor, 'color:darkorange' ].concat( fs || [] ), 'warn' );
                _currResult++;
            }
        }
    };

    /**
     * @method warn(msg) 输出异常级别的日志
     */
    this.error = function ( msg, formats ) {
        if ( _level <= 3 && _level >= 0 ) {
            if ( this._checkResultCount() || _console ) {
                var fs = arguments.length > 2 ? [].slice.call( arguments, 1 ) : formats;
                this._print( '%c[ERROR]\t' + this._formatMsg( msg ), [ _levelColor, _timeColor, 'color:crimson' ].concat( fs || [] ), 'error' );
                _currResult++;
                
                // 通过控制台的error方法输出一次错误信息,便于从控制台发觉错误
                if ( window.console && console.error ) {
                    console.error( msg );
                }
            }
        }
    };
    
    // 避免使用log
    this.log = function ( msg, formats ) {
        this.warn( '[Logger] - 日志输出请用 debug | info | warn | error, 查看对象请用 dir 函数, 查看dom对象请用 dirxml 函数' );
        this.warn( msg, formats );
    };

    // /**
    // * @method fatal(msg) 输出致命级别的日志 【不可用】日志级别0-3
    // */
    // this.fatal = function(msg) {
    // try {
    // if (_level <= 4 && _level >= 0 && window.console && console.fatal &&
    // _checkResultCount()) {
    // console.fatal(_formatMsg(msg));
    // _currResult++;
    // }
    // } catch (_) {
    // }
    // };

    /**
     * @method dir(obj) 列出一个对象，在控制台输出
     */
    this.dir = function ( obj ) {
        try {
            if ( _level <= 3 && _level >= 0 && window.console && console.dir && this._checkResultCount() ) {
                console.dir( obj );
                _currResult++;
            }
        } catch ( _ ) {
        }
    };

    /**
     * @method dirxml(obj) 以html形式输出一个xml对象, IE中的控制台不支持
     */
    this.dirxml = function ( node ) {
        try {
            if ( _level <= 3 && _level >= 0 && window.console && console.dirxml && this._checkResultCount() ) {
                console.dirxml( node );
                _currResult++;
            } else
                this.dir( node );
        } catch ( _ ) {
        }
    };

    /**
     * @method setLevel(level) 设置日志级别
     */
    this.setLevel = function ( level ) {
        _level = _levelEnum[ level + '' ] || 0;
    };
    
    /**
     * @method getLevel() 获取日志级别
     */
    this.getLevel = function () {
        return _level;
    };

    /**
     * @method clear() 清空控制台信息
     */
    this.clear = function () {
        window.console && console.clear && console.clear();
        _currResult = 0;
    };

    /**
     * @method close() 关闭日志输出功能，关闭后可通过open方法重新开启
     */
    this.close = function () {
        _level = -1;
    };

    /**
     * @method open(level) 重新开启日志输出功能，在不调用close情况下，默认是开启状态
     * 
     * <pre>
     * 1、level - 日志级别，0-3对应：'debug'、'info'、'warn'、'error'，缺省为0
     * </pre>
     */
    this.open = function ( level ) {
        _level = _levelEnum[ level + '' ] || 0;
    };

    /**
     * 设置日志输出的控制台
     */
    this.setConsole = function ( con ) {
        Import( 'Fan.util.Dom' );
	
        if ( Fan.isElement( con ) || Fan.isString( con ) ) {
            this.setConsole( {
                consoleElem : null,
                print : function( msg, formats ) {
                    var fs = arguments.length > 2 ? [].slice.call( arguments, 1 ) : formats;
                    if ( fs.length ) {
                        var i = 0,
                            start = '<span style="%c">',
                            end   = '</span>',
                            m = msg.replace( /%c/g, function() {
                                var v = i > 0 ? end + start : start;
                                i++;
                                return v;
                            } ) + end;

                        i = 0;
                        m = m.replace( /%c/g, function(){
                            return fs[ i++ ] || '';
                        } ).replace( /%(c|s|d|i|f|o|O)/g, '' ); // 情空多余的格式化符号
                    }
                    
                    if ( !this.consoleElem ) {
                        var c = jQuery( con );
                        this.consoleElem = c[ 0 ] ? c : null;
                    }
                    
                    if ( this.consoleElem ) {
                        if( this.consoleElem[0].scrollHeight > 5 * 1024 ) {
                            var s = this.consoleElem.html().split( /<br>/i );
                            var idx = s.length - 10;
                            s = s.slice( idx > 0 ? idx : 0 );
                            this.consoleElem.html( s.join( '<br>' ) + '<br>' + m );
                            
                            logger.warn( '[Logger] - clear' );
                        } else 
                            this.consoleElem.append( '<br>' + m );
                        
                        this.consoleElem.scrollTop( this.consoleElem[0].scrollHeight );
                    }
                }
            } );
            return;
        }
        
        _console = con && con.print ? con : null;
    };
    
    /**
     * 获取日志输出的控制台
     */
    this.getConsole = function () {
        return _console && _console.print ? _console : window.console || null;
    };
} );

// 设置到Fan中
// Fan.setLogger( new Fan.util.Logger( 'debug' ) );

//// 生成一个全局日志输出对象
//window.logger = Fan.getLogger();
//// logger.clear();
//logger.debug( '-- Fan --' );

/*
    控制台支持情况
    IE控制台
    log  info  warn  error  assert  dir  clear  profile  profileEnd  
    
    Firebug控制台
    log  info  warn  error  debug  dir  exception  assert  dirxml  trace
    group  groupEnd  groupCollapsed  time  timeEnd  profile  profileEnd
    count  clear  table notifyFirebug  firebug 
    
    Chrom控制台
    log  info  warn  error  debug  dir  profiles  memory  dirxml  trace
    assert  count  markTimeline  profile  profileEnd  time  timeEnd  group
    groupCollapsed  groupEnd  
    
    Opera控制台
    log info  warn error  debug  time  timeEnd  trace  profile  profileEnd
    assert  dir  dirxml  group  groupCollapsed  groupEnd  count  table   
 */
