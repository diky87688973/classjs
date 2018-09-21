/**
 * @fileOverview 多栏视图控制器
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

Import( 'Fan.ui.MultiViewController' );

/**
 * @author Fan
 * @class Fan.ui.Multi2ViewController
 * @constructor Multi2ViewController
 * @extends Fan.ui.MultiViewController
 * @description 简单的多栏视图控制器2, 针对滑动动画做出处理
 * @see The <a href="#">Fan</a >.
 * @example new Multi2ViewController( config );
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
Class( 'Fan.ui.Multi2ViewController', Fan.ui.MultiViewController, function() {
    var
    _config,
    
    // 中间控制器在可视区域中的剩余比例
    _overSize,
    
    _dragCenter;
    
    /**
     * @constructor 
     */
    this.Multi2ViewController = function( config ) {
        _config = config || {};
        _overSize = _config.overSize || 0.2;
        _dragCenter = !!_config.dragCenter;
        Super( _config );
    };
    
    /**
     * @description 初始化, 构造对象时会被调用
     */
    this.init = function() {
        Super();
        this.getRightWrapView().setLeft( (_overSize * 100) + '%' );
        this.getCenterWrapView().setZIndex( Class.id() );
        
        this.getLeftWrapView().hide();
        this.getRightWrapView().hide();
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
            if ( drag_flag || this.controller.getCurrViewController() == this.controller.getCenterViewController() ) {
                this.controller._moveToCenter( 200, function( now, progress ) {
                    
                }, function() {
                    
                } );
            }
        };
        
        // 直接子节点.layout-cover的事件
        this.getCenterWrapView().$on( '#' + this.getCenterWrapView().id + '>.layout-cover', 'tapdown', function() {
            drag_flag = true;
        } );
        this.getCenterWrapView().$on( '#' + this.getCenterWrapView().id + '>.layout-cover', 'tapup', function() {
            _fuwei.apply( this.view.parentView, arguments );
            this.view.parentView.controller.gotoCenterViewController();
        } );
        this.getCenterWrapView().on( 'swipeleft', function() {
            if ( !_dragCenter )
                return;
            _has_fuwei = false;
            var me = this.parentView.controller;
            if ( me.getCurrViewController() == me.getCenterViewController() )
                me.gotoRightViewController();
            else if ( me.getCurrViewController() == me.getLeftViewController() )
                me.gotoCenterViewController();
        } );
        this.getCenterWrapView().on( 'swiperight', function() {
            if ( !_dragCenter )
                return;
            _has_fuwei = false;
            var me = this.parentView.controller;
            if ( me.getCurrViewController() == me.getCenterViewController() )
                me.gotoLeftViewController();
            else if ( me.getCurrViewController() == me.getRightViewController() )
                me.gotoCenterViewController();
        } );

        // 临时缓存centerWrapView的xy起始坐标记录, 在拖动结束时清空
        var startXY = null, drag_flag = null;
        this.getView().on( 'drag', function( event ) {
            if ( !_dragCenter )
                return;
            if ( !drag_flag )
                return;
//            if ( this.controller.getCurrViewController() != this.controller.getCenterViewController() ) {
//                // 仅在当前为中间视图控制器时,才可拖动
//                startXY = null;
//                return;
//            }
            
            // 发生过拖动, 则需要复位
            _has_fuwei = true;
            
            var args = event._args;
            var data = args[ 1 ];
        
            var me = this.controller;
            var wrap = me.getCenterWrapView().getDom()[ 0 ];
            
            // 第一次记录centerWrapView的xy的坐标值
            if ( !startXY ) {
                startXY = Fan.dom.getXY( wrap );
                
                // 首次2个view都显示
                var view = me.getLeftWrapView();
                !view.isShow() && view.show();
                view = me.getRightWrapView();
                !view.isShow() && view.show();
            }
            
            var x = startXY.xx + data.speedX;
            
            // 每次移动, 根据其坐标对应隐藏和显示不同view
            if ( x == 0 ) {
                var view = me.getLeftWrapView();
                !view.isShow() && view.show();
                view = me.getRightWrapView();
                !view.isShow() && view.show();
            } else if ( x < 0 ) {
                // 往左移动时, 左侧控制器被遮盖, 则可隐藏之
                var view = me.getLeftWrapView();
                view.isShow() && view.hide();
                view = me.getRightWrapView();
                !view.isShow() && view.show();
            } else if ( x > 0 ) {
                // 往右移动时, 右侧控制器被遮盖, 则可隐藏之
                var view = me.getRightWrapView();
                view.isShow() && view.hide();
                view = me.getLeftWrapView();
                !view.isShow() && view.show();
            }
            
            // 判断移动的边界
            if ( x < -(1 - _overSize) * wrap.offsetWidth ) {
                x = -(1 - _overSize) * wrap.offsetWidth;
            } else if ( x > (1 - _overSize) * wrap.offsetWidth ) {
                x = (1 - _overSize) * wrap.offsetWidth;
            }
            
            // 始终只允许左右拖动,故y间距始终为0
            // data.speedY = 0;
            
            // logger.warn( (startXY.xx + data.speedX) + 'px' );
            wrap.style.left = x + 'px';
            
            event = args = data = me = wrap = null;
        } );
        this.getView().on( 'dragend', function( event ) {
            // 拖动结束, 清除centerWrapView的xy的坐标记录
            _fuwei.apply( this, arguments );
            startXY = drag_flag = null;
        } );
    
    };
    
    /**
     * @description 实现可视区域移至左侧的方法, 该方法为私有, 仅可子类中调用
     * @param {int} longTime 移动过程所占的毫秒时长
     * @param {Function} stepCallback 没次移动一小步时的回调函数
     * @param {Function} callback 移动完毕后的回调函数
     */
    this._moveToLeft = function( longTime, stepCallback, callback ) {
        var me = this;
        var wrap = me.getCenterWrapView().getDom()[ 0 ];
        var left = wrap.style.left + '';
        var unit = left.replace( /[\d.-]+/ig, '' );
        var start = parseFloat( left.replace( /[^\d.-]+/ig, '' ), 10 );
        var end = (1 - _overSize) * 100;
        if ( 'px' == unit ) {
            end = (1 - _overSize) * me.getCenterWrapView().getDom().width();
        }
        
        me.getLeftWrapView().setZIndex( 1 );
        me.getLeftWrapView().show();
        
        Fan.anim( wrap, {
            test : true,
            start : start,
            end : end
        }, {
            longTime : Fan.isNumber( longTime ) ? longTime : 400,
            step : function( now, progress ) {
                var left = now + unit;
                wrap.style.left = left;
                
                // 当中间view达到原点时, 隐藏不需要显示的界面
                if ( now >= 0 ) {
                    var v = me.getRightWrapView();
                    v.isShow() && v.hide();
                }
                
                stepCallback && stepCallback.call( this, now, progress );
                // logger.warn(left);
            },
            callback : function() {
                me.getLeftWrapView().setZIndex( 2 );
                
                // 隐藏右边
                var view = me.getRightWrapView();
                view.isShow() && view.hide();
                
                // 中间层显示遮盖层
                me.getCenterWrapView().$( '>.layout-cover' ).first().removeClass( 'hide' );
                
                me.setCurrViewController( me.getLeftViewController() );
                
                callback && callback.call( this );
                
                wrap = me = left = unit = start = end = null;
            } 
        } );
    };
    
    /**
     * @description 实现可视区域移至中间的方法, 该方法为私有, 仅可子类中调用
     * @param {int} longTime 移动过程所占的毫秒时长
     * @param {Function} stepCallback 没次移动一小步时的回调函数
     * @param {Function} callback 移动完毕后的回调函数
     */
    this._moveToCenter = function( longTime, stepCallback, callback ) {
        var me = this;
        var wrap = me.getCenterWrapView().getDom()[ 0 ];
        var left = wrap.style.left + '';
        var unit = left.replace( /[\d.-]+/ig, '' );
        var start = parseFloat( left.replace( /[^\d.-]+/ig, '' ), 10 );
        var end = 0; // px 和 % 都可用0
        
        Fan.anim( wrap, {
            test : true,
            start : start,
            end : 0
        }, {
            longTime : Fan.isNumber( longTime ) ? longTime : 400,
            step : function( now, progress ) {
                var left = now + unit;
                wrap.style.left = left;
                stepCallback && stepCallback.call( this, now, progress );
                // logger.warn(left);
            },
            callback : function() {
                // 隐藏左边和右边
                var view = me.getLeftWrapView();
                view.isShow() && view.hide();
                view = me.getRightWrapView();
                view.isShow() && view.hide();
                
                // 中间层隐藏遮盖层
                me.getCenterWrapView().$( '>.layout-cover' ).first().addClass( 'hide' );
                
                me.setCurrViewController( me.getCenterViewController() );
                
                callback && callback.call( this );
                
                wrap = me = view = left = unit = start = end = null;
            } 
        } );
    };
    
    /**
     * @description 实现可视区域移至右侧的方法, 该方法为私有, 仅可子类中调用
     * @param {int} longTime 移动过程所占的毫秒时长
     * @param {Function} stepCallback 没次移动一小步时的回调函数
     * @param {Function} callback 移动完毕后的回调函数
     */
    this._moveToRight = function( longTime, stepCallback, callback ) {
        var me = this;
        var wrap = me.getCenterWrapView().getDom()[ 0 ];
        var left = wrap.style.left + '';
        var unit = left.replace( /[\d.-]+/ig, '' );
        var start = parseFloat( left.replace( /[^\d.-]+/ig, '' ), 10 );
        var end = -(1 - _overSize) * 100;
        if ( unit == 'px' ) {
            end = -(1 - _overSize) * me.getCenterWrapView().getDom().width();
        }
        
        me.getRightWrapView().setZIndex( 1 );
        me.getRightWrapView().show();
        
        Fan.anim( wrap, {
            test : true,
            start : start,
            end : end
        }, {
            longTime : Fan.isNumber( longTime ) ? longTime : 400,
            step : function( now, progress ) {
                var left = now + unit;
                wrap.style.left = left;
                
                // 当中间view达到原点时, 隐藏不需要显示的界面
                if ( now <= 0 ) {
                    var v = me.getLeftWrapView();
                    v.isShow() && v.hide();
                }
                
                stepCallback && stepCallback.call( this, now, progress );
            },
            callback : function() {
                me.getRightWrapView().setZIndex( 2 );
                
                // 隐藏左边
                var view = me.getLeftWrapView();
                view.isShow() && view.hide();
                
                // 中间层显示遮盖层
                me.getCenterWrapView().$( '>.layout-cover' ).first().removeClass( 'hide' );
                
                me.setCurrViewController( me.getRightViewController() );
                
                callback && callback.call( this );
                
                wrap = me = view = left = unit = start = end = null;
            }
        } );
    };
    
    /**
     * @description 将可视区域定位到左侧控制器
     * @param {int} longTime 移动过程所占的毫秒时长
     */
    this.gotoLeftViewController = function( longTime ) {
        if ( this.getCurrViewController() == this.getLeftViewController() )
            return;
        
        this._moveToLeft( longTime, function( now, progress ) {
            
        }, function() {
            
        } );
    };
    
    /**
     * @description 将可视区域定位到中间控制器
     * @param {int} longTime 移动过程所占的毫秒时长
     */
    this.gotoCenterViewController = function( longTime ) {
        if ( this.getCurrViewController() == this.getCenterViewController() )
            return;

        this._moveToCenter( longTime, function( now, progress ) {
            
        }, function() {

        } );
    };
    
    /**
     * @description 将可视区域定位到右侧控制器
     * @param {int} longTime 移动过程所占的毫秒时长
     */
    this.gotoRightViewController = function( longTime ) {
        if ( this.getCurrViewController() == this.getRightViewController() )
            return;
        this._moveToRight( longTime, function( now, progress ) {
            
        }, function() {
            
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
     * @param {boolean} doDestroy 是否销毁子view
     */
    this.destroy = function( doDestroy ) {
        _overSize = _dragCenter = _config = null;
        Super( doDestroy );
    };
} );
