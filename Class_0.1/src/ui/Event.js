/**
 * @fileOverview UI事件管理类
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

/**
 * @author Fan
 * @constructor Event
 * @class Fan.ui.Event
 * @extends Class.Object
 * @description 该类是UI事件控制类, 提供视图事件的基本功能
 * @see The <a href="#">Fan</a >.
 * @example new Event( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 * on -         (事件监听配置, 可选)
 * }
 */
Class( 'Fan.ui.Event', function() {
    /**
     * 存放监听的事件处理函数
     */
    var _eventMap;
    
    this.Event = function( cfg ) {
        Super();
        if ( cfg && cfg.on ) {
            Class.each( cfg.on, function( k ) {
                var handler = Class.parseFunction( this );
                This.on( k, handler, 'event-' + (This.id || '') );
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
        _eventMap || (_eventMap = Class.map());
        var fnMap = _eventMap.get( eventType );
        eventId = eventId || Class.id( 'event-' );
        if ( fnMap ) {
            fnMap.put( eventId, handler );
        } else {
            fnMap = Class.map();
            fnMap.put( eventId, handler );
            _eventMap.put( eventType, fnMap );
        }
        // logger.debug( '[增加监听] [ ' + eventType + ' ] \t[ ' + eventId + ' ]' );
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
        // logger.debug( '[移除监听] [ ' + eventType + ' ] \t[ ' + (eventId || '') + ' ]' );
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
        // logger.debug( '[触发监听] [ ' + eventType + ' ] \t参数:' + (arguments.length > 1 ? '[ ' + args + ' ]' : '[]') );
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
//            try {
                ret = fnMap.each( function ( k, v, es ) {
                    if ( Fan.isFunction( v ) ) {
                        var r = v.apply( this, args || [] );
                        if ( false === r ) {
                            return r;
                        }
                    }
                }, this );
//            } catch ( e ) {
//                e._errType = ErrorTypes.RuntimeError;
//                e._errClassName = this.getClass().className;
//                e._errMethodName = 'fireEvent( "' + eventType + '", ' + args + ' )';
//                //Fan.ClassManager.error( e );
//                // 运行时异常, 输入日志, 以便调试
//                //logger.error( e );
//                throw e;
//            }
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
            // if ( logger.getLevel() < 2 ) {
            //    var keyset = _eventMap.getKeySet();
            //    keyset.length > 0 && logger.debug( '[移除事件] ' + keyset.join( ' | ' ) );
            //    keyset = null;
            // }
            _eventMap.clear();
        }
        _eventMap = null;
        return Super();
    };
} );
Fan.ui.Event.prototype.toString = function() {
    return '[object ' + this.getClass().className + ']';
};
