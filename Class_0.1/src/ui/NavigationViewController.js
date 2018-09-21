/**
 * @fileOverview 导航视图控制器
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

Import( 'Fan.ui.ContaineViewController' );
// Import( 'Fan.ui.AnimConfigure' );

/**
 * @author Fan
 * @class Fan.ui.NavigationViewController
 * @constructor NavigationViewController
 * @extends Fan.ui.ContaineViewController
 * @description 导航视图控制器, 目前bug导航标题切换时异常
 * @see The <a href="#">Fan</a >.
 * @example new NavigationViewController( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 *  hasBackBtn - 是否含有返回按钮, 暂未实现
 *  hasLeftBtn - 是否具有左侧按钮, 暂未实现
 *  hasRightBtn - 是否按钮右侧按钮, 暂未实现
 *  
 *  alwaysHideHeader - 是否始终隐藏头部栏
 *  useDragEdgesBack - 是否使用拖动边缘返回, 默认true
 *  
 *  // 默认就加载好的子视图控制器
 *  subViewControllers : [ { controllerClass, controllerConfig } ]
 *  
 *  on - 事件监听
 *  id - 控制器的id
 *  name - 控制器的名称
 *  viewClass - 控制器自身的view
 *  viewConfig - 控制器构造自身view时的传入参数, 详细见viewClass参数类对应的构造配置参数
 * }
 * 
 * ### 支持的事件 ###
 * 
 * 自身事件
 * animStatusByProgress(vc, progress) - 动态切换vc的进度百分比, 便于根据比例实现其他动画效果
 * 
 * 与父视图控制器相关事件
 * addViewController
 * removeViewController
 * activing
 * active
 * unactiving
 * unactive
 * addToParentViewController
 * removeOfParentViewController
 */
Class( 'Fan.ui.NavigationViewController', Fan.ui.ContaineViewController, function() {
    var
    _config,
    
    // 是否在执行动画中(push,pop)
    _doAniming,
    
    // 默认执行动画的完整时长
    _defaultLongTime,
    
    // 是否始终隐藏头部栏
    _alwaysHideHeader,
    
    // 是否使用拖动边缘返回
    _useDragEdgesBack,
    
    // 匹配并抓取translate样式值的正则
    _reg_i = /:\s*translate\s*\(\s*(-?\d+\.?\d*)(?:px|%)?(?:\s*,\s*(-?\d+\.?\d*)(?:px|%)?)?\s*\)/i,
    _reg_ig = /:\s*translate\s*\(\s*(-?\d+\.?\d*)(?:px|%)?(?:\s*,\s*(-?\d+\.?\d*)(?:px|%)?)?\s*\)/ig,
    
    // 记录当前激活的子vc
    _currSubViewController,
    
    // 遮盖层
    _cover,
    _isShowCover,
    
    // 临时缓存css:translate的坐标记录, 在拖动结束时清空, 暂未使用
    _translate,
    
    // 惯性坐标点, 记录最后移动的5个点以及时间点, 由此判断惯性方向
    _inertiaPoints,
    _inertiaPointIdx,
    _inertiaTimeConsumings,
    
    // 最终确定的惯性方向: right | left
    _inertia;
    
    /**
     * @constructor 
     */
    this.NavigationViewController = function( config ) {
        // 当前配置
        _config = Class.apply( {
            useDragEdgesBack : true,
            alwaysHideHeader : false
        }, config );
        
        // 控制器自身view的简便配置参数
        var viewConfig = Class.apply( {
            // useScroll : true,
            // parentController : this, // 该参数会自动设置
            hideHeader : true,
            hideFooter : true,
            useUserInterface : _config.useUserInterface,
            headerSubViews : [ {
                viewClass : 'Fan.ui.View',
                viewConfig : {
                    name : 'title-txt',
                    className : 'layout-h-title-text j-title-txt'
                }
            }, {
                viewClass : 'Fan.ui.View',
                viewConfig : {
                    name : 'back-btn',
                    className : 'layout-c-pointer layout-h-back-btn j-back-btn',
                    useUserInterface : true,
                    on : {
                        'tap' : function() {
                            This.popViewController( { move : 'toRight' } );
                        }
                    }
                }
            } ],
            footerSubViews : []
        }, _config.viewConfig );
        
        // 父类配置
        config = Class.apply( {
            viewClass : 'Fan.ui.view.PageView',
            viewConfig : viewConfig
        }, config );
        
        // 屏蔽配置
        delete config.alwaysHideHeader;
        delete config.useDragEdgesBack;
        
        _doAniming = false;
        _defaultLongTime = 350;
        _useDragEdgesBack = _config.useDragEdgesBack;
        _alwaysHideHeader = _config.alwaysHideHeader;

        Super( config );
    };
    
    /**
     * @description 初始化, 构造对象时会被调用
     */
    this.init = function() {
        // 动态插入一个遮盖层, 用于切换动画中, 避免触发ui上的点击事件
        _cover = jQuery( '<div style="display:none;" class="layout-cover"></div>' );
        this.getView().getDom().append( _cover );
        
        this.getView().getDom().css( 'overflow', 'hidden' );
        
        Super();
    };
    
    /**
     * @description 初始化用户交互事件, 构造对象时会被调用
     */
    this.initEvent = function() {
        // 临时缓存css:translate的坐标记录, 在拖动结束时清空, 暂未使用
        _translate = null;
        
        // 惯性坐标点, 记录最后移动的5个点, 由此判断惯性方向
        _inertiaPoints = [ 0, 0, 0, 0, 0 ];
        _inertiaTimeConsumings = [ 0, 0, 0, 0, 0 ];
        _inertiaPointIdx = 5;
        
        // 最终确定的惯性方向: right | left
        _inertia = 'left';
        
        // touch事件数据对象, 用于控制touchstart,touchmove,touchend事件之间的关系
        var touchstartData = {},
            stopEvent      = false;
        
        // 触击按下时
        this.getView().$on( Fan.util.TouchManager.eventName( 'touchstart' ), function( event ) {
            var data = Fan.util.TouchManager.getTouchStartDataByEvent( event, touchstartData );
            if ( stopEvent = data.stopEvent ) return;
            touchstartData = data;
            
            var elem = Fan.Event.getTarget( event );
            if ( !/^(input|textarea|select|option|button)$/i.test( elem.tagName ) ) {
                Fan.Event.cancel( event );
                logger.debug( 'PageView.tapdown:cancel event' );
            }
        } );
        
        // 实现边缘拖拽返回上一个vc
        this.getView().$on( Fan.util.TouchManager.eventName( 'touchmove' ), function( event ) {
            
            var data = Fan.util.TouchManager.getTouchMoveDataByEventAndTouchStartData( event, touchstartData );
            if ( stopEvent || data.stopEvent ) return;
            touchstartData = data;
            
            var offsetXY = This.getView().getXY();
            
            var sx = data.startX - offsetXY.x;
            var sy = data.startY - offsetXY.y;
            
            // 判断是否符合边缘滑动返回的条件
            if ( _doAniming || !This.getView().getScrollAuthority() || !(_useDragEdgesBack && sx >= -15 && sx <= 15 && sy > This.getView().getHeaderView().getDom().height() && This.getViewControllerCount() > 1) ) {
                return;
            }
            
            // 垂直拖动不做处理, 相对移动的位置y>x, 则视为未发生水平拖动
            if ( Fan.ui.View.getScrollingView() != This.getView() && (Math.abs(data.speedY) >= Math.abs(data.speedX)) ) {
                // logger.warn('未发生水平拖动:');
                return;
            }
            
            // 获取并锁定权限
            if ( !This.getView().getScrollAuthority( true ) ) {
                // 没有权限
                // logger.warn( '[TabView] - 无事件权限, 放弃拖拽' );
                return;
            }

            // 拖动时显示遮盖, 避免触发不必要的事件
            This.showCover();
            
            // 取最后一个vc,即当前激活的vc
            var vcList = This.getViewControllers();
            var lastVC = Fan.last( vcList );
            
            // 第一次记录css:translate的坐标值
            if ( !_translate ) {
                // 把被隐藏的前一个vc再度显示
                var vc = vcList[ vcList.length - 2 ];
                if ( vc && vc.getView() ) {
                    vc.getView().show();
                }
                vc = null;
                
                var wrap = lastVC.getView().getDom()[ 0 ];
                var cssText = wrap.style.cssText || '';
                
                _translate = { x : 0, y : 0 };
                cssText.replace( _reg_i, function( v1, v2, v3 ) {
                    _translate.x = v2 >> 0;
                    _translate.y = v3 >> 0;
                } );
                
                // y坐标始终为0
                _translate.y = 0;
            }
            
            // 始终只允许左右拖动,故y间距始终为0
            data.speedY = 0;
            if ( data.speedX < 0 ) {
                data.speedX = 0;
            }
            
            // 计算百分比
            var maxWidth = This.getView().getInnerDom().width();
            var progress = data.speedX * 100 / maxWidth;
            
            // 记录最近移动的5个点
            _inertiaPoints[ _inertiaPointIdx % 5 ] = progress;
            // 记录移动的时间点
            _inertiaTimeConsumings[ _inertiaPointIdx++ % 5 ] = Fan.now();
            
            // 根据百分比调整vc位置
            This._animStatusByProgress( lastVC, progress );
            
            lastVC = vcList = null;
            
            // 当前view若在拖拽时, 阻止事件冒泡, 取消默认行为
            Fan.Event.cancel( event );
            Fan.Event.stop( event );
        } );
        
        // 拖拽完毕
        this.getView().$on( Fan.util.TouchManager.eventName( 'touchend' ), function( event ) {
            // 判断是否符合边缘滑动返回的条件
            if ( !(_useDragEdgesBack && _inertiaPointIdx > 5) ) {
                return;
            }
            
            var data = Fan.util.TouchManager.getTouchEndDataByEventAndTouchStartData( event, touchstartData );
            if ( stopEvent || data.stopEvent ) return;
            touchstartData = data;
            
            // 取出最后移动的5个点
            var p    = --_inertiaPointIdx % 5,
                p5   = _inertiaPoints[ p ],
                p5_t = _inertiaTimeConsumings[ p ];
                p    = --_inertiaPointIdx % 5;
                
            var p4   = _inertiaPoints[ p ],
                p4_t = _inertiaTimeConsumings[ p ],
                p3   = _inertiaPoints[ --_inertiaPointIdx % 5 ],
                p2   = _inertiaPoints[ --_inertiaPointIdx % 5 ],
                p1   = _inertiaPoints[ --_inertiaPointIdx % 5 ];
            
            // 惯性方向检测
            switch( true ) {
            case p5 > p4 && p4 >= p3 && p3 >= p2 && p2 >= p1 :
                _inertia = 'right';
                break;
                
            case p5 < p4 && p4 <= p3 && p3 <= p2 && p2 <= p1 :
                _inertia = 'left';
                break;
                
            default :
                // 边缘纵向拖拽, 不做处理, 保留原本惯性
                break;
            }
            
            // 根据最后拖拽距离百分比, 计算自动移动时的速度
            var
            longTime,
            
            // 最后一步距离
            lastStepDistance = Math.abs( p5 - p4 ),
            
            // 最后一步耗时
            lastTime = p5_t - p4_t;
            // 暂未出现, 但为避免0, 故最小耗时为1
            lastTime = lastTime < 1 ? 1 : lastTime;
            
            logger.warn( '最后距离:' + lastStepDistance + ',耗时:' + lastTime + ',points:' + p5 + ',' + p4 + ',' + p3 + ',' + p2 + ',' + p1 );
            
            // 平均每1毫秒移动的距离
            var averageSpeed = 100 / _defaultLongTime;
            
            // 剩余未完成的百分比距离
            var surplusProgress = _inertia == 'right' ? 100 - p5 : p5;
            
            // 当前速度,每1毫秒移动的百分比
            var currSpeed = lastStepDistance / lastTime;
            
            // 剩余时长1 = 剩余距离 / 当前速度 
            // 剩余时长2 = 剩余距离 / 平均速度 + (剩余距离调整:剩余距离越短,所加时间越长)
            longTime = currSpeed < averageSpeed ? Math.ceil( surplusProgress / averageSpeed + ( 100 - surplusProgress ) ) : Math.ceil( surplusProgress / currSpeed );
            longTime = longTime < 0 ? 0 : longTime;
            
            // logger.info( '距:' + lastStepDistance + ',耗:' + lastTime + '速:' + currSpeed + ',均:' + averageSpeed + ',剩' + surplusProgress + ',时长:' + longTime );
            
            if ( _inertia == 'right' ) {
                logger.info( '[边缘拖拽] - 执行返回' );
                This.popViewController( {
                    longTime : longTime,
                    move : 'toRight',
                    start : p5,
                    end : 100
                }, function() {
                    // 拖动完毕隐藏遮盖
                    This.hideCover();
                    event = null;
                } );
            } else if ( _inertia == 'left' ) {
                logger.info( '[边缘拖拽] - 复位' );
                
                // 取最后一个vc复位,即当前激活的vc
                var vcList = This.getViewControllers();
                var lastVC = Fan.last( vcList );
                
                _doAniming = true;
                
                Fan.anim( lastVC.getView().getDom()[ 0 ], {
                    test : true,
                    start : p5,
                    end : 0
                }, {
                    longTime : longTime,
                    step : function( now, progress ) {
                        This._animStatusByProgress( lastVC, now );
                    },
                    callback : function() {
                        // 复位完毕时, 把被遮盖的vc隐藏
                        var vc = vcList[ vcList.length - 2 ];
                        if ( vc && vc.getView() ) {
                            vc.getView().hide();
                        }
                        vcList = vc = lastVC = null;
                        
                        // 拖动完毕隐藏遮盖
                        This.hideCover();
                        
                        _doAniming = false;
                    } 
                } );
            }
            
            // 重置缓存
            _translate = null;
            _inertiaPointIdx = 5;
            _inertiaPoints[ 0 ] = 0;
            _inertiaPoints[ 1 ] = 0;
            _inertiaPoints[ 2 ] = 0;
            _inertiaPoints[ 3 ] = 0;
            _inertiaPoints[ 4 ] = 0;
            _inertiaTimeConsumings[ 0 ] = 0;
            _inertiaTimeConsumings[ 1 ] = 0;
            _inertiaTimeConsumings[ 2 ] = 0;
            _inertiaTimeConsumings[ 3 ] = 0;
            _inertiaTimeConsumings[ 4 ] = 0;
            
            // 释放滚动权限
            This.getView().cancelScrollAuthority();
            
            // 当前view若在拖拽时, 阻止事件冒泡, 取消默认行为
            Fan.Event.cancel( event );
            Fan.Event.stop( event );
        } );
        
        Super();
    };
    
    /**
     * @private
     * @description 根据百分比进度值, 展现vc的呈现进度状态(用于切换vc时的动画之中)
     * @param {ViewController} viewController 当前处于切换中的控制器
     * @param {float} progress 百分比进度值[0,100]
     */
    this._animStatusByProgress = function( viewController, progress ) {
        var wrap    = viewController.getView().getDom()[ 0 ],
            cssText = wrap.style.cssText || '',
            css     = cssText.replace( _reg_ig, ':translate(' + progress + '%,0px)' );
        
        // 阴影透明随拖动渐变
        var shadowOpacity = (1 - progress / 100).toFixed( 3 );
        
        // set css
        wrap.style.cssText = css + ';box-shadow:1px 0px 9px rgba(2, 37, 69, ' + shadowOpacity + ');';
        
        // 触发事件, 用于其他动态效果扩展
        this.fireEvent( 'animStatusByProgress', [ viewController, progress ] );
        //logger.warn( 'progress:' + progress );
    };
    
    /**
     * @private
     * @description 负责处理push一个新vc的动画过程
     * @param {ViewController} viewController 将被切入的控制器
     * @param {Object} animConfig 切入时的动画配置
     * @param {Function} callback 切入完毕的回调函数
     */
    this._pushAnim = function( viewController, animConfig, callback ) {
        _doAniming = true;
        
        // 显示遮盖
        this.showCover();
        
        Fan.anim( viewController.getView().getDom()[ 0 ], {
            test : true,
            start : 100,
            end : 0
        }, {
            longTime : animConfig.longTime,
            step : function( now, progress ) {
                This._animStatusByProgress( viewController, now );
            },
            callback : function() {
                // 切换完毕时, 隐藏前一个view控制器
                var vcList = This.getViewControllers();
                var vc = vcList[ vcList.length - 2 ];
                vc && vc.getView() && vc.getView().hide();
                
                // 执行刷新
                This.getView().ref();
                
                // 触发推入视图控制器事件
                This.fireEvent( 'pushViewController', [ This ] );
                
                // 保存当前子vc
                _currSubViewController = viewController;
             
                // 设置标题
                This.getView().getHeaderView().find( 'title-txt' ).getInnerDom().html( _currSubViewController.name );
                
                // 子视图控制器已激活
                viewController.fireEvent( 'active', [ viewController ] );
                
                _doAniming = false;

                // 隐藏遮盖
                This.hideCover();
                
                animConfig = vc = vcList = null;
                Fan.call( callback );
                callback = null;
                
                // 重置缓存
                _translate = null;
                _inertiaPointIdx = 5;
                _inertiaPoints[ 0 ] = 0;
                _inertiaPoints[ 1 ] = 0;
                _inertiaPoints[ 2 ] = 0;
                _inertiaPoints[ 3 ] = 0;
                _inertiaPoints[ 4 ] = 0;
                _inertiaTimeConsumings[ 0 ] = 0;
                _inertiaTimeConsumings[ 1 ] = 0;
                _inertiaTimeConsumings[ 2 ] = 0;
                _inertiaTimeConsumings[ 3 ] = 0;
                _inertiaTimeConsumings[ 4 ] = 0;
                // 当前vc默认惯性为left
                _inertia = 'left';
            } 
        } );
    };
    
    /**
     * @private
     * @description 负责处理pop当前vc的动画过程
     * @param {ViewController} viewController 将被移出的控制器
     * @param {Object} animConfig 移出时的动画配置
     * @param {Function} callback 移出完毕的回调函数
     */
    this._popAnim = function( viewController, animConfig, callback ) {
        _doAniming = true;
        
        // 显示遮盖
        this.showCover();
        
        Fan.anim( viewController.getView().getDom()[ 0 ], {
            test : true,
            start : animConfig.start >> 0,
            end : 100
        }, {
            longTime : animConfig.longTime,
            step : function( now, progress ) {
                This._animStatusByProgress( viewController, now );
            },
            callback : function() {
                // 切换完毕时, 将其销毁
                viewController.fireEvent( 'unactive', [ viewController ] );
                // 从集合中移除
                Super.removeViewController( viewController, true );
                
                // 记录当前
                var vc = Fan.last( This.getViewControllers() );
                _currSubViewController = vc;
             
                // 设置标题
                This.getView().getHeaderView().find( 'title-txt' ).getInnerDom().html( _currSubViewController.name );
                
                if ( This.getViewControllerCount() <= 0 ) {
                    // 隐藏导航条
                    This.getView().getHeaderView().hide();
                    // 第一个vc的标题无需显示, 因此隐藏时清空标题
                    This.getView().getHeaderView().find( 'title-txt' ).getInnerDom().html( '' );
                }
                
                // 恢复导航标题栏的位置
                !_alwaysHideHeader && This.getView().getHeaderView().getInnerDom().css( {
                    left : 0,
                    right : 0,
                    top : 0,
                    opacity : 1
                } );
                
                This.getView().ref();
                
                vc && vc.fireEvent( 'active', [ vc ] );
                
                _doAniming = false;
                
                // 隐藏遮盖
                This.hideCover();
                
                vc = viewController = animConfig = null;
                Fan.call( callback );
                callback = null;
                
                // 重置缓存
                _translate = null;
                _inertiaPointIdx = 5;
                _inertiaPoints[ 0 ] = 0;
                _inertiaPoints[ 1 ] = 0;
                _inertiaPoints[ 2 ] = 0;
                _inertiaPoints[ 3 ] = 0;
                _inertiaPoints[ 4 ] = 0;
                _inertiaTimeConsumings[ 0 ] = 0;
                _inertiaTimeConsumings[ 1 ] = 0;
                _inertiaTimeConsumings[ 2 ] = 0;
                _inertiaTimeConsumings[ 3 ] = 0;
                _inertiaTimeConsumings[ 4 ] = 0;
                // 当前vc默认惯性为left
                _inertia = 'left';
            } 
        } );
    };
    
    /**
     * @description 获取或设置是否使用边缘拖拽返回
     * @param {boolean} useDragEdgesBack
     * @returns {boolean} true | false
     */
    this.useDragEdgesBack = function( useDragEdgesBack ) {
        if ( useDragEdgesBack != null )
            _useDragEdgesBack = !!useDragEdgesBack;
        return _useDragEdgesBack;
    };
    
    /**
     * @description 从栈顶压入一个view控制器
     * @param {ViewController} viewController 将被切入的控制器
     * @param {Object} animConfig 切入时的动画配置
     * @param {Function} callback 切入完毕的回调函数
     * @returns {boolean} 是否接受切入新的控制器
     */
    this.pushViewController = function( viewController, animConfig, callback ) {
        if ( !(viewController instanceof Fan.ui.ViewController) )
            return false;

        if ( false && _doAniming ) {
            logger.warn( '[导航控制器] - 正在执行动画, 此过程中不可推进或推出子视图控制器' );
            return false;
        }

        // 增加初始化transform样式, 第一个vc无需此样式
        if ( this.getViewControllerCount() >= 1 ) {
            viewController.getView().addStyle( '-moz-transform:translate(100%,0px);-webkit-transform:translate(100%,0px);transform:translate(100%,0px);' );
            // viewController.getView().getDom().addClass( 'layout-box-shadow' );
        }
        
        // 增加到集合中
        Super.addViewController( viewController );
        
        var vcList = this.getViewControllers();
        
        // 添加到导航view中
        this.getView().addSubView( viewController.getView() );
        
        // 设置标题
        // this.getView().getHeaderView().find( 'title-txt' ).getInnerDom().html( viewController.name );
        
        // 显示导航条
        if ( this.getViewControllerCount() > 0 && !_alwaysHideHeader ) {
            this.getView().getHeaderView().show();
        }
        
        // 默认动画配置
        animConfig = Class.apply( {
            longTime : _defaultLongTime,
            move : 'toLeft'
        }, animConfig, true );
        // 执行push动画
        this._pushAnim( viewController, animConfig, callback );
        
        return true;
    };
    
    /**
     * @description 从栈顶移除一个view控制器
     * @param {Object} animConfig 回退时的动画配置
     * @param {Function} callback 回退完毕的回调函数
     * @returns {boolean} 是否接受回退顶层控制器
     */
    this.popViewController = function( animConfig, callback ) {
        if ( false && _doAniming ) {
            logger.warn( '[导航控制器] - 正在执行动画, 此过程中不可推进或推出子视图控制器' );
            return false;
        }
        
        var vcList = this.getViewControllers();
        
        // 取出栈顶的视图控制器
        var viewController = vcList[ vcList.length - 1 ];
        if ( !viewController || vcList.length <= 1 ) {
            logger.info( '[导航控制器] - 已经到了根路径' );
            return false;
        }
        
        viewController.fireEvent( 'unactiving', [ viewController ] );
        
        // 切换完毕时, 把被隐藏的前一个view控制器再度显示
        var vc = vcList[ vcList.length - 2 ];
        if ( vc && vc.getView() ) {
            vc.fireEvent( 'activing', [ vc ] );
            vc.getView().show();
        }
        
        // 默认动画配置
        animConfig = Class.apply( {
            longTime : _defaultLongTime,
            move : 'toRight'
        }, animConfig, true );
        // 执行pop动画
        this._popAnim( viewController, animConfig, callback );
        
        return true;
    };
    
    /**
     * @description 回退到指定的view控制器
     * @param {int} backNumber 接受一个负数, 表示回退的次数, 非负数不作处理, 最多回退到根
     * @param {Object} animConfig 回退的动画配置
     */
    this.gotoViewController = function( backNumber, animConfig ) {
        if ( backNumber < 0 ) {
            var i = Math.abs( backNumber );
            i = i > this.getViewControllerCount() ? this.getViewControllerCount() : i;
            while ( i-- > 0 ) {
                Fan.defer( this.popViewController, 0, this, [ animConfig ] );
            }
        }
    };
    
    /**
     * @description 回退到根view控制器
     * @param {Object} animConfig 回退的动画配置
     */
    this.gotoRootViewController = function( animConfig ) {
        var i = this.getViewControllerCount();
        while ( i-- > 0 ) {
            this.popViewController( animConfig );
        }
    };
    
    // 重写方法
    this.addViewController = function( viewController ) {
        this.pushViewController( viewController, { move : 'toLeft', longTime : 0 } );
    };
    this.removeViewController = function( viewController ) {
        var vcList = this.getViewControllers();
        var idx = Fan.indexOf( vcList, viewController );
        if ( idx > -1 ) {
            idx = vcList.length - idx;
            this.gotoViewController( -idx );
        }
    };
    
    // 屏蔽方法
    /*this.removeAllViewController = function() {
        var e = new Error();
        e._errType = Fan.ErrorTypes.InvalidCalling;
        e._errClassName = 'Fan.ui.NavigationViewController';
        e._errMethodName = 'removeAllViewController';
        Fan.ClassManager.error( e );
        throw e;
    };*/
    
    /**
     * @description 显示遮盖层
     */
    this.showCover = function() {
        this.getView().isRender() && !_isShowCover && _cover.show();
        _isShowCover = true;
    };
    
    /**
     * @description 隐藏遮盖层
     */
    this.hideCover = function() {
        this.getView().isRender() && _isShowCover && _cover.hide();
        _isShowCover = null;
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
     * @param doDestroy 是否销毁内部对象
     */
    this.destroy = function( doDestroy ) {
        _config = _doAniming = _alwaysHideHeader = _currSubViewController = null;
        _useDragEdgesBack = _reg_i = _reg_ig = _cover = _isShowCover = null;
        _translate = _inertiaPoints = _inertiaPointIdx = _inertia = _inertiaTimeConsumings = null;
        Super( doDestroy );
    };
} );
