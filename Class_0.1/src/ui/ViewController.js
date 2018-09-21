/**
 * @fileOverview 基础视图控制器
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui.base' );

Import( 'Fan.ui.Event' );
Import( 'Fan.ui.View' );

/**
 * @author Fan
 * @class Fan.ui.ViewController
 * @constructor ViewController
 * @extends Fan.lang.Event
 * @description 该视图控制器类是所有视图控制器类的父类, 提供视图控制器的基本特性
 * @see The <a href="#">Fan</a >.
 * @example new ViewController( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 * on - 事件监听
 * id - 控制器的id
 * name - 控制器的名称
 * viewClass - 控制器自身的view
 * viewConfig - 控制器构造自身view时的传入参数, 详细见viewClass参数类对应的构造配置参数
 * 
 * ### 支持的事件 ###
 * 
 * 自身事件
 * init
 * inited
 * destroy
 * 
 * 与父视图控制器相关事件
 * activing
 * active
 * unactiving
 * unactive
 * addToParentViewController
 * removeOfParentViewController
 * }
 */
Class( 'Fan.ui.ViewController', Fan.ui.Event, function() {
    var
    
    // 配置参数
    _config,
    
    // 控制器对应的view
    _view;
    
    /**
     * @description {ViewController} 当前控制器的父控制器对象
     * @field
     */
    this.parentController = null;
    
    /**
     * @description {String} 当前控制器的id
     * @field
     */
    this.id = null;
    
    /**
     * @description {String} 当前控制器的名称
     * @field
     */
    this.name = null;

    /**
     * @constructor 
     */
    this.ViewController = function( config ) {
        _config = config || {};
        
        var id = Class.id();
        this.id = _config.id || 'controller-' + id;
        this.name = _config.name == null ? this.id : _config.name;
        
        Super( config );
        
        // 视图控制器自身的view类
        _config.viewClass = _config.viewClass || Fan.ui.View;
        // view的构造配置参数
        _config.viewConfig = _config.viewConfig || {};
        _config.viewConfig.controller = this;
        // 默认展开
        _config.viewConfig.className = 'layout-body ' + (_config.viewConfig.className || '');
        
        var viewClass = Class.forName( _config.viewClass );
        _view = new viewClass( _config.viewConfig );
        
        // 当id初始化完毕, 则添加到缓存中
        Fan.ui.View.addUI( this );
        
        // 给所有的控制器对象自身的view打上特殊标识
        _view.getDom().attr( 'ui-controller', this.getClass().className + '_' + id );
        _view.getDom().attr( 'ui-controller-id', this.id );
        _view.getDom().attr( 'ui-controller-name', this.name );
        _view.getInnerDom().addClass( 'layout-controller-inner-dom' );
        
        // 事件
//        if ( _config.on ) {
//            var me = this;
//            Class.each( _config.on, function( k ) {
//                me.on( k, this, 'event-' + me.id );
//            } );
//            me = null;
//        }
        
        this.fireEvent( 'init', [ this ] );
        this.init();
        this.initEvent();
        this.fireEvent( 'inited', [ this ] );
    };

    /**
     * @description 初始化, 构造对象时会被调用
     */
    this.init = function() {    
        
    };
    
    /**
     * @description 初始化用户交互事件, 构造对象时会被调用
     */
    this.initEvent = function() {    
        
    };
    
    /**
     * @description 获取当前控制器的关联view视图
     * @returns {View}
     */
    this.getView = function() {
        return _view;
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
     */
    this.destroy = function( doDestroy ) {
        logger.info( '[UI] - 销毁:' + this.id );
        
        this.fireEvent( 'destroy' );
        
        _view && _view.destroy( true );
        
        this.parentController = null;
        _config = _view = null;
        
        // 从缓存中移除
        Fan.ui.View.removeUI( this );
        
        Super();
    };
} );
