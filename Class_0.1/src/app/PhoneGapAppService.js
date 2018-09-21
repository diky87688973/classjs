/**
 * @fileOverview 应用程序/用户图形界面服务
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.app' );

Import( 'Fan.app.AbstractAppService' );

Import( 'Fan.ui.RootViewController' );

/**
 * @author Fan
 * @class Fan.app.PhoneGapAppService
 * @constructor PhoneGapAppService
 * @extends Fan.app.AbstractAppService
 * @description 基于PhoneGap实现的APP主程序，提供UI的环境的入口, 和APP的生命周期, 如:程序启动,终止,切至前/后台等等
 * @see The <a href="#">Fan</a >.
 * @example new AppService();
 * @since version 0.1
 */
Class( 'Fan.app.PhoneGapAppService', Fan.app.AbstractAppService, function() {
    
    var _rootFirstSubVC,
        _wrapper,
        _rootViewControllerInitedCallBack;
    
    /**
     * @constructor 
     */
    this.PhoneGapAppService = function( config ) {
        Super( config );
    };
    
    /**
     * @description 程序启动时被调用
     * @returns {boolean} 返回true, 则正常启动, 否则不启动
     */
    this.init = function( wrapper, uiConfigName, rootViewControllerInitedCallBack ) {
        // Super(); 无需调用父类init
        _wrapper = wrapper;
        _rootViewControllerInitedCallBack = rootViewControllerInitedCallBack;
        _rootFirstSubVC = Fan.loadUI( uiConfigName );
    };
    
    /**
     * @description 程序启动时被调用
     * @returns {boolean} 返回true, 则正常启动, 否则不启动
     */
    this.appStart = function() {
        Super();
      
        // 根控制器
        var vc = new Fan.ui.RootViewController( {
            parentDom : _wrapper,
            // 跟视图控制器下的子视图控制器
            viewController : _rootFirstSubVC,
            on : {
                'init' : function() {
                    _rootViewControllerInitedCallBack &&_rootViewControllerInitedCallBack.call( This, this );
                    _rootViewControllerInitedCallBack = null;
                }
            }
        } );
        
        return !!vc;
    };
    
    /**
     * @description 程序终止时被调用
     */
    this.appStop = function() {
        Super();
    };
    
    /**
     * @description 程序转前台时被调用
     */
    this.runInForeground = function() {
        Super();
    };
    
    /**
     * @description 程序转后台时被调用
     */
    this.runInBackground = function() {
        Super();
    };
      
    /**
     * @description 程序初始化时被调用
     * @returns {boolean} 返回true, 则正常启动, 否则不启动
     */
    this.initEvents = function() {
        Super();
      
        // 系统的事件
        function noop(e) {
            alert('触发事件:' + e.type);
        };
      
        Fan.addEvent( document, 'deviceready', function() {
            jQuery( function() {
                !This.isStarted && This.appStart();
            } );
        } );

        Fan.addEvent( document, 'searchbutton', noop );
        Fan.addEvent( document, 'menubutton', noop );

        Fan.addEvent( document, 'pause', function() {
            This.runInBackground.apply( This, arguments );
        } );
        Fan.addEvent( document, 'resume', function() {
            This.runInForeground.apply( This, arguments );
        } );
        Fan.addEvent( document, 'online', function() {
            This.online.apply( This, arguments );
        } );
        Fan.addEvent( document, 'offline', function() {
            This.offline.apply( This, arguments );
        } );

        Fan.addEvent( document, 'backbutton', noop );
        Fan.addEvent( document, 'batterycritical', noop );
        Fan.addEvent( document, 'batterylow', noop );
        Fan.addEvent( document, 'batterystatus', noop );

        Fan.addEvent( document, 'startcallbutton', function() {
            This.startCall.apply( This, arguments );
        } );
        Fan.addEvent( document, 'endcallbutton', function() {
            This.endCall.apply( This, arguments );
        } );
        Fan.addEvent( document, 'volumedownbutton', function() {
            This.volumeTapDown.apply( This, arguments );
        } );
        Fan.addEvent( document, 'volumeupbutton', function() {
            This.volumeTapUp.apply( This, arguments );
        } );
    };
} );
