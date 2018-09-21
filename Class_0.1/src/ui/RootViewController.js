/**
 * @fileOverview  根视图控制器
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

Import( 'Fan.ui.ViewController' );

/**
 * @author Fan
 * @class Fan.ui.RootViewController
 * @constructor RootViewController
 * @extends Fan.ui.ViewController
 * @description 作为整个视图树的根基
 * @see The <a href="#">Fan</a >.
 * @example new RootViewController( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 *  parentDom - 游离状态的view, 允许被渲染在指定的dom中, 缺省值:document.body
 *  viewController - 根视图控制器中的子控制器, 取值: 类名 | 类 | 实例
 *  viewControllerConfig - 视图控制器构造配置参数, 仅当viewController参数为类名或类时, 此参数才有意义
 *  
 *  on - 事件监听
 *  id - 控制器的id
 *  name - 控制器的名称
 *  viewClass - 控制器自身的view
 *  viewConfig - 控制器构造自身view时的传入参数, 详细见viewClass参数类对应的构造配置参数
 * }
 */
Class( 'Fan.ui.RootViewController', Fan.ui.ViewController, function() {
    var
    _config,
    _viewController;
    
    /**
     * @constructor 
     */
    this.RootViewController = function( config ) {
        _config = config || {};

        // 试图控制器自身view的简便配置参数
        var viewConfig = Class.apply( {
                parentDom : _config.parentDom || document.body,
                className : 'layout-body',
                useCssConfig : false
            }, _config.viewConfig );
        
        Super( {
            viewClass : _config.viewClass || 'Fan.ui.View',
            viewConfig : viewConfig,
            id : _config.id,
            name : _config.name,
            on : _config.on
        } );
    };
    
    /**
     * @description 初始化, 构造对象时会被调用
     */
    this.init = function() {
        Super();
        
        // 仅在根视图控制器去除该样式
        this.getView().getInnerDom().removeClass( 'layout-controller-inner-dom' );

        if ( _config.viewController instanceof Fan.ui.ViewController ) {
            this.setViewController( _config.viewController );
        } else if ( _config.viewController ) {
            var vcClass = Class.forName( _config.viewController );
            if ( vcClass ) {
                var vc = new vcClass( _config.viewControllerConfig );
                this.setViewController( vc );
            }
        }
    };
    
    /**
     * @description 设置子控制器
     * @param {ViewController} viewController 根视图控制器管理的子视图控制器
     */
    this.setViewController = function( viewController ) {
        if ( !(viewController instanceof Fan.ui.ViewController) )
            return;
        viewController.parentController = this;
        _viewController = viewController;
        this.getView().addSubView( viewController.getView() );
    };
    
    /**
     * @description 获取根控制器下的子视图控制器
     * @returns {ViewController}
     */
    this.getViewController = function() {
        return _viewController;
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
        _viewController && _viewController.destroy && _viewController.destroy( doDestroy );
        _viewController = _config = null;
        Super( doDestroy );
    };
} );
