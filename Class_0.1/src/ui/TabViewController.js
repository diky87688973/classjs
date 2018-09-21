/**
 * @fileOverview Tab视图控制器
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

Import( 'Fan.ui.ViewController' );
Import( 'Fan.ui.ContaineViewController' );

/**
 * @author Fan
 * @class Fan.ui.TabViewController
 * @constructor TabViewController
 * @extends Fan.ui.ContaineViewController
 * @description 该类滑动使用到了css3部分的:transform:translate(x,y)
 * @see The <a href="#">Fan</a >.
 * @example new TabViewController( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 *  subViewControllers - 子视图控制器集合
 *  
 *  on - 事件监听
 *  id - 控制器的id
 *  name - 控制器的名称
 *  viewClass - 控制器自身的view
 *  viewConfig - 控制器构造自身view时的传入参数, 详细见viewClass参数类对应的构造配置参数
 * }
 */
Class( 'Fan.ui.TabViewController', Fan.ui.ContaineViewController, function() {
    var
    _config,
    _currViewController;
    
    /**
     * @constructor 
     */
    this.TabViewController = function( config ) {
        _config = config || {};
        
        Class.apply( _config, {
            
        }, false );
        
        // 试图控制器自身view的简便配置参数
        var viewConfig = Class.apply( {
            dom : '<div class="layout-body"></div>'
        }, _config.viewConfig );
        
        Super( {
            viewClass : _config.viewClass || 'Fan.ui.View',
            viewConfig : viewConfig,
            subViewControllers : _config.subViewControllers,
            id : _config.id,
            name : _config.name,
            on : _config.on
        } );
        
        // 自带样式
        this.getView().addStyle( '-moz-transform:translate(0px,0px);-webkit-transform:translate(0px,0px);transform:translate(0px,0px);overflow:hidden;' );
        
        var vc = this.getViewControllers()[ 0 ];
        this.gotoSubViewController( vc );
    };
    
    /**
     * @description 初始化, 构造对象时会被调用
     */
    this.init = function() {
        
    };
    
    /**
     * @description 将可视区域定位到指定的子控制器
     * @param {ViewController|String} subViewControllerOrId 子视图控制器或其id
     */
    this.gotoSubViewController = function( subViewControllerOrId ) {
        var vc;
        
        if ( subViewControllerOrId instanceof Fan.ui.ViewController ) {
            vc = subViewControllerOrId;
        } else if ( Fan.type( subViewControllerOrId ) == 'string' ) {
            vc = this.getViewController( subViewControllerOrId );
        }
        
        // alert( vc );
        
        // 切换视图控制器
        if ( vc && _currViewController != vc ) {
            if ( _currViewController ) {
                // 将当前展示的子视图控制器卸下
                this.getView().removeSubView( _currViewController.getView() );
            }
            
            // 把需要展示的子视图控制器安上
            this.getView().addSubView( vc.getView() );
            
            _currViewController = vc;
            this.fireEvent( 'viewControllerChanged', [ vc ] );
        }
    };
    
    /**
     * @description 获取构造配置参数
     * @return {Object} config 构造该对象时的配置参数
     */
    this.getConfig = function() {
        return _config;
    };

    /**
     * @description 销毁组件
     * @param doDestroy - 是否销毁内部对象
     */
    this.destroy = function( doDestroy ) {
        this.removeAllViewController( doDestroy );
        _config = null;
        Super( doDestroy );
    };
} );
