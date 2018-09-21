/**
 * @fileOverview 抽象应用程序/用户图形界面服务
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.app' );

Import( 'Fan.util.TouchManager' );

Import( 'Fan.ui.Event' );
Import( 'Fan.ui.util.Template' );
Import( 'Fan.ui.util.Cache' );
Import( 'Fan.ui.View' );

/**
 * @author Fan
 * @class Fan.app.AbstractAppService
 * @constructor AbstractAppService
 * @extends Fan.ui.Event
 * @description 提供UI的环境的入口, 和APP的生命周期, 如:程序启动,终止,切至前/后台等等, 请用子类继承该AbstractAppService
 * @see The <a href="#">Fan</a >.
 * @example new ImplAppService();
 * @since version 0.1
 */
Class( 'Fan.app.AbstractAppService', Fan.ui.Event, function() {
    
    var
    
    // ui配置文件的根路径
    _uiConfigRootPath,
    
    // 模版文件的根路径
    _tplRootPath;
    
    // 是否已经启动
    this.isStarted = false;
    
    /**
     * @constructor 
     */
    this.AbstractAppService = function( config ) {
        config = config || {};
        Super( config );
      
        _uiConfigRootPath = config.uiConfigRootPath || 'uiconfig';
        _tplRootPath = config.tplRootPath || 'tpl';
        
        // 增加一个函数, 专门用来加载ui配置文件并构造成ui对象
        Fan.loadUI = function( uiConfigPath ) {
            // ui配置文件规则:必须放在uiconfig目录下,且目录名和文件名中不得含有点"."符号,后缀不算
            // 路径描述以点"."作为目录分隔符
            var ui, path = Fan.getAbsPath( _uiConfigRootPath + '/' + uiConfigPath.replace( /\.+/g, '/' ) + '.js' );
            Class.Loader.loadFile( path, function( content ) {
                var config = eval( '(' + content + '\n)' );
                
                // 交给处理函数处理, 该方式会在head中新建script标签执行js
                // Class.Loader.execScript( 'Fan.ui.AbstractAppService.uiConfigAcceptance("' + uiConfigPath + '", ' + content + '\n);' + Fan.KEYS.EVAL_JS_CODE_SUFFIX_FOR_AJAX + _uiConfigRootPath + '/' + uiConfigPath );
                // 取得配置
                // var config = Fan.ui.AbstractAppService.uiConfigMap.get( uiConfigPath );
                // Fan.ui.AbstractAppService.uiConfigMap.remove( uiConfigPath );
                
                // 取不到表示加载失败
                if ( !config ) {
                    logger.error( '[UI加载] - 失败, 异常配置:' + uiConfigPath + ', url:' + path );
                }
                
                var viewClass = Class.forName( config.clazz );
                if ( !Class.isClass( viewClass ) ) {
                    logger.error( '[UI构造失败] - 未知的视图类名称:' + config.clazz );
                } else {
                    ui = new viewClass( config.config );
                }
            }, function() {
                alert( '[UI配置文件] - 加载失败' );
            }, {
                // 缺省同步操作
                mimeType : 'text/javascript',
                headers : {
                    'Accept' : 'text/javascript'
                }
            } );
            
            return ui || null;
        };
        
        /**
         * 根据ui的id获取已经存在的ui对象
         */
        Fan.getUI = function( uiId ) {
            return Fan.ui.View.getUI( uiId );
        };
        
        // 增加一个简单模版处理
        var tpl = new Fan.ui.util.Template( _tplRootPath );
        Fan.getTpl = function( tplPath ) {
            return tpl.getTemplate( tplPath );
        };
        
        // 模版缓存
        Fan.cache.template = new Fan.ui.util.Cache( 'template', 'id' );
        
        this.initEvents();
        
        jQuery( function() {
            Fan.util.TouchManager.add( document.body );
        } );
    };
    
    /**
     * @description 初始化
     */
    this.init = function() {
        jQuery( function() {
            !This.isStarted && This.appStart();
        } );
    };
    
    /**
     * @description 初始化事件
     */
    this.initEvents = function() {
        
    };
    
    /**
     * @description 程序启动时被调用
     * @returns {boolean} 返回true, 则正常启动, 否则不启动
     */
    this.appStart = function() {
        this.isStarted = true;
        return true;
    };
    
    /**
     * @description 程序终止时被调用
     */
    this.appStop = function() {
        this.isStarted = false;
    };
    
    /**
     * @description 程序转前台时被调用
     */
    this.runInForeground = function() {
        logger.info( '[程序状态] - 进入前台' );
    };
    
    /**
     * @description 程序转后台时被调用
     */
    this.runInBackground = function() {
        logger.info( '[程序状态] - 进入后台' );
    };
    
    /**
     * @description 在线
     */
    this.online = function() {
        logger.info( '[程序状态] - 在线' );
    };
    
    /**
     * @description 离线
     */
    this.offline = function() {
        logger.info( '[程序状态] - 离线' );
    };
    
    /**
     * @description 音量键按下
     */
    this.volumeTapDown = function() {
        logger.info( '[程序状态] - 音量键按下' );
    };
    
    /**
     * @description 音量键抬起
     */
    this.volumeTapUp = function() {
        logger.info( '[程序状态] - 音量键抬起' );
    };
    
    /**
     * @description 呼叫
     */
    this.startCall = function() {
        logger.info( '[程序状态] - 呼叫' );
    };
    
    /**
     * @description 挂机
     */
    this.endCall = function() {
        logger.info( '[程序状态] - 挂机' );
    };

} );

/**
 * 静态成员
 */
( function( AbstractAppService ) {
    // 全局保存加载过的uiconfig
    AbstractAppService.uiConfigMap = Class.map();
    
    // 处理加载过的uiconfig
    AbstractAppService.uiConfigAcceptance = function( configPath, config ) {
        AbstractAppService.uiConfigMap.put( configPath, config );
    };
} )( Fan.app.AbstractAppService );
