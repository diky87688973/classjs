/**
 * @fileOverview 图标应用组件
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

Import( 'Fan.ui.View' );

/**
 * @author Fan
 * @class Fan.ui.ItemView
 * @constructor ItemView
 * @extends Fan.ui.View
 * @description 图标item中嵌入一个被缩小的view视图,点击时放大
 * @see The <a href="#">Fan</a >.
 * @example new ItemView( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 * openItemLongTime -   打开item的过度时间,缺省350毫秒
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
Class( 'Fan.ui.ItemView', Fan.ui.View, function() {
    var
    _isOpen,
    _config;
    
    /**
     * @constructor 
     */
    this.ItemView = function( config ) {
        _config = config || {};
        
        Class.apply( _config, {
            dom : '<div class="layout-item"><div class="layout-item-inner a-layout-box-shadow"></div></div>',
            innerDom : '> .layout-item-inner',
            
            useUserInterface : true,
            openItemLongTime : 600
        }, false );
        
        Super( _config );
    };
    
    this.init = function() {
        Super();
        
        this.getInnerDom().css( {
            width   : 0,
            height  : 0,
            opacity : 0
        } ).hide();
    };
    
    this.initEvent = function() {
        Super();
        
        this.on( 'tap', function() {
            this.openItem( _config.openItemLongTime );
        } );
    };
    
    this.closeItem = function( longTime ) {
        // 触发openItem, 用以控制是否允许打开
        if( !this.isOpenItem() || false === this.fireEvent( 'closeItem', [ this ] ) ) {
            return;
        }
        
        this.getInnerDom().animate( {
            opacity : 0
        }, longTime >> 0 );
        
        Fan.util.anim.CSS3Anim.zoom.recover( this.getDom().parent(), longTime >> 0, function() {
            _isOpen = false;
            // 设置隐藏, 偶尔出现闪屏, 白一下, 换成修改宽高为0达到隐藏目的
            This.getInnerDom().css( {
                height : 0,
                width  : 0
            } );
            
            // 触发已关闭item事件
            This.fireEvent( 'cloesedItem', [ This ] );
            
            //This.getInnerDom().hide();
            //This.getInnerDom()[ 0 ].style.display = 'none';
            //This.getInnerDom()[ 0 ].style.visibility = 'hidden';
            //This.getInnerDom()[ 0 ].style.overflow = 'inherit';
        } );
    };
    
    this.openItem = function( longTime ) {
        // 触发openItem, 用以控制是否允许打开
        if( this.isOpenItem() || false === this.fireEvent( 'openItem', [ this ] ) ) {
            return;
        }
        _isOpen = true;
        
        var $elem = this.getDom();
        
        // 执行动画放大效果
        var offset = Fan.util.anim.CSS3Anim.zoom.amplify( $elem, $elem.parent(), longTime >> 0, function( sub, parent, offset ) {
            This.ref();
            
            // 触发已打开item事件
            This.fireEvent( 'openedItem', [ This ] );
            
            // 重绘css
            // This.repaint( 10 );
        } );

        // 更改item-inner, 让其在放大之后的内容是正常尺寸
        this.getInnerDom().css( {
            width     : $elem.width() * offset.scaleWidth,
            height    : $elem.height() * offset.scaleHeight,
            transform : 'scale(' + (1 / offset.scaleWidth) + ', ' + (1 / offset.scaleHeight) + ') translateZ(0)'
        } ).show().animate( {
            opacity : 1
        }, longTime >> 0 );
        
        $elem = null;
    };
    
    this.isOpenItem = function() {
        return !!_isOpen;
    };
    
    this.ref = function() {
        this.getSubViewMap().each( function() {
            this.value.isRender() && this.value.ref();
        } );
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
        _config = null;
        Super( doDestroy );
    };
} );
