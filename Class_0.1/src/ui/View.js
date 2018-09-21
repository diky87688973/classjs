/**
 * @fileOverview 基础视图
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

Import( 'Fan.ui.Event' );

Import( 'Fan.util.Map' );
Import( 'Fan.util.TouchManager' );

/**
 * @author Fan
 * @constructor View
 * @class Fan.ui.View
 * @extends Fan.ui.Event
 * @description 该类是所有视图类的父类, 提供视图的基本特性
 * @see The <a href="#">Fan</a >.
 * @example new View( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
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
Class( 'Fan.ui.View', Fan.ui.Event, function() {
    var
    CONTEXT = '.CONTEXT.',
    
    // 配置参数
    _config,
    
    // view对应的元素
    _dom,
    
    // view的内部容器dom, 装载子view的容器dom
    _innerDom,
    
    // 是否已经初始化完毕
    _isInited,
    
    // 子view集合
    _subViewMap,
    
    // parentDom仅当插入的位置并非父view标准结构中时, 可以用该参数指定插入的容器
    _parentDom,
    
    // 自定义事件函数
    _swiperight,
    _swipeleft,
    _tap,
    _tapdown,
    _tapup,
    _doubletap,
    _drag,
    _dragend,
    
    // 销毁状态, 销毁对象的过程中, 避免多次销毁
    _destroyed;
    
    /**
     * @description {View} 父容器view对象
     * @field
     */
    this.parentView = null;
    
    /**
     * @description {ViewController} 当前view关联的视图控制器对象
     * @field
     */
    this.controller = null;
    
    /**
     * @description {String} 当前view的id
     * @field
     */
    this.id = null;
    
    /**
     * @description {String} 当前view的名称
     * @field
     */
    this.name = null;

    /**
     * @constructor 
     */
    this.View = function( config ) {
        var id = Class.id();
        var viewId = 'ui-view-' + id;
        
        _config = Class.apply( {
            // 默认属性设置
            
            // =============================================
            // [特殊配置参数]
            // 当前view的子view简便配置数组, 用以组装配置复杂ui结构
            // 配置格式:
            // [ {
            //     viewClass : 'Fan.ui.View', // 类名
            //     viewConfig : { ... }            // 构造配置参数
            // }, {
            //     viewClass : app.view.MyView,    // 类
            //     viewConfig : { ... }            // 构造配置参数
            // } ]
            // =============================================
            subViews : null,
            
            // parentDom仅当插入的位置并非父view标准结构中时, 可以用该参数指定插入的容器
            parentDom : null,
            
            // view结构中的父容器
            parentView : null,
            
            // 当前view关联的视图控制器
            controller : null,
            
            // 当前view的id, 用于通过父view操作当前view的索引key
            id: viewId,
            
            // 当前view的名称描述
            name: viewId,
            
            // 字符串, html元素标签, 作为该view的对应的html元素
            dom : '<div></div>',
            
            // 指定内部容器dom
            innerDom : null,
            
            // 内嵌在innerDom中的html代码片段
            html : null,
            
            // 初始样式名
            className: '',
            innerDomClassName: '',
            
            // 内联样式
            style: '',
            innerDomStyle: '',
            
            // 是否启用用户交互
            useUserInterface: false,
            
            // 初始化时是否隐藏
            hide: false,
            // 隐藏模式: none - 通过css设置display:none隐藏, remove - 通过移除节点隐藏, 默认none
            hideMode: 'none',
            
            // 是否启用css配置, 仅在useCssConfig参数为true时, 以下的css参数配置才有效, 默认false, 推荐用class样式表配置
            useCssConfig: false,
            top : 0,
            left: 0,
            right: 'auto',
            bottom: 'auto',
            width: 'auto',
            height: 'auto',
            position: 'relative',
            padding: 0,
            border: 0,
            bgColor: '#fff',
            bgImage: 'none',
            zIndex: Class.id() >> 0
        }, config || {}, true );
        
        this.id = _config.id;
        this.name = _config.name;
        
        Super( config );

        // 得到上下文
        var context = _config[ CONTEXT ];
        
        // # 查找dom对应的元素
        
        // 若有父view且没有配置parentDom, 则父view的innerDom为当前view的容器
        if ( !_config.parentDom && context && context.parentView ) {
            _config.parentDom = context.parentView.getInnerDom();
        }
        
        // 若当前dom是需要检索出来,则检索范围从父view的innerDom开始
        if ( typeof _config.dom === 'string' ) {
            jQuery( _config.dom, _config.parentDom || document ).each( function() {
                if ( this.nodeType === 1 || this.nodeType === 9 ) {
                    _dom = jQuery( this );
                    return false;
                }
            } );
        } else {
            // 将第一个有效的元素设为_dom
            jQuery( _config.dom ).each( function() {
                if ( this.nodeType === 1 || this.nodeType === 9 ) {
                    _dom = jQuery( this );
                    return false;
                }
            } );
        }
        
        _dom = _dom || jQuery( '<div></div>' );
        _isInited = false;
        
        // 初始化innerDom
        var type = Fan.type( _config.innerDom );
        switch ( type ) {
        case 'string' :
            _innerDom = this.getDom().find( _config.innerDom ).first();
            break;
        case 'object' :
            // innerDom 必须为 dom 的子元素
            if ( Fan.dom.contains( this.getDom()[ 0 ], _config.innerDom[ 0 ] ) ) {
                _innerDom = _config.innerDom;
            }
            break;
        }
        
        _innerDom = _innerDom || this.getDom();
        
        // 当id初始化完毕, 则添加到缓存中
        Fan.ui.View.addUI( this );
        
        _parentDom = _config.parentDom;
        
        // 给所有的view对象都打上特殊标识
        this.getDom().attr( 'id', this.id );
        this.getDom().attr( 'ui-view', this.getClass().className + '_' + id );
        this.getDom().attr( 'ui-view-id', this.id );
        this.getDom().attr( 'ui-view-name', this.name );
        this.getDom().attr( 'ui-view-dom', id );
        this.getInnerDom().attr( 'ui-view-inner-dom', id );
        
        // view上的事件
//        if ( _config.on ) {
//            Class.each( _config.on, function( k ) {
//                This.on( k, this, 'event-' + This.id );
//            } );
//        }
        
        // dom上的事件
        if ( _config.$on ) {
            Class.each( _config.$on, function( k ) {
                // ".j-submit-btn click" ==> sel:".j-submit-btn", type:"click" 
                var sel = k.split( /\s+/ ), type = sel[ sel.length - 1 ];
                
                // ["click"] ==> ["#view-1", "click"] 缺省时, 以自身作为监听对象
                sel.length > 0 ? sel.splice( sel.length - 1 ) : (sel = [ '#' + This.id ].concat( sel ));
                
                // 支持字符串方式的事件代码,兼容来自json配置(json数据格式中不允许存在function对象)
                var handler = Class.parseFunction( this );
                This.$on( sel.join( ' ' ), type, handler );
            } );
        }
        
        // 初始化开始
        this.fireEvent( 'init', [ this ] );
        
        /**
         * [重要]
         * 调用view初始化, 尽量在init方法中初始化该view下的子view
         * 以确保render事件是在当前view组装结构的子view都已经构造完成
         */
        this.init();
        
        // 初始化完毕, 则渲染到页面上
        if ( _config.parentView instanceof Fan.ui.View ) {
            _config.parentView.addSubView( this );
        } else {
            this.renderInParentView();
        }
        
        // 初始化完毕, 绑定控制器
        if ( Fan.ui.ViewController && _config.controller instanceof Fan.ui.ViewController ) {
            this.controller = _config.controller;
            this.fireEvent( 'bindViewController', [ this.controller ] );
        }

        this.initEvent();
        _config.hide && this.hide();
        
        // 初始化完毕
        _isInited = true;
        this.fireEvent( 'inited', [ this ] );
        
        // 当前view已经初始化完成, 则开始组装子view
        if ( Fan.isArray( _config.subViews ) && _config.subViews.length > 0 ) {
            Class.each( _config.subViews, function( i ) {
                if ( this instanceof Fan.ui.View ) {
                    This.addSubView( this );
                } else {
                    /**
                     * 增加一个隐式参数:临时上下文,用于子对象能够得知当前上下文,比如得知自己将要添加到哪个父view中
                     */
                    this.viewConfig = this.viewConfig || {};
                    this.viewConfig[ CONTEXT ] = {
                        parentView : This
                    };
                    var subView = Class.instance( this.viewClass, this.viewConfig );
                    
                    // 删除上下文
                    delete this.viewConfig[ CONTEXT ];
                    
                    if ( !subView ) {
                        logger.error( '[视图构造失败] - 未知的视图类名称:' + this.viewClass );
                    } else {
                        This.addSubView( subView );
                    }
                }
            } );
        }
    };

    /**
     * @description 初始化, 构造对象时会被调用
     */
    this.init = function() {
//        if ( this.getInnerDom()[ 0 ] == null )
//            debugger;
//        if ( this.getClass().className != 'Fan.ui.View' )
//            throw new Error('调用父类方法的异常');
        
        logger.info( '[UI] - 初始化:' + this.getClass().className + '_' + this.id );
        
        // 参数处理
        this.addStyle( _config.style );
        Fan.dom.css( this.getInnerDom()[ 0 ], _config.innerDomStyle );
        
        // 使用css配置参数
        if ( _config.useCssConfig ) {
            this.setTop( _config.top );
            this.setLeft( _config.left );
            this.setRight( _config.right );
            this.setBottom( _config.bottom );
            
            this.setWidth( _config.width );
            this.setHeight( _config.height );
            
            this.setPosition( _config.position );
            this.setPadding( _config.padding );
            this.setBorder( _config.border );
            this.setBackgroundColor( _config.bgColor );
            this.setBackgroundImage( _config.bgImage );
            
            this.setZIndex( _config.zIndex );
        }
        
        // 增加样式名
//        this.getDom().addClass( 'layout-view-dom' );
//        this.getInnerDom().addClass( 'layout-view-inner-dom' );
        
        this.addClass( _config.className );
        this.getInnerDom().addClass( _config.innerDomClassName );
        
        _config.html ? this.setHtml( _config.html ) : _processLoadUI();
        
        // 手指事件, 用户交互模式是否启用
        if ( _config.useUserInterface ) {
//            // 手指管理, 为让ie9以下浏览器版本支持自定义事件, 不使用jquery监听手指事件, 而改用Fan.addEvent
//            Fan.util.TouchManager.add( this.getDom() );
            this.getDom().attr( 'ui-use-user-interface', true );
            
            var elem = this.getDom()[ 0 ];
            
            // 向右滑动
            Fan.addEvent( elem, 'swiperight', _swiperight = function() {
                This.fireEvent( 'swiperight', Fan.getArgs() );
            } );
            
            // 向左滑动
            Fan.addEvent( elem, 'swipeleft', _swipeleft = function() {
                This.fireEvent( 'swipeleft', Fan.getArgs() );
            } );
            
            // 向上滑动
            Fan.addEvent( elem, 'swipeup', _swiperight = function() {
                This.fireEvent( 'swipeup', Fan.getArgs() );
            } );
            
            // 向下滑动
            Fan.addEvent( elem, 'swipedown', _swipeleft = function() {
                This.fireEvent( 'swipedown', Fan.getArgs() );
            } );
            
            // 触击按下
            Fan.addEvent( elem, 'tapdown', _tapdown = function() {
                This.fireEvent( 'tapdown', Fan.getArgs() );
            } );
            
            // 触击松开
            Fan.addEvent( elem, 'tapup', _tapup = function() {
                This.fireEvent( 'tapup', Fan.getArgs() );
            } );
            
            // 触击一次(单击)
            Fan.addEvent( elem, 'tap', _tap = function(e) {
                This.fireEvent( 'tap', Fan.getArgs() );
            } );
            
            // 双击
            Fan.addEvent( elem, 'doubletap', _doubletap = function() {
                This.fireEvent( 'doubletap', Fan.getArgs() );
            } );
            
            // 拖动
            Fan.addEvent( elem, 'drag', _drag = function() {
                This.fireEvent( 'drag', Fan.getArgs() );
            } );
            
            // 拖动结束
            Fan.addEvent( elem, 'dragend', _dragend = function() {
                This.fireEvent( 'dragend', Fan.getArgs() );
            } );
            elem = null;
        } else {
            // 不开启用户交互, 则在dom上打个标志, 自定义事件在含有该标志的元素上不再冒泡传递
            // this.getDom().attr( 'ui-use-user-interface', false );
        }
    };
    
    /**
     * @description 初始化用户交互事件, 构造对象时会被调用
     */
    this.initEvent = function() {
        
    };
    
    /**
     * @description 处理load-ui元素载入ui
     */
    var _processLoadUI = function() {
        
        // 检测 load-tpl 标签, 若存在, 则将tpl模版填充之
        var loadtpls = This.getInnerDom().find( 'load-tpl' );
        loadtpls.each( function( i ) {
            var tplElem = jQuery( this ),
                tplPath = tplElem.attr( 'path' ),
                tpl     = null;
            if ( tplPath && (tpl = Fan.getTpl( tplPath )) ) {
                tpl = jQuery( tpl );
                
                var scripts = tpl.find( 'script' );
                var head = jQuery( jQuery( 'head' )[ 0 ] || jQuery( 'body' )[ 0 ] || document.documentElement );
                var parentNode = tplElem[ 0 ].parentNode;
                
                // 遍历节点,全部插入到load-tpl元素之前
                tpl.each( function() {
                    if ( /^script$/i.test( this.nodeName ) && (this.type === '' || /^text\/javascript$/i.test( this.type ) ) ) {
                        // 模版中的脚本全部转移到head元素中
                        jQuery( this ).remove();
                        head.append( this );
                        this._render_moved = 1;
                    } else
                        parentNode.insertBefore( this, tplElem[ 0 ] );
                } );
                
                // 模版中的脚本全部转移到head元素中
                scripts.remove();
                scripts.each( function() {
                    if ( !this._render_moved ) {
                        head.append( this );
                        this._render_moved = 1;
                    }
                } );
                
                // clear
                parentNode = tpl = null;
            } else {
                logger.error( '[load-tpl] - tpl元素配置错误:\n' + tplElem[ 0 ].outerHTML );
                throw new Error( 'tpl元素配置错误!' );
            }
        } );
        loadtpls.remove();
        
        // 检测 load-ui 标签, 若存在, 则构造ui填充之
        var loaduis = This.getInnerDom().find( 'load-ui' );
        
        // 过滤出最外层的load-ui标签
        loaduis.attr( 'ui-first-wrap', '1' ).find( 'load-ui' ).removeAttr( 'ui-first-wrap' );
        loaduis.each( function( i ) {
            var uiElem = jQuery( this );
            
            if ( !uiElem.attr( 'ui-first-wrap' ) )
                return;
            
            // 取出uiconfig路径
            var uiConfigPath = uiElem.attr( 'path' );
            
            var ui;
            
            // 若存在UI配置, 则优先使用配置, 忽略内部html
            if ( uiConfigPath ) {
                // 载入ui
                ui = Fan.loadUI( uiConfigPath );
            } else if ( uiElem.html().trim() ) {
                var html    = uiElem.html(),
                    uiClass = uiElem.attr( 'ui-class' ) || 'Fan.ui.View',
                    useUserInterface = /^true$/i.test( uiElem.attr( 'use-user-interface' ) );
                    
                ui = Class.instance( uiClass, {
                    useUserInterface : useUserInterface,
                    dom : html
                    // html : html
                } );
            }
            
            if ( !ui ) {
                logger.error( '[load-ui] - ui元素配置错误:\n' + uiElem[ 0 ].outerHTML );
                throw new Error( 'ui元素配置错误!' );
            }
            
            // 设置自定义的容器dom
            ui.setParentDom( uiElem[ 0 ].parentNode );
            
            // 添加至父view
            This.addSubView( ui );
        } );
        loaduis.remove();
    };
    
    /**
     * @description dom元素渲染到父容器中
     */
    this.renderInParentView = function() {
        if ( this.isRender() )
            return;
        
        // 追加到父容器中, 优先判断是否存在容器dom, 允许自定义位置插入该view
        if ( _parentDom ) {
            jQuery( _parentDom ).append( this.getDom() );
        } else if ( this.parentView instanceof Fan.ui.View ) {
            // 其次根据标准的视图结构插入该view
            var parentInnerDom = this.parentView.getInnerDom();
            parentInnerDom.append( this.getDom() );
        } else {
            // 没有显示的容器,则不显示
            return;
        }
        
        this.fireEvent( 'render', [ this ] );
    };
    
    /**
     * @description dom元素从父容器中摘除
     */
    this.renderOutParentView = function() {
        if ( !this.isRender() )
            return;
        
        // 保留数据删除
        this.getDom().detach();
        
        this.fireEvent( 'unrender', [ this ] );
    };
    
    /**
     * @description 是否已经渲染到父容器中,如果把页面已有的html片段构成view对象,则不会触发render事件
     * @returns {boolean} true | false
     */
    this.isRender = function() {
        return this.getDom()[ 0 ].parentNode ? this.getDom()[ 0 ].parentNode.nodeType === 1 : false;
        
        /*var dom = this.getDom(), isRender = false;
        while ( dom ) {
            if( dom === document.documentElement ) {
                isrender=true;
                break;
            } else dom = dom.parentNode;
        }
        return isrender;*/
    };
    
    /**
     * @description 是否是显示状态
     * @returns {boolean} true | false
     */
    this.isShow = function() {
        return !/^none/i.test( this.getDom().css( 'display' ) );
    };
    
    /**
     * @description 是否已经初始化完毕
     * @returns {boolean} true | false
     */
    this.isInited = function() {
        return _isInited;
    };
    
    /**
     * @description 返回当前view的dom对象
     * @returns {JQueryObject} jQueryDom
     */
    this.getDom = function() {
        return _dom;
    };
    
    /**
     * @description 返回当前view的内部容器dom对象, 用于复杂view时的内容容器并非_dom的情况
     * @returns {JQueryObject} jQueryDom
     */
    this.getInnerDom = function() {
        return _innerDom || _dom;
    };
    
    /**
     * @description 设置当前view所在的父容器, 仅当插入的位置并非父view标准结构中时,该操作才有意义
     * @param {HTMLElement|JQueryObject} parentDom 父容器对象, html元素或jquery对象
     */
    this.setParentDom = function( parentDom ) {
        _parentDom = jQuery( parentDom );
    };
    
    /**
     * @description 向innerDom中设置html代码片段
     * @param {String|HTMLElement|JQueryObject} html html字符串片段、html元素、jquery对象
     */
    this.setHtml = function( html ) {
        this.getInnerDom().html( html );
        
        _processLoadUI();
        
        !_destroyed && this.ref();
    };
    
    /**
     * view对象组装视图相关方法
     */
    
    /**
     * @description 显示View
     */
    this.show = function() {
        if ( /^remove$/i.test( _config.hideMode ) ) {
            this.renderInParentView();
        } else {
            // jquery bug
            // this.getDom().show();
            this.getDom()[ 0 ].style.display = 'block';
        }
        this.fireEvent( 'show', [ this ] );
    };
    
    /**
     * @description 隐藏View
     */
    this.hide = function() {
        if ( /^remove$/i.test( _config.hideMode ) ) {
            this.renderOutParentView();
        } else {
            // jquery bug
            // this.getDom().hide();
            this.getDom()[ 0 ].style.display = 'none';
        }
        this.fireEvent( 'hide', [ this ] );
    };
    
    /**
     * @description 刷新组件
     */
    this.ref = function() {
        this.fireEvent( 'refresh', [ this ] );
    };
    
    /**
     * @description 增加一个子view
     * @param {View} subView 子view
     * @param {int} atIndex 新增时插入的顺序 (预留, 暂未实现)
     */
    this.addSubView = function( subView, atIndex ) {
        subView.parentView = this;
        subView.renderInParentView();
        
        if ( !_subViewMap )
            _subViewMap = new Fan.util.Map();
        
        _subViewMap.put( subView.id, subView );
        
        subView.setZIndex( Class.id() );
        
        !_destroyed && this.ref();
        
        // 当前view触发添加子view事件
        this.fireEvent( 'addSubView', [ subView ] );

        // 子view触发被添加到父view事件
        subView.fireEvent( 'addToParentView', [ this ] );
    };
    
    /**
     * @description 增加多个子view
     * @param {Array<View>} subViews 子view
     * @param {int} atIndex 新增时插入的顺序 (预留, 暂未实现)
     */
    this.addSubViews = function( subViews, atIndex ) {
        // 当前view已经初始化完成, 则开始组装子view
        if ( Fan.isArray( subViews ) && subViews.length > 0 ) {
            Class.each( subViews, function( i ) {
                if ( this instanceof Fan.ui.View ) {
                    This.addSubView( this );
                } else {
                    var subView = Class.instance( this.viewClass, this.viewConfig );
                    if ( !subView ) {
                        logger.error( '[视图构造失败] - 未知的视图类名称:' + this.viewClass );
                    } else {
                        This.addSubView( subView );
                    }
                }
            } );
        }
    };
    
    
    /**
     * @description 判断当前view中是否存在指定的子view
     * @param {View|String} subViewOrId 子view或子view的id
     * @returns {boolean} true | false
     */
    this.hasSubView = function( subViewOrId ) {
        if ( !_subViewMap )
            return false;
        
        if ( subViewOrId instanceof Fan.ui.View )
            return _subViewMap.has( subViewOrId.id );
        else
            return _subViewMap.has( subViewOrId );
    };
    
    /**
     * @description 获取所有子view所在的集合对象
     * @returns {Map} 子视图的map集合
     */
    this.getSubViewMap = function() {
        if ( !_subViewMap )
            _subViewMap = new Fan.util.Map();
        return _subViewMap;
    };
    
    /**
     * @description 获取所有子view所在的数组集合对象
     * @returns {Array} 子视图的数组集合
     */
    this.getSubViews = function() {
        var views = [];
        
        if ( !_subViewMap )
            return views;
        
        // 遍历map集合
        _subViewMap.each( function( k ) {
            views.push( this.value );
        } );
        
        return views;
    };
    
    /**
     * @description 获取指定子view
     * @param {String} subViewId 子view的id
     * @returns {View}
     */
    this.getSubView = function( subViewId ) {
        if ( !_subViewMap )
            return null;
        return _subViewMap.get( subViewId );
    };
    
    /**
     * @description 获取所有子view数组
     * @returns {Array} View数组
     */
    this.getAllSubView = function() {
        if ( !_subViewMap )
            return [];
        
        var subViews = [];
        _subViewMap.each( function() {
            subViews.push( this.value );
        } );
        return subViews;
    };
    
    /**
     * @description 获取指定名字的子view列表
     * @param {String} subViewName 子view的名称
     * @returns {Array} View数组
     */
    this.getSubViewsByName = function( subViewName ) {
        if ( !_subViewMap )
            return [];
        
        var subViews = [];
        subViewName += '';
        _subViewMap.each( function() {
            if ( subViewName === (this.value.name + '') ) {
                subViews.push( this.value );
            }
        } );
        return subViews;
    };
    
    /**
     * @description 获取指定view父级view
     * @returns {View} 父级view
     */
    this.getParentView = function() {
        return this.parentView;
    };
    
    /**
     * @description 查找指定名字的子view列表
     * @param {String} subViewName 子view的名称
     * @param {int} findQuantity 查多少个, 缺省-1, 表示查所有
     * @returns {Array} View数组
     */
    this.finds = function( subViewName, findQuantity ) {
        if ( !_subViewMap )
            return [];
        
        var refSubViews = [], refFindCount = {};
        refFindCount.findCount = 0;
        findQuantity = Fan.isNum( findQuantity ) ? findQuantity > -1 ? findQuantity : -1 : -1;
        
        if ( 0 < findQuantity || findQuantity == -1 ) {
            Fan.ui.View.finds( this, subViewName, refSubViews, findQuantity, refFindCount );
        }
        
        return refSubViews;
    };
    
    /**
     * @description 查找第一个出现的指定名字的子view
     * @param {String} subViewName 子view名称
     * @returns {View}
     */
    this.find = function( subViewName ) {
        if ( !_subViewMap )
            return null;
        return this.finds( subViewName, 1 )[ 0 ];
    };
    
    /**
     * @description 从当前view中删除指定view
     * @param {View|String} subViewOrId 子view或子view的id
     * @param doDestroy 是否销毁子view
     */
    this.removeSubView = function( subViewOrId, doDestroy ) {
        if ( !_subViewMap )
            return;
        
        var subView;
        if ( subViewOrId instanceof Fan.ui.View )
            subView = _subViewMap.remove( subViewOrId.id );
        else
            subView = _subViewMap.remove( subViewOrId );
        
        if ( subView ) {
            subView.renderOutParentView();
            subView.parentView = null;
        }
        
        !_destroyed && this.ref();
        
        this.fireEvent( 'removeSubView', [ subView ] );
        subView.fireEvent( 'removeOfParentView', [ this ] );
        
        doDestroy && subView.destroy( doDestroy );
    };
    
    /**
     * @description 从当前view中删除所有子view
     * @param doDestroy 是否销毁子view
     */
    this.removeAllSubView = function( doDestroy ) {
        if ( !_subViewMap && !this.getSubViewMap() )
            return;
        
        _subViewMap.each( function() {
            This.removeSubView( this.value, doDestroy );
        } );
        
        // 避免子类覆盖该方法, 自行管理子view集合的情况
        // TODO 当前类中, 应该全部以统一接口getSubViewMap访问子view集合, 而非用私有变量
        if ( this.getSubViewMap() && this.getSubViewMap() != _subViewMap ) {
            this.getSubViewMap().each( function() {
                This.removeSubView( this.value, doDestroy );
            } );
        }
        
        !_destroyed && this.ref();
    };
    
    /**
     * 设置, 完全使用css方式
     */

    /**
     * @description 设置view对应dom的top样式
     */
    this.setTop = function( top ) {
        this.getDom().css( 'top', top );
    };
    
    /**
     * @description 设置view对应dom的left样式
     */
    this.setLeft = function( left ) {
        this.getDom().css( 'left', left );
    };
    
    /**
     * @description 设置view对应dom的right样式
     */
    this.setRight = function( right ) {
        this.getDom().css( 'right', right );
    };
    
    /**
     * @description 设置view对应dom的bottom样式
     */
    this.setBottom = function( bottom ) {
        this.getDom().css( 'bottom', bottom );
    };
    
    /**
     * 获取尺寸
     */
    this.getHeight = function() {
        return this.getDom().height();
    };
    this.getWidth = function() {
        return this.getDom().width();
    };
    this.getInnerHeight = function() {
        return this.getInnerDom().height();
    };
    this.getInnerWidth = function() {
        return this.getInnerDom().width();
    };
    
    // 尺寸设置
    /**
     * @description 设置view对应dom的height样式
     */
    this.setHeight = function( height ) {
        this.getDom().css( 'height', height );
    };
    
    /**
     * @description 设置view对应dom的width样式
     */
    this.setWidth = function( width ) {
        this.getDom().css( 'width', width );
    };
    
    // 位置相对模式设置
    /**
     * @description 设置view对应dom的position样式
     */
    this.setPosition = function( position ) {
        this.getDom().css( 'position', position );
    };
    
    // 内容边距设置
    /**
     * @description 设置view对应dom的padding样式
     */
    this.setPadding = function( padding ) {
        this.getDom().css( 'padding', padding );
    };
    
    // 边框设置
    /**
     * @description 设置view对应dom的border样式
     */
    this.setBorder = function( border ) {
        this.getDom().css( 'border', border );
    };
    
    // 背景色设置
    /**
     * @description 设置view对应dom的background-color样式
     */
    this.setBackgroundColor = function( color ) {
        this.getDom().css( 'background-color', color );
    };
    
    // 背景图设置
    /**
     * @description 设置view对应dom的background-image样式
     */
    this.setBackgroundImage = function( image ) {
        this.getDom().css( 'background-image', image );
    };
    
    // 设置覆盖层次
    /**
     * @description 设置view对应dom的z-index样式
     */
    this.setZIndex = function( zIndex ) {
        this.getDom().css( 'z-index', zIndex >> 0 );
    };
    
    // 样式名设置
    /**
     * @description 重置view对应dom的class样式表
     */
    this.setClass = function( className ) {
        this.getDom()[ 0 ].className = className;
    };
    
    /**
     * @description 给view对应dom的增加class样式表
     */
    this.addClass = function( className ) {
        this.getDom().addClass( className );
    };
    
    /**
     * @description 移除view对应dom的class样式表
     */
    this.removeClass = function( className ) {
        this.getDom().removeClass( className );
    };
    
    /**
     * @description 移除view对应dom的所有class样式表
     */
    this.removeAllClass = function() {
        this.getDom()[ 0 ].className = '';
    };
    
    /**
     * @description 判断view对应dom的是否包含指定的class样式表
     */
    this.hasClass = function( className ) {
        this.getDom().hasClass( className );
    };
    
    // 样式表扩展设置
    /**
     * @description 重置view对应dom的内联style样式
     */
    this.setStyle = function( style ) {
        var elem = this.getDom()[ 0 ];
        elem.style.cssText = style;
    };
    
    /**
     * @description 新增view对应dom的内联style样式
     */
    this.addStyle = function( style ) {
        var elem = this.getDom()[ 0 ];
        Fan.dom.css( elem, style );
    };
    
    /**
     * @description 获取view对应dom的内联style样式
     */
    this.getStyle = function() {
        var elem = this.getDom()[ 0 ];
        var cssText = elem.style.cssText;
        return cssText;
    };
    
    /**
     * @description 移除view对应dom的内联style样式
     */
    this.removeStyle = function( style ) {
        var cssText = this.getStyle();
        var cssArr = cssText.split( /;+/ );
        Class.each( cssArr, function( i ) {
            var cssName = this.toLowerCase().split( /:/ );
            if ( cssName == style ) {
                cssArr[ i ] = '';
                return false;
            }
        } );
        cssText = cssArr.join( ';' );
        cssText = cssText.replace( /;+/g, ';' );
        var elem = this.getDom()[ 0 ];
        elem.style.cssText = cssText;
    };
    
    /**
     * @description 移除所有view对应dom的内联style样式
     */
    this.removeAllStyle = function() {
        var elem = this.getDom()[ 0 ];
        elem.style.cssText = '';
    };
    
    /**
     * @description 判断view对应dom的内联style样式中是否包含指定样式
     */
    this.hasStyle = function( style ) {
        var cssText = this.getStyle();
        var has = cssText.toLowerCase().split( style.toLowerCase() ).length > 1;
        return has;
    };
    
    /**
     * @description 获取view对应dom的内联style样式
     * @param {boolean} relative 是否只取相对带有position样式且值为absolute|relative父容器的相对位置
     * @returns {Object} 返回xy坐标:
     * {
     *   x : 0, // 相对浏览器的绝对位置left
     *   y : 0, // 相对浏览器的绝对位置top
     *   xx : 0, // 相对最近带有position样式且值为absolute|relative父容器的相对位置left
     *   yy : 0  // 相对最近带有position样式且值为absolute|relative父容器的相对位置top
     * }
     */
    this.getXY = function( relative  ) {
        var xy = Fan.dom.getXY( this.getDom()[ 0 ], relative );
        return xy;
    };
    
    // 重绘, 刷新css
    /**
     * @description 重绘, 刷新css, 解决浏览器不刷新css的bug
     */
    this.repaint = function( lazyTime ) {
        setTimeout( function() {
            document.body && (document.body.className += '');
            setTimeout( function() {
                document.body && (document.body.className += '');
                lazyTime = null;
            }, 50 );
        }, lazyTime >> 0 );
    };
    
    /**
     * @description 快捷访问dom中元素
     * @returns {JQueryObject}
     */
    this.$ = function( selector, context ) {
        return this.getDom().find( selector, context );
    };
    
    /**
     * @description 在dom通过delegate绑定事件, 注意: 回调函数中的this => { view:this, elem:HTMLElement }
     * @param {String} selector 选择器
     * @param {String} types 事件类型
     * @param {Function} handler 处理函数
     */
    this.$on = function( selector, types, data, handler ) {
        if ( arguments.length == 2 ) {
            handler  = types;
            var s    = (selector + '').split( /\s+/ );
            types    = s.length > 1 ? s[ s.length - 1 ] : selector;
            selector = s.length > 1 ? s.slice( 0, s.length - 1 ).join( ' ' ) : '';
        }
        var cb;
        if ( Fan.isFunction( data ) ) {
            //data = Fan.proxy( data, this );
            cb = data;
            handler = function() {
                cb.apply( {
                    view : This,
                    elem : this
                }, arguments );
            };
        } else if ( Fan.isFunction( handler ) ) {
            //fn = Fan.proxy( fn, this );
            cb = handler;
            handler = function() {
                cb.apply( {
                    view : This,
                    elem : this
                }, arguments );
            };
        }
        
        // 手指事件转换成平台所支持的事件
        types = Fan.util.TouchManager.eventName( types );
        
        // return _dom.delegate( selector, types, data, handler );
        Fan.$on( this.getDom()[ 0 ], selector, types, handler );
    };
    
    /**
     * @description 解除在dom通过delegate绑定事件
     * @param {String} selector 选择器
     * @param {String} types 事件类型
     * @param {Function} handler 处理函数
     */
    this.$un = function( selector, types, handler ) {
        // 暂未实现
        // return _dom.undelegate( selector, types, handler );
        Fan.$un( this.getDom()[ 0 ], selector, types, handler );
    };
    
    /**
     * @description 尝试获取滚动事件权限, 建议用该方法判断后再使用滚动事件, 避免多个view同时触发滚动造成干扰
     *              用于mousemove|touchmove事件中判断
     * @param {boolean} true:若有权限, 则锁定, 缺省为false
     * @returns {boolean}
     */
    this.getScrollAuthority = function( lock ) {
        return Fan.ui.View.getScrollAuthority( this, lock );
    };
    
    /**
     * @description 取消当前view的滚动事件权限
     */
    this.cancelScrollAuthority = function() {
        Fan.ui.View.getScrollingView() == this && Fan.ui.View.setScrollingView( null );
    };
    
    /**
     * @description set构造配置参数,但并不进行重构ui
     */
    this.setConfig = function( config ) {
        _config = config;
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
     * @param {boolean} doDestroy 是否销毁子view
     */
    this.destroy = function( doDestroy ) {
        if ( _destroyed )
            return;
        _destroyed = true;
        logger.info( '[UI] - 销毁:' + this.id );
        this.fireEvent( 'destroy' );
        this.cancelScrollAuthority();
        this.parentView && this.parentView.removeSubView && this.parentView.removeSubView( this, doDestroy );
        this.removeAllSubView( doDestroy );
        _subViewMap && _subViewMap.destroy();
        
        if ( this.getInnerDom() )
            this.getInnerDom().remove();
        
        if ( this.getDom() ) {
            // 移除dom上的事件
            if ( _config.useUserInterface ) {
                var elem = this.getDom()[ 0 ];
                Fan.removeEvent( elem, _swipeleft );
                Fan.removeEvent( elem, _swiperight );
                Fan.removeEvent( elem, _tap );
                Fan.removeEvent( elem, _doubletap );
                Fan.removeEvent( elem, _drag );
                Fan.removeEvent( elem, _dragend );
                Fan.removeEvent( elem, _tapdown );
                Fan.removeEvent( elem, _tapup );
//                Fan.util.TouchManager.remove( this.getDom() );
                _swipeleft = _swiperight = _tap = _tapdown = _tapup = _doubletap = _drag = _dragend = elem = null;
            }
            this.getDom().remove();
        }
        
        _config = _dom = _innerDom = _subViewMap = _isInited = _parentDom = _processLoadUI = null;
        
        // 从缓存中移除
        Fan.ui.View.removeUI( this );
        
        Super();
        _destroyed = null;
    };
} );

/**
 * 静态方法
 */
(function( View ) {
    // 所有的ui集合
    var uiMap  = Class.map(),
        uiList = [],
        scrollingView = null;
    
    /**
     * 全局状态, 获取正在占居滚动条动作状态的view
     * 注: 在使用自定义滚动面板的时候, 必要时, 需要设置滚动条状态, 以便其他滚动面板做判断
     */
    View.getScrollingView = function() {
        return scrollingView || null;
    };
    View.setScrollingView = function( view ) {
        scrollingView = view;
    };
    // 尝试获取滚动事件权限
    View.getScrollAuthority = function( view, lock ) {
        // logger.warn(scrollingView ? scrollingView.getClass().className : 'no scrollingView');
        if ( !(view instanceof View) )
            return false;
        if ( scrollingView == view ) {
            return true;
        }
        if ( !scrollingView ) {
            lock && (scrollingView = view);
            return true;
        }
        return false;
    };
    
    // 获取缓存对象
    View.getCache = function() {
        return {
            map  : uiMap,
            list : uiList
        };
    };
    
    // 根据id获取ui对象
    View.getUI = function( uiId ) {
        if ( uiId == null )
            return null;
        
        uiId = uiId + '';
        
        // 尝试取出来
        var ui = uiMap.get( uiId );
        
        if ( ui ) {
            // 若存在, 且id相同, 则返回
            if ( (ui.id + '') === uiId )
                return ui;
            
            //  否则, 属于脏数据(修改过id), 从快速查找的集合删除
            else {
                uiMap.remove( uiId );
                
                // 尝试修复
                uiMap.put( ui.id + '', ui );
                
                ui = null;
            }
        }
        
        // 若出现id错误, 没有找到ui, 则在全局缓存中寻找
        if ( !ui ) {
            for( var i = 0, len = uiList.length; i < len; ++i ) {
                ui = uiList[ i ];
                if ( ui && (ui.id + '') === uiId ) {
                    // 以正确的id作为key从新放到map中
                    uiMap.put( ui.id + '', ui );
                    break;
                }
            }
            ui = null;
        }
        
        return ui || null;
    };
    
    // 添加一个ui到缓存中
    View.addUI = function( ui ) {
        if ( !ui )
            return;
        
        uiList.push( ui );
        uiMap.put( ui.id + '', ui );
    };
    
    // 从缓存中清除ui
    View.removeUI = function( ui ) {
        if ( !ui )
            return;
        
        var uiId = ui.id + '';

        // 从全局ui集合中清除
        for ( var u, i = 0, len = uiList.length; i < len; ++i ) {
            u = uiList[ i ];
            if ( u === ui ) {
                uiList[ i ] = uiList[ uiList.length - 1 ];
                uiList[ uiList.length - 1 ] = null;
                uiList.length = uiList.length - 1;
                break;
            }
        }
        
        // 从快速查找集合中清楚
        var old = uiMap.remove( uiId );
        
        // 判断误删
        if ( old && (old.id + '') !== uiId ) {
            // 从新以正确的id加入到集合中
            uiMap.put( old.id + '', old );
            
            // 尝试修复后再删除
            var u = View.getUI( uiId );
            if ( u )
                uiMap.remove( uiId );
        }
    };
    
    /**
     * 根据指定名字和数量,查找子view集合
     */
    View.finds = function( view, subViewName, refSubViews, findQuantity, refFindCount ) {
        refFindCount = refFindCount || {};
        refFindCount.findCount = refFindCount.findCount || 0;
        
        // 此判断存在多线程问题, 单线程无事
        if ( refFindCount.findCount >= findQuantity && findQuantity != -1 ) {
            return false;
        }
        
        var svm = view.getSubViewMap();
        subViewName += '';
        svm.each( function() {
            
            var subView = this.value;
            if ( subViewName === (subView.name + '') ) {
                refFindCount.findCount += 1;
                refSubViews.push( subView );
                // 此判断存在多线程问题, 单线程无事
                if ( refFindCount.findCount >= findQuantity && findQuantity != -1 ) {
                    return false;
                }
            }
            
            View.finds( subView, subViewName, refSubViews, findQuantity, refFindCount );
         
            // 此判断存在多线程问题, 单线程无事
            if ( refFindCount.findCount >= findQuantity && findQuantity != -1 ) {
                return false;
            }
        } );
        svm = view = subViewName = refSubViews = findQuantity = refFindCount = null;
    };
    
})( Fan.ui.View );
