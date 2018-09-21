/**
 * @fileOverview 按钮视图
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

Import( 'Fan.ui.View' );

/**
 * @author Fan
 * @class Fan.ui.Button
 * @constructor Button
 * @extends Fan.ui.View
 * @description 简单的按钮组件
 * @see The <a href="#">Fan</a >.
 * @example new Button( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 * text -       按钮上的文字
 * 
 * on -         (事件监听配置, 可选)
 * $on -        (dom元素上的事件监听配置, 可选)
 * subViews -   (数组, 可选) 子view集合配置
 * parentDom -  (html元素或jquery对象, 可选) 仅当插入的位置并非父view标准结构中时, 可以用该参数指定插入的容器
 * parentView - (视图对象, 可选) view结构中的父容器
 * controller - (视图控制器对象, 可选) 当前view关联的视图控制器
 * 
 * id -         (字符串, 可选, 默认:自动创建) 当前view的id, 用于通过父view操作当前view的索引key
 * name -       (字符串, 可选, 默认:自动创建) 当前view的名称, 可用于跨view查询
 * dom -        (字符串, 可选, 默认:空div标签) html元素标签, 作为该view的对应的html元素
 * innerDom -   (可通过dom节点查询到查询器, 可选, 默认:同为dom) 指定内部容器dom
 * html -       (字符串, 可选) 内嵌在innerDom中的html代码片段
 * 
 * className -  (字符串, 可选) 初始化时添加在dom上的样式名
 * style -      (字符串, 可选) 初始化时添加在dom上的内联样式
 * innerDomClassName -  (字符串, 可选) 初始化时添加在innerDom上的样式名
 * innerDomStyle -      (字符串, 可选) 初始化时添加在innerDom上的内联样式
 * 
 * useUserInterface -   (boolean, 可选, 默认:false) 是否启用用户交互
 * hide -               (boolean, 可选, 默认:false) 初始化时是否隐藏
 * hideMode -           (字符串, 可选, 默认:none) 隐藏模式: none-通过css设置display:none隐藏, remove-通过移除节点隐藏
 * 
 * useCssConfig -       (boolean, 可选, 默认:false) 是否启用css配置, 仅在useCssConfig参数为true时, 以下的css参数配置才有效, 默认false, 推荐用class样式表配置
 * top : 0,
 * left: 0,
 * right: 'auto',
 * bottom: 'auto',
 * width: 'auto',
 * height: 'auto',
 * position: 'relative',
 * padding: 0,
 * border: 0,
 * bgColor: '#fff',
 * bgImage: 'none',
 * zIndex: Class.id() >> 0
 * 
 * ### 支持的事件 ###
 * -- 自身事件
 * init
 * inited
 * render
 * unrender
 * show
 * hide
 * refresh
 * addSubView
 * removeSubView
 * destroy
 * -- 需开启用户交互的事件
 * swiperight
 * swipeleft
 * swipeup
 * swipedown
 * tap
 * tapdown
 * tapup
 * doubletap
 * drag
 * dragend
 * 
 * -- 与父view相关事件:
 * addToParentView
 * removeOfParentView
 * 
 * -- 与视图控制器相关事件
 * bindViewController
 * unbindViewController - 暂无此事件
 * }
 */
Class( 'Fan.ui.Button', Fan.ui.View, function() {
    var
    _text,
    _config;
    
    /**
     * @constructor 
     */
    this.Button = function( config ) {
        _config = config || {};
        
        _text = _config.text || _config.html || '按钮';
        delete _config.text;
        delete _config.html;
        
        Class.apply( _config, {
            dom : '<div class="layout-button"></div>',
            html : _text,
            useUserInterface : true
        }, false );
        
        Super( _config );
    };
    
    /**
     * @description 获取按钮上的文字
     * @returns {String}
     */
    this.getText = function() {
        return _text;
    };
    
    /**
     * @description 设置按钮上的文字
     * @returns {String} 可以是一个html片段
     */
    this.setText = function( text ) {
        _text = text;
        return this.getInnerDom().html( text );
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
        _config = _text = null;
        Super( doDestroy );
    };
} );
