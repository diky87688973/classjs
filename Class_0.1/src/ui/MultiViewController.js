/**
 * @fileOverview 多栏视图控制器
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

Import( 'Fan.ui.ViewController' );

/**
 * @author Fan
 * @class Fan.ui.MultiViewController
 * @constructor MultiViewController
 * @extends Fan.ui.ViewController
 * @description 简单的多栏视图控制器, 该类滑动使用到了css3部分的:transform:translate(x,y)
 * @see The <a href="#">Fan</a >.
 * @example new MultiViewController( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 *  // 中间控制器在可视区域中的剩余比例
 *  overSize : 0.2,
 *  
 *  // 默认就加载好的子视图控制器
 *  leftViewController : { controllerClass, controllerConfig },
 *  centerViewController : { controllerClass, controllerConfig },
 *  rightViewController : { controllerClass, controllerConfig },
 *  
 *  // 中间view是否允许拖动
 *  dragCenter : false,
 *  
 *  on - 事件监听
 *  id - 控制器的id
 *  name - 控制器的名称
 *  viewClass - 控制器自身的view
 *  viewConfig - 控制器构造自身view时的传入参数, 详细见viewClass参数类对应的构造配置参数
 * }
 */
Class( 'Fan.ui.MultiViewController', Fan.ui.ViewController, function() {
    var
    _config,
    _leftWrapView,
    _rightWrapView,
    _centerWrapView,
    _leftViewController,
    _rightViewController,
    _centerViewController,
    _currViewController,
    
    // 中间控制器在可视区域中的剩余比例
    _overSize,
    // 匹配并抓取translate样式值的正则
    _reg_i = /:\s*translate\s*\(\s*(-?\d+\.?\d*)(?:px|%)?(?:\s*,\s*(-?\d+\.?\d*)(?:px|%)?)?\s*\)/i,
    _reg_ig = /:\s*translate\s*\(\s*(-?\d+\.?\d*)(?:px|%)?(?:\s*,\s*(-?\d+\.?\d*)(?:px|%)?)?\s*\)/ig,
    _id,
    _dragCenter;
    
    /**
     * @constructor 
     */
    this.MultiViewController = function( config ) {
        _config = config || {};
        
        Class.apply( _config, {
            overSize : 0.2,
            // 提供3个默认的视图控制器
            leftViewController : {
                controllerClass : 'Fan.ui.ViewController',
                controllerConfig : {}
            },
            centerViewController : {
                controllerClass : 'Fan.ui.ViewController',
                controllerConfig : {}
            },
            rightViewController : {
                controllerClass : 'Fan.ui.ViewController',
                controllerConfig : {}
            },
            // 中间view是否允许拖动
            dragCenter : false
        }, false );
        
        // 试图控制器自身view的简便配置参数
        _overSize = _config.overSize;
        _dragCenter = _config.dragCenter;
        _id = Class.id();
        var viewConfig = Class.apply( {
            useUserInterface : true,
            dom : '<div class="layout-body"></div>',
            subViews : [ {
                viewClass : 'Fan.ui.View',
                viewConfig : {
                    useUserInterface : true,
                    id : 'left-view' + _id,
                    dom : '<div><div class="layout-body ui-inner-dom"></div><div style="background-color:rgba(0,0,0,0.01);" class="layout-cover hide"></div></div>',
                    className : 'layout-left-body',
                    innerDom : '.ui-inner-dom',
                    style : 'width:' + ((1 - _overSize) * 100) + '%;'
                }
            }, {
                viewClass : 'Fan.ui.View',
                viewConfig : {
                    useUserInterface : true,
                    id : 'center-view' + _id,
                    dom : '<div><div class="layout-body ui-inner-dom"></div><div class="layout-cover hide"></div></div>',
                    className : 'layout-center-body',
                    innerDom : '.ui-inner-dom',
                    style : 'left:' + ((1 - _overSize) * 100) + '%;'
                }
            }, {
                viewClass : 'Fan.ui.View',
                viewConfig : {
                    useUserInterface : true,
                    id : 'right-view' + _id,
                    dom : '<div><div class="layout-body ui-inner-dom"></div><div class="layout-cover hide"></div></div>',
                    className : 'layout-right-body',
                    innerDom : '.ui-inner-dom',
                    style : 'background-color:white;left:' + ((2 - _overSize) * 100) + '%;width:' + ((1 - _overSize) * 100) + '%;'
                }
            } ]
        }, _config.viewConfig );
        
        Super( {
            viewClass : _config.viewClass || 'Fan.ui.View',
            viewConfig : viewConfig,
            id : _config.id,
            name : _config.name,
            on : _config.on
        } );

        // 自带样式
        this.getView().addStyle( '-moz-transform:translate(0px,0px);-webkit-transform:translate(0px,0px);transform:translate(0px,0px);overflow:hide;' );
    
        // 默认左侧为当前可视区域控制器
        this.gotoLeftViewController( 0 );
    };
    
    /**
     * @description 初始化, 构造对象时会被调用
     */
    this.init = function() {
        // 默认的3个视图控制器
        var leftVC, centerVC, rightVC;
        if ( _config.leftViewController ) {
            if ( _config.leftViewController instanceof Fan.ui.ViewController ) {
                leftVC = _config.leftViewController;
            } else {
                leftVC = Class.instance( _config.leftViewController.controllerClass, _config.leftViewController.controllerConfig );
            }
        }
        if ( _config.centerViewController ) {
            if ( _config.centerViewController instanceof Fan.ui.ViewController ) {
                centerVC = _config.centerViewController;
            } else {
                centerVC = Class.instance( _config.centerViewController.controllerClass, _config.centerViewController.controllerConfig );
            }
        }
        if ( _config.rightViewController ) {
            if ( _config.rightViewController instanceof Fan.ui.ViewController ) {
                rightVC = _config.rightViewController;
            } else {
                rightVC = Class.instance( _config.rightViewController.controllerClass, _config.rightViewController.controllerConfig );
            }
        }
        
        var view = this.getView();
        _leftWrapView = view.getSubView( 'left-view' + _id );
        _centerWrapView = view.getSubView( 'center-view' + _id );
        _rightWrapView = view.getSubView( 'right-view' + _id );
        
        // 设置3个视图控制器
        this.setLeftViewController( leftVC );
        this.setCenterViewController( centerVC );
        this.setRightViewController( rightVC );
    };
    
    /**
     * @description 初始化事件, 构造对象时会被调用
     */
    this.initEvent = function() {
        // 用于中间控制器的位置复位
        var
        // 需要复位标志
        _has_fuwei = false,
        // 复位处理函数
        _fuwei = function ( event ) {
            if ( !_has_fuwei )
                return;
            _has_fuwei = false;
            if ( _currViewController == _centerViewController ) {
                var me = this.controller;
                var wrap = me.getView().getInnerDom()[ 0 ];
                var xy = Fan.dom.getXY( _centerWrapView.getDom()[ 0 ] );
                var curxy = { xx : 0, yy : 0 };
                var cssText = wrap.style.cssText;
                cssText.replace( _reg_i, function( v1, v2, v3 ) {
                    curxy.xx = v2 >> 0;
                    curxy.yy = v3 >> 0;
                } );
                
                // y坐标始终为0
                curxy.yy = 0;
                
                Fan.anim( wrap, {
                    test : true,
                    start : curxy.xx,
                    end : -xy.xx
                }, {
                    longTime : 200,
                    step : function( now, progress ) {
                        var css = cssText.replace( _reg_ig, ':translate(' + now + 'px,' + curxy.yy + 'px)' );
                        wrap.style.cssText = css;
                    },
                    callback : function() {
                        //_currViewController = _centerViewController;
                        me = wrap = xy = curxy = cssText = null;
                    } 
                } );
            }
        };
        
        _leftWrapView.on( 'tap', function() {
            this.parentView.controller.gotoLeftViewController();
        } );
        
        _centerWrapView.on( 'tap', function() {
            _fuwei.apply( this.parentView, arguments );
            this.parentView.controller.gotoCenterViewController();
        } );
        _centerWrapView.on( 'swipeleft', function() {
            if ( !_dragCenter )
                return;
            _has_fuwei = false;
            if ( _currViewController == _centerViewController )
                this.parentView.controller.gotoRightViewController();
            else if ( _currViewController == _leftViewController )
                this.parentView.controller.gotoCenterViewController();
        } );
        _centerWrapView.on( 'swiperight', function() {
            if ( !_dragCenter )
                return;
            _has_fuwei = false;
            if ( _currViewController == _centerViewController )
                this.parentView.controller.gotoLeftViewController();
            else if ( _currViewController == _rightViewController )
                this.parentView.controller.gotoCenterViewController();
        } );
        
        _rightWrapView.on( 'tap', function() {
            this.parentView.controller.gotoRightViewController();
        } );
        
        // 临时缓存css:translate的坐标记录, 在拖动结束时清空
        var translate = null;
        this.getView().on( 'drag', function( event ) {
            if ( !_dragCenter )
                return;
            
            if ( _currViewController != _centerViewController ) {
                // 仅在当前为中间视图控制器时,才可拖动
                translate = null;
                return;
            }
            
            // 发生过拖动, 则需要复位
            _has_fuwei = true;
            
            var args = event._args;
            var data = args[ 1 ];
        
            var me = this.controller;
            var wrap = me.getView().getInnerDom()[ 0 ];
            var xy = Fan.dom.getXY( _centerWrapView.getDom()[ 0 ] );
            var cssText = wrap.style.cssText;
            
            // 第一次记录css:translate的坐标值
            if ( !translate ) {
                translate = { x : 0, y : 0 };
                cssText.replace( _reg_i, function( v1, v2, v3 ) {
                    translate.x = v2 >> 0;
                    translate.y = v3 >> 0;
                } );
                
                // y坐标始终为0
                translate.y = 0;
            }
            
            // 始终只允许左右拖动,故y间距始终为0
            data.speedY = 0;
            
            var css = cssText.replace( _reg_ig, ':translate(' + (translate.x + data.speedX) + 'px,' + (translate.y + data.speedY) + 'px)' );
            wrap.style.cssText = css;
            
            me = wrap = data = xy = event = args = css = cssText = null;
        } );
        this.getView().on( 'dragend', function( event ) {
            // 拖动结束, 清除css:translate的坐标记录
            _fuwei.apply( this, arguments );
            translate = null;
        } );
    };
    
    /**
     * @description 将可视区域定位到左侧控制器
     * @param {int} longTime 移动过程所占的毫秒时长
     */
    this.gotoLeftViewController = function( longTime ) {
        if ( _currViewController == _leftViewController )
            return;
        
        var me = this;
        var wrap = this.getView().getInnerDom()[ 0 ];
        var xy = Fan.dom.getXY( _leftWrapView.getDom()[ 0 ] );
        var curxy = { xx : 0, yy : 0 };
        var cssText = wrap.style.cssText;
        cssText.replace( _reg_i, function( v1, v2, v3 ) {
            curxy.xx = v2 >> 0;
            curxy.yy = v3 >> 0;
        } );
        
        // y坐标始终为0
        curxy.yy = 0;
        //logger.warn( 'x:' + curxy.xx + ', y:' + curxy.yy );
        
        Fan.anim( wrap, {
            test : true,
            start : curxy.xx,
            end : -xy.xx
        }, {
            longTime : Fan.isNumber( longTime ) ? longTime : 400,
            step : function( now, progress ) {
                var css = cssText.replace( _reg_ig, ':translate(' + now + 'px,' + curxy.yy + 'px)' );
                wrap.style.cssText = css;
            },
            callback : function() {
                me.setCurrViewController( me.getLeftViewController() );
                me = wrap = xy = curxy = cssText = null;
            } 
        } );
    };
    
    /**
     * @description 将可视区域定位到中间控制器
     * @param {int} longTime 移动过程所占的毫秒时长
     */
    this.gotoCenterViewController = function( longTime ) {
        if ( _currViewController == _centerViewController )
            return;

        var me = this;
        var wrap = this.getView().getInnerDom()[ 0 ];
        var xy = Fan.dom.getXY( _centerWrapView.getDom()[ 0 ] );
        var curxy = { xx : 0, yy : 0 };
        var cssText = wrap.style.cssText;
        cssText.replace( _reg_i, function( v1, v2, v3 ) {
            curxy.xx = v2 >> 0;
            curxy.yy = v3 >> 0;
        } );
        
        // y坐标始终为0
        curxy.yy = 0;
        
        //logger.warn( 'x:' + curxy.xx + ', y:' + curxy.yy );
        
        Fan.anim( wrap, {
            test : true,
            start : curxy.xx,
            end : -xy.xx
        }, {
            longTime : Fan.isNumber( longTime ) ? longTime : 400,
            step : function( now, progress ) {
                var css = cssText.replace( _reg_ig, ':translate(' + now + 'px,' + curxy.yy + 'px)' );
                wrap.style.cssText = css;
            },
            callback : function() {
                me.setCurrViewController( me.getCenterViewController() );
                me = wrap = xy = curxy = cssText = null;
            } 
        } );
    };
    
    /**
     * @description 将可视区域定位到右侧控制器
     * @param {int} longTime 移动过程所占的毫秒时长
     */
    this.gotoRightViewController = function( longTime ) {
        if ( _currViewController == _rightViewController )
            return;
        
        var me = this;
        var wrap = this.getView().getInnerDom()[ 0 ];
        var xy = Fan.dom.getXY( _rightWrapView.getDom()[ 0 ] );
        var curxy = { xx : 0, yy : 0 };
        var cssText = wrap.style.cssText;
        cssText.replace( _reg_i, function( v1, v2, v3 ) {
            curxy.xx = v2 >> 0;
            curxy.yy = v3 >> 0;
        } );
        
        // y坐标始终为0
        curxy.yy = 0;
        
        Fan.anim( wrap, {
            test : true,
            start : curxy.xx,
            end : -xy.xx + ( _overSize * wrap.offsetWidth )
        }, {
            longTime : Fan.isNumber( longTime ) ? longTime : 400,
            step : function( now, progress ) {
                var css = cssText.replace( _reg_ig, ':translate(' + now + 'px,' + curxy.yy + 'px)' );
                wrap.style.cssText = css;
            },
            callback : function() {
                me.setCurrViewController( me.getRightViewController() );
                me = wrap = xy = curxy = cssText = null;
            } 
        } );
    };
    
    /**
     * @description 设置左侧控制器
     * @param {ViewController} viewController
     */
    this.setLeftViewController = function( vc ) {
        if ( vc instanceof Fan.ui.ViewController ) {
            if ( _leftViewController ) {
                _leftWrapView.removeSubView( _leftViewController.getView() );
                _leftViewController.parentController = null;
            }
            _leftWrapView.addSubView( vc.getView() );
            _leftViewController = vc;
            vc.parentController = this;
            this.fireEvent( 'leftViewControllerChanged' );
        }
    };

    /**
     * @description 设置中间控制器
     * @param {ViewController} viewController
     */
    this.setCenterViewController = function( vc ) {
        if ( vc instanceof Fan.ui.ViewController ) {
            if ( _centerViewController ) {
                 _centerWrapView.removeSubView( _centerViewController.getView() );
                 _centerViewController.parentController = null;
            }
            _centerWrapView.addSubView( vc.getView() );
            _centerViewController = vc;
            vc.parentController = this;
            this.fireEvent( 'centerViewControllerChanged' );
        }
    };
    
    /**
     * @description 设置右侧控制器
     * @param {ViewController} viewController
     */
    this.setRightViewController = function( vc ) {
        if ( vc instanceof Fan.ui.ViewController ) {
            if ( _rightViewController ) {
                _rightWrapView.removeSubView( _rightViewController.getView() );
                _rightViewController.parentController = null;
            }
            _rightWrapView.addSubView( vc.getView() );
            _rightViewController = vc;
            vc.parentController = this;
            this.fireEvent( 'centerViewControllerChanged' );
        }
    };
    
    /**
     * @description 设置当前可视控制器
     * @param {ViewController} viewController
     */
    this.setCurrViewController = function( vc ) {
        if ( vc instanceof Fan.ui.ViewController && _currViewController != vc ) {
            _currViewController = vc;
            this.fireEvent( 'visualViewControllerChange', [ this, _currViewController ] );
        }
    };
    
    /**
     * @description 获取左侧控制器
     * @returns {ViewController}
     */
    this.getLeftViewController = function() {
        return _leftViewController || null;
    };

    /**
     * @description 获取中间控制器
     * @returns {ViewController}
     */
    this.getCenterViewController = function() {
        return _centerViewController;
    };
    
    /**
     * @description 获取右侧控制器
     * @returns {ViewController}
     */
    this.getRightViewController = function() {
        return _rightViewController;
    };
    
    /**
     * @description 获取当前可视的子控制器
     * @returns {ViewController}
     */
    this.getCurrViewController = function() {
        return _currViewController;
    };
    
    /**
     * @description 获取左侧控制器的包装view, 非控制器的关联view
     * @returns {View}
     */
    this.getLeftWrapView = function() {
        return _leftWrapView;
    };
    
    /**
     * @description 获取中间控制器的包装view, 非控制器的关联view
     * @returns {View}
     */
    this.getCenterWrapView = function() {
        return _centerWrapView;
    };
    
    /**
     * @description 获取右侧控制器的包装view, 非控制器的关联view
     * @returns {View}
     */
    this.getRightWrapView = function() {
        return _rightWrapView;
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
     * @param {boolean} doDestroy 是否销毁子对象
     */
    this.destroy = function( doDestroy ) {
        _leftViewController && _leftViewController.destroy( doDestroy );
        _rightViewController && _rightViewController.destroy( doDestroy );
        _centerViewController && _centerViewController.destroy( doDestroy );
        _leftWrapView = _centerWrapView = _rightWrapView = null;
        _config = _leftViewController = _rightViewController = _centerViewController = null;
        _overSize = _reg_ig = _reg_i = null;
        Super( doDestroy );
    };
} );
