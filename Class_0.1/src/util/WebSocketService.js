/**
 * @fileOverview 网络连接服务, 基于WebSocket封装类
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.util' );

Import( 'Fan.ui.Event' );

/**
 * @author Fan
 * @class Fan.util.WebSocketService
 * @constructor WebSocketService
 * @extends Fan.ui.Event
 * @description 提供基于websocket连接支持
 * @see The <a href="#">Fan</a >.
 * @example new WebSocketService();
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 * on               - 增加事件监听
 * un               - 移除事件监听
 * 
 * url              - websocket的连接地址:ws://www.aaa.com/websocket/{userId}
 * 
 * ### 支持的方法 ###
 * send(msg)        - 发送消息
 * close()          - 关闭websocket
 * destroy()        - 销毁
 * 
 * on(eventName, handler)       - 增加監聽事件, 返回事件id
 * un(eventName[, eventId])     - 移除監聽事件
 * 
 * ### 支持的事件 ###
 * open(event)      - 连接成功时触发
 * message(event)   - 接收到消息时触发
 * close(event)     - 连接关闭时触发
 * error(event)     - 出现异常时触发
 * sendbefore       - 发送之前触发, 返回false则停止发送
 * send             - 发送后触发(不一定成功)
 * senderror        - 发送出错时触发
 * }
 */
Class( 'Fan.util.WebSocketService', Fan.ui.Event, function() {
    var _webSocket;
    
    // websocket的连接地址,如:ws://www.aaa.com/websocket/{userId}
    this.url = '';
    
    /**
     * @constructor 
     */
    this.WebSocketService = function( config ) {
        Super( config );
        this.url = config.url;
        
        if ( 'WebSocket' in window )
            _webSocket = new WebSocket( config.url );
        else if ( 'MozWebSocket' in window )
            _webSocket = new MozWebSocket( config.url );
        else
            logger.error( '[WebSocket] - 客户端不支持 WebSocket API' );
        
        if ( _webSocket ) {
            _webSocket.onopen = function( event ) {
                This.fireEvent( 'open', [ event ] );
            };
            _webSocket.onmessage = function( event ) {
                This.fireEvent( 'message', [ event ] );
            };
            _webSocket.onclose = function( event ) {
                This.fireEvent( 'close', [ event ] );
            };
            _webSocket.onerror = function( event ) {
                This.fireEvent( 'error', [ event ] );
            };
        }
    };
    
    /**
     * @description 发送数据
     */
    this.send = function( msg ) {
        if ( !_webSocket )
            return;
        if ( false === this.fireEvent( 'sendbefore' ) )
            return;
        try {
            _webSocket.send( msg );
            this.fireEvent( 'send' );
        } catch( e ) {
            this.fireEvent( 'senderror' );
        }
    };
    
    /**
     * @description 关闭
     */
    this.close = function() {
        if( _webSocket != null && (_webSocket.readyState == 0 || _webSocket.readyState == 1)){  
            _webSocket.close();  
        }
    };
    
    this.destroy = function() {
        this.close();
        _webSocket = null;
        Super();
    };
} );
