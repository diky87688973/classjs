/**
 * @fileOverview 游戏应用类
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.app' );

Import( 'Fan.util.WebSocketService' );

Import( 'Fan.ui.Event' );

/**
 * @author Fan
 * @constructor GameApp
 * @class base.GameApp
 * @extends Fan.ui.Event
 * @description 提供游戏的常用API, 和游戏结构组织方式, 游戏资源载入控制, 服务器连接等等
 * @see The <a href="#">GameApp</a >.
 * @example new GameApp( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 * name                - 应用名称
 * version             - 应用的版本
 * imgs                - 需要加载的图片资源数组
 * }
 */
Class( 'Fan.app.GameApp', Fan.ui.Event, function() {
    
 // # 私有成員
    
    var
    
    _imgs               = null,            // 圖片資源數組
    _stopRender         = false,           // 是否停止渲染
    _animationLoop      = null,            // 渲染動畫的主循环函数
    
    // 統計1秒幀速:fps
    _fps                = 0,
    _tmpFps             = 0;
    
    // ------- 长轮询所需 --------- begin ---
//    // 最后一次长轮询的Fan.net.Ajax对象, 用于结束ajax调用
//    _lastPollAjax       = null,
//    // 长轮询的最大等待时长, 10秒
//    _pollDuration       = 10,
//    // 是否停止轮询
//    _isStopPoll         = false,
//    // 长轮询的最后连接时间, 用于判断长轮询是否中断
//    _lastConnectTime    = 0,
    // ------- 长轮询所需 --------- end ---
    
    // ------- websocket所需, 支持建立多个websocket连接, 故而不再保存 -------- begin ---
    // var _webSocketService   = null;
    // ------- websocket所需 -------- end ---
    
    // 游戏应用的名称,版本
    this.name           = '';
    this.version        = '';

    /**
     * @constructor 
     */
    this.GameApp = function( config ) {
        _imgs           = config.imgs || [];

        this.name       = config.name;
        this.version    = config.version;
        
        Super( config );
    };
    
    /**
     * @description 初始化
     */
    this.init = function() {
        // 加載資源
        this.loadResources();
    };
    
    /**
     * @description 載入資源
     */
    this.loadResources = function() {
      
      
        if ( 0 == _imgs.length ) {
            // 资源载入完毕,启动游戏
            _start();
        } else {
            // 需要載入的資源
            var img, count = 0;
      
            Class.each( _imgs, function() {
                img = new Image();
                img.onload = function() {
                    this.onload = null;
                    this.onerror = null;
                    GameAPPCacheManager.img[ this._src ] = this;
                    count++;
                
                    // 触发事件, 资源加载进度(资源名,是否全部加载完成)
                    Class.fire( 'GameApp-resources-load', [ this._src, count == _imgs.length ] );
                
                    if ( count == _imgs.length ) {
                        // 资源载入完毕,启动游戏
                        _start();
                    }
                };
                // TODO 该事件监听新增于2018/03/12
                img.onerror = function() {
                    this.onload = null;
                    this.onerror = null;
                    
                    logger.error( '资源载入失败:' + this._src );
                    
                    GameAPPCacheManager.img[ this._src ] = this;
                    count++;
                
                    // 触发事件, 资源加载进度(资源名,是否全部加载完成)
                    Class.fire( 'GameApp-resources-load', [ this._src, count == _imgs.length ] );
                
                    if ( count == _imgs.length ) {
                        // 资源载入完毕,启动游戏
                        _start();
                    }
                };
                img.src  = this + '';
                img._src = this + '';
            } );
      
            img = null;
        }
    };
    
    
// # 基础设施
    
    // 开始渲染
    this.startRender = function() {
        _stopRender = false;
        _animationLoop();
    };    
    
    // 停止渲染
    this.stopRender = function() {
        _stopRender = true;
    };
    
    // 启动游戏
    var _start = function() {
        // 取时间
        var now = Date.now || function() { return new Date().getTime(); },
            frameNow = now();
      
        // 启动
        This.start();
        
        // 統計1秒幀速:fps
        setInterval( function() {
            _fps = _tmpFps;
            _tmpFps = 0;
        }, 1000 );
        
        // 主循环
        _animationLoop = function(){
            if ( _stopRender )
                return;
                
            _tmpFps++;
            
            // 使用浏览器动画帧处理, FPS基本固定在60
            Fan.nextFrame( arguments.callee );
            
            // 定时器, FPS因执行效率影响
            // setTimeout( arguments.callee, 1000 / 20 );
            
            var curr = now();
            
            // 渲染
            This.render( curr - frameNow );
            
            frameNow = curr;
        };
        
        This.startRender();
    };
    
    /**
     * @description 获取游戏当前的fps
     */
    this.getFps = function() {
        return _fps;
    };
    
 // # 初始化部分
    
    /**
     * @description 初始化所有
     */
    this.initEvents = function() {
        // 初始化触控屏事件
        this.initTouchScreenEvent();
        
        // 初始化用户输入屏幕事件
        this.initInputScreenEvent();
        
        // 初始化键盘事件
        this.initKeyboardEvent();
    };
    
    /**
     * @description 初始化键盘事件
     */
    this.initKeyboardEvent = function() {
        // 子类实现
    };
    
    /**
     * @description 初始化觸摸屏, 讓觸摸設備能支持
     */
    this.initTouchScreenEvent = function() {
        // 子类实现
    };
    
    /**
     * @description 初始化用户输入屏幕事件
     */
    this.initInputScreenEvent = function() {
        // 子类实现
    };
    
    
// # 渲染部分
    
    /**
     * @description 渲染地圖
     */
    this.render = function( frameSpeed ) {
        // 子类实现
    };
    
    
// # 判定检测部分
    
    /**
     * @description 檢測判定
     */
    this.checks = function() {
        // 子类实现
    };
    
    /**
     * @description 检测元素是否在畫布之外, 邊界之外
     * @param item - 被檢測的元素
     * @param canvas - 画布元素
     * @return boolean
     */
    this.checkOutCanvas = function( item, canvas ) {
        return !this.checkCollision( item, {
                x : 0,
                y : 0,
                width  : canvas.width,
                height : canvas.height
            }, 0, 0 );
    };
    
    /**
     * @description 检测元素是否在畫布之內, 沒有超過邊界
     * @param item - 被檢測的元素
     * @param canvas - 画布元素
     * @return boolean
     */
    this.checkInCanvas = function( item, canvas ) {
        return this.checkIn( item, { x : 0, y : 0, width : canvas.width, height : canvas.height } );
    };
    
    /**
     * @description 检测元素是否在指定的元素之內, 沒有超過邊界
     * @param item - 被檢測的元素
     * @param wrap - 容器元素
     * @return boolean
     */
    this.checkIn = function( item, wrap ) {
        var xIn = (item.x >= wrap.x) && ((item.x + item.width)  <= (wrap.x + wrap.width));
        var yIn = (item.y >= wrap.y) && ((item.y + item.height) <= (wrap.y + wrap.height));
        return xIn && yIn;
    };
    
    /**
     * @description 碰撞檢測, 检测两个元素是否碰撞
     * @param item1 - 被檢測的元素1
     * @param item2 - 被檢測的元素2
     * @param depthX - 碰撞深度, x軸對應的深度
     * @param depthY - 碰撞深度, y軸對應的深度
     * 
     * @return boolean
     */
    this.checkCollision = function( item1, item2, depthX, depthY ) {
        var de = [ depthX >> 0, depthY >> 0 ];
        
        // 取得双方xy坐标
        var xy1 = { x : item1.x, y : item1.y };
        var xy2 = { x : item2.x, y : item2.y };
        
        // 计算双方各一半的宽高
        var l1 = {
            x : item1.width  / 2,
            y : item1.height / 2
        };
        var l2 = {
            x : item2.width  / 2,
            y : item2.height / 2
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
        
        // 判断双方最短距离：当连心线距离小于双方最短距离（item1/2 + item2/2），则相碰撞
        return ((x < l1.x + l2.x - de[ 0 ]) && (y < l1.y + l2.y - de[ 1 ]));
    };
    
    /**
     * @description 用户操作檢測
     */
    this.chackOperation = function() {};
    
    
// # UI交互部分
    
    // 显示聊天ui
    // this.showMsgUI = function() {};
    
    // 隐藏聊天ui
    // this.hideMsgUI = function() {};
    
    
// # 数据处理部分
    
    /**
     * @description 处理服务器推送的数据
     */
    this.processPushData = function( pushDataText ) {
        // 子类实现
    };
    
    /**
     * @description 引用服務器的數據, 同步本地數據
     * @param ... - 可扩展
     */
    this.applyData = function( args ) {
        // 子类实现
    };
    
    
// ##### 数据加载与提交部分 - 实现方式:WebSocket
    
    /**
     * @description 获取WebSocketService
     */
//    this.getWebSocketService = function() {
//        return _webSocketService;
//    };
    
    /**
     * @description 连接服务器
     * @param webSocketUrl - 连接websoket服务器的地址
     * @returns Fan.util.WebSocketService
     */
    this.connetServer = function( webSocketUrl ) {
        var webSocketService = new Fan.util.WebSocketService( {
            url : webSocketUrl
            /*on : {
                'open' : function( event ) {
                    // 连接服务器成功
                    This.fireEvent( 'WebSocketService-open', [ event ] );
                },
                'error' : function( event ) {
                    // 连接出现异常
                    This.fireEvent( 'WebSocketService-error', [ event ] );
                },
                'close' : function( event ) {
                    // 连接已关闭
                    This.fireEvent( 'WebSocketService-close', [ event ] );
                },
                'message' : function( event ) {
                    // 接收到服务器消息
                    This.fireEvent( 'WebSocketService-message', [ event ] );
                },
                'sendbefore' : function( event ) {
                    // 发送消失之前
                    This.fireEvent( 'WebSocketService-sendbefore', [ event ] );
                },
                'send' : function( event ) {
                    // 发送消息后
                    This.fireEvent( 'WebSocketService-send', [ event ] );
                },
                'senderror' : function( event ) {
                    // 发送消息错误
                    This.fireEvent( 'WebSocketService-senderror', [ event ] );
                }
            }*/
        } );
        
        return webSocketService;
    };
    
    /**
     * @description 发送数据
     */
    /*this.sendData = function( data ) {
        var server = this.getWebSocketService();
        server && server.send( data );
    };*/
} );

(function() {
    // 緩存資源管理
    window.GameAPPCacheManager = {
        img : {},
        css : {},
        js  : {}
    };
})();