/**
 * @fileOverview 基本页视图
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

Import( 'Fan.ui.View' );

/**
 * @author Fan
 * @class Fan.ui.PageView
 * @constructor PageView
 * @extends Fan.ui.View
 * @description 简单的上中下三栏视图, 提供头部,主体,尾部
 * @see The <a href="#">Fan</a >.
 * @example new PageView( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 * ### config 配置参数说明 ###
 * useScroll   - (boolean, 可选, 默认:false) - 是否使用滚动条
 * hideHeader  - (boolean, 可选, 默认:false) - 是否隐藏头部
 * hideFooter  - (boolean, 可选, 默认:false) - 是否隐藏尾部
 * headerStyle - (String, 可选)
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
Class( 'Fan.ui.PageView', Fan.ui.View, function() {
    var
    _config,
    _headerView,
    _bodyView,
    _footerView,
    _scroll,
    
    // 是否使用滚动条
    _useScroll;
    
    /**
     * @constructor 
     */
    this.PageView = function( config ) {
        // 当前配置
        _config = Class.apply( {
            // 是否开启用户交互
            useUserInterface : false,
            
            // 是否使用滚动条
            useScroll : false,
            
            // 是否隐藏头部,尾部
            hideHeader : false,
            hideFooter : false,
            
            // 头部和尾部的样式
            headerStyle : '',
            footerStyle : '',
            
            // 头部和尾部的html片段
            headerHtml : '',
            footerHtml : '',
            
            // 头部与尾部view中的子view集合
            headerSubViews : [],
            footerSubViews : []
        }, config );
        
        // 父类配置
        config = Class.apply( {
            dom : '<div class="layout-body" style="width:100%;"></div>',
            // 是否开启用户交互
            useUserInterface : false
        }, config );
        
        // 屏蔽参数
        // delete config.html;
        // delete config.subViews;
        delete config.headerSubViews;
        delete config.footerSubViews;
        delete config.headerStyle;
        delete config.footerStyle;
        delete config.headerHtml;
        delete config.footerHtml;
        
        _useScroll = !!_config.useScroll;

        Super( config );
     
        // 渲染到dom中时, 延迟刷新一下
        this.on( 'render', function() {
            Fan.defer( function() {
                _scroll && _scroll.refresh();
            }, 500 );
        } );
    };
    
    /**
     * @description 初始化, 构造对象时会被调用
     */
    this.init = function() {
        // 构造三大部件
        _headerView = new Fan.ui.View( {
            dom : '<div><div class="layout-body ui-view-inner-dom"></div></div>',
            innerDom : '> .ui-view-inner-dom',
            className : 'layout-header',
            innerDomClassName : 'layout-bgcolor-transparent',
            useCssConfig : false,
            html : _config.headerHtml,
            style : _config.headerStyle,
            hide : _config.hideHeader,
            subViews : _config.headerSubViews,
            on : {
                'init' : function() {
                    _headerView = this;
                },
                'render' : function() {
                    if ( !_useScroll )
                        return;
                    _scroll && _scroll.refresh();
                },
                'hide' : function() {
                    if ( !This.isInited() )
                        return;
                    _bodyView.setClass( _footerView.isShow() ? 'layout-body-t' : 'layout-body' );
                    _scroll && _scroll.refresh();
                },
                'show' : function() {
                    if ( !This.isInited() )
                        return;
                    _bodyView.setClass( _footerView.isShow() ? 'layout-body-ht' : 'layout-body-h' );
                    _scroll && _scroll.refresh();
                }
            }
        } );
        _bodyView = new Fan.ui.View( {
            dom : '<div><div class="layout-body ui-view-inner-dom"></div></div>',
            innerDom : '> .ui-view-inner-dom',
            className : _config.hideHeader ? (_config.hideFooter ? 'layout-body' : 'layout-body-t') : (_config.hideFooter ? 'layout-body-h' : 'layout-body-ht'),
            innerDomStyle : _useScroll ? 'bottom:auto;height:auto;' : '',
            useCssConfig : false,
            useUserInterface : _config.useUserInterface,
            on : {
                'init' : function() {
                    _bodyView = this;
                },
                'refresh' : function() {
                    if ( !_useScroll )
                        return;
                    _scroll && _scroll.refresh();
                },
                'inited' : function() {
                    _scroll && _scroll.refresh();
                },
                'render' : function() {
                    if ( !_useScroll )
                        return;
                    _scroll && _scroll.enable();
                },
                'unrender' : function() {
                    if ( !_useScroll )
                        return;
                    _scroll && _scroll.disable();
                }
            }
        } );
        _footerView = new Fan.ui.View( {
            className : 'layout-footer',
            useCssConfig : false,
            html : _config.footerHtml,
            style : _config.footerStyle,
            hide : _config.hideFooter,
            subViews : _config.footerSubViews,
            on : {
                'init' : function() {
                    _footerView = this;
                },
                'render' : function() {
                    if ( !_useScroll )
                        return;
                    _scroll && _scroll.refresh();
                },
                'hide' : function() {
                    if ( !This.isInited() )
                        return;
                    _bodyView.setClass( _headerView.isShow() ? 'layout-body-h' : 'layout-body' );
                    _scroll && _scroll.refresh();
                },
                'show' : function() {
                    if ( !This.isInited() )
                        return;
                    _bodyView.setClass( _headerView.isShow() ? 'layout-body-ht' : 'layout-body-t' );
                    _scroll && _scroll.refresh();
                }
            }
        } );
        
        // 先初始化父类对象
        Super();
        
        // 将三大件加入到当前view中
        _bodyView.setParentDom( Super.getInnerDom() );
        _footerView.setParentDom( Super.getInnerDom() );
        _headerView.setParentDom( Super.getInnerDom() );
        
        // 不走this.addSubView,避免受到子类影响
        Super.addSubView( _headerView );
        Super.addSubView( _bodyView );
        Super.addSubView( _footerView );
        
        // 重新调整一下层次
        _bodyView.setZIndex( Class.id() );
        _footerView.setZIndex( Class.id() );
        _headerView.setZIndex( Class.id() );
        
        // 设置滚动条是否启用
        this.useScroll( _useScroll );
    };
    
    /**
     * @description 重写此方法, 使之新增的子view或设置的html, 皆是向bodyView中增加
     * @returns {JQueryObject}
     */
    this.getInnerDom = function() {
        if ( _bodyView )
            return _bodyView.getInnerDom();
        return Super();
    };
    
    /**
     * @description 获取头部视图
     * @returns {View}
     */
    this.getHeaderView = function() {
        return _headerView;
    };
    
    /**
     * @description 获取主体视图
     * @returns {View}
     */
    this.getBodyView = function() {
        return _bodyView;
    };
    
    /**
     * @description 获取脚部视图
     * @returns {View}
     */
    this.getFooterView = function() {
        return _footerView;
    };
    
    /**
     * @description 获取滚动控制组件
     * @returns {Object} iScroll组件对象
     */
    this.getScroll = function() {
        return _scroll;
    };
    
    /**
     * @description 获取或设置是否启用滚动条
     * @param {boolean} useScroll
     */
    this.useScroll = function( useScroll ) {
        if ( Fan.isBoolean( useScroll ) ) {
            _useScroll = useScroll;
            
            _scroll && _scroll.destroy();
            
            if ( _useScroll ) {
                if ( Class.ieDocMode < 9 ) {
                    this.getBodyView().getInnerDom().css( 'overflow', 'auto' );
                } else {
                    // 优先使用iScroll5
                    if ( window.IScroll ) {
                        // 初始化IScroll插件:iScroll-5
                        _scroll = new IScroll( this.getBodyView().getDom()[ 0 ], {
                            // 显示滚动条
                            scrollbars: true,
                            // 滚动条交互,允许拖拽滚动条
                            interactiveScrollbars: true,
                            
                            resizeScrollbars: true,
    
                            mouseWheel: true,
                            mouseWheelSpeed: 20,
    
                            snapThreshold: 0.334,
    
                            // INSERT POINT: OPTIONS 
    
                            startX: 0,
                            startY: 0,
                            scrollY: true,
                            scrollX: false,
                            freeScroll: false,
                            // fadeScrollbars: true,       // 不滚动时隐藏滚动条
                            shrinkScrollbars: 'scale',  // 弹性滚动条
                            directionLockThreshold: 5,
                            momentum: true,
    
                            bounce: true,
                            bounceTime: 600,
                            bounceEasing: 'quadratic', // 弹性动画方式
    
                            // eventPassthrough: true, // 事件传递
                            preventDefault: true,
                            preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/ },
    
                            HWCompositing: true,
                            useTransition: true,
                            useTransform: true
                            
                            /*
                            // 卡片式
                            snap: true,
                            snapSpeed: 400,
                            */
                            
                            /*
                            // 随主滚动而滚动的项目
                            indicators : [ {
                                el : document.getElementById( 'starfield1' ),
                                resize : false,
                                ignoreBoundaries : true,
                                speedRatioY : 0.4
                            }, {
                                el : document.getElementById( 'starfield2' ),
                                resize : false,
                                ignoreBoundaries : true,
                                speedRatioY : 0.2
                            } ]
                            */
                        } );
                        
                        // 每次点击时, 恢复被"异常禁用滚动"的状态
                        this.getBodyView().getInnerDom().on( Fan.util.TouchManager.eventName( 'touchstart' ), function () {
                            _useScroll && _scroll && !_scroll.enabled && _scroll.enable();
                        } );
                        
                        // 默认隐藏滚动条
                        _scroll.indicators[ 0 ].indicatorStyle[ 'opacity' ] = '0';
                        
                        // 滚动条在滚动时显示出来,滚动结束隐藏
                        _scroll.on( 'scrollStart', function () {
                            // 获取并锁定滚动事件权限
                            if ( !This.getBodyView().getScrollAuthority( true ) ) {
                                // logger.info( '[IScroll] - 无事件权限, 放弃滚动 - scrollStart' );
                                this.disable();
                                return;
                            }
                            
                            // 下标0为纵向滚动条,下标1为横向滚动条,自定义indicators从下标2开始
                            if ( this.indicators[ 0 ] ) {
                                this.indicators[ 0 ].indicatorStyle[ 'transition-duration' ] = '0ms';
                                this.indicators[ 0 ].indicatorStyle[ 'opacity' ] = '0.8';
                            }
                        });
                        _scroll.on( 'scrollEnd', function () {
                            try {
                                // 释放滚动权限
                                // logger.info( '[IScroll] - 释放滚动权限 - scrollEnd' );
                                This.getBodyView().cancelScrollAuthority();
                            } catch ( e ) {}
                            this.enable();
                            
                            if ( this.indicators[ 0 ] ) {
                                this.indicators[ 0 ].indicatorStyle[ 'transition-duration' ] = '600ms';
                                this.indicators[ 0 ].indicatorStyle[ 'opacity' ] = '0';
                            }
                        });
                        _scroll.on( 'scrollCancel', function () {
                            try {
                                // 释放滚动权限
                                // logger.info( '[IScroll] - 释放滚动权限 - scrollCancel' );
                                This.getBodyView().cancelScrollAuthority();
                            } catch ( e ) {}
                            this.enable();
                            
                            if ( this.indicators[ 0 ] ) {
                                this.indicators[ 0 ].indicatorStyle[ 'transition-duration' ] = '600ms';
                                this.indicators[ 0 ].indicatorStyle[ 'opacity' ] = '0';
                            }
                        });
                        
                        // css bug for chrome, translateZ 无法被更高的z-index容器遮盖, 故超出隐藏之
                        if ( Class.chrome ) {
                            this.getBodyView().getDom().css( 'overflow', 'hidden' );
                        }
                        
                        _scroll.refresh();
                    } else if ( window.iScroll ) {
                        // 初始化iScroll插件:iScroll-4
                        _scroll = new iScroll( this.getBodyView().getDom()[ 0 ], {
                            // 在iScroll管理的滚动区域中,若触点不是form表单元素,则阻止默认行为,以提高效率
                            onBeforeScrollStart : function( event ) {
                                var elem = Fan.Event.getTarget( event );
                                if ( !/^(input|textarea|select|option|button)$/i.test( elem.tagName ) ) {
                                    Fan.Event.cancel( event );
                                    // logger.warn( 'iscroll.onBeforeScrollStart:cancel event' );
                                }
                            },
                            onBeforeScrollMove : function( event ) {
                                // 获取获取并锁定事件权限
                                if ( !This.getBodyView().getScrollAuthority() ) {
                                    // logger.info( '[iScroll] - 无事件权限, 放弃滚动' );
                                    return false;
                                }
                            },
                            onScrollMove : function( event ) {
                                This.getBodyView().getScrollAuthority( true );
                                // logger.warn('onScrollMove:' + event.type)
                            },
                            onScrollEnd : function() {
                                try {
                                    // 释放滚动权限
                                    This.getBodyView().cancelScrollAuthority();
                                } catch ( e ) {}
                            },
                            onTouchEnd : function() {
                                try {
                                    // 释放滚动权限
                                    This.getBodyView().cancelScrollAuthority();
                                } catch ( e ) {}
                            },
                            hScroll : false,
                            vScroll : true,
                            hScrollbar : false,
                            vScrollbar : true,
                            fixedScrollbar : false,
                            hideScrollbar : true,
                            bounce : true,
                            momentum : true,
                            lockDirection : true
                        } );
                        
                        _scroll.refresh();
                        
                    } else {
                        logger.warn( '[缺少依赖文件] - iscroll.js' );
                    }
                }
                
                this.getBodyView().getDom().attr( 'ui-use-scroll', true );
            } else {
                if ( Class.ieDocMode < 9 ) {
                    this.getBodyView().getInnerDom().css( 'overflow', 'hidden' );
                }
                this.getBodyView().getDom().removeAttr( 'ui-use-scroll' );
            }
        }
        
        return _useScroll;
    };
    
    /**
     * @description 刷新
     */
    this.ref = function() {
        Super();
        _scroll && _scroll.refresh();
        Fan.defer( function() {
            _scroll && _scroll.refresh();
        }, 100 );
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
        _scroll && _scroll.destroy();
        _headerView = _bodyView = _footerView = _scroll = _useScroll = _config = null;
        Super( doDestroy );
    };
} );
