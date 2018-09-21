/**
 * @fileOverview Tab视图
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

Import( 'Fan.ui.PageView' );

/**
 * @author Fan
 * @class Fan.ui.TabView
 * @constructor TabView
 * @extends Fan.ui.PageView
 * @description 简单的Tab视图
 * @see The <a href="#">Fan</a >.
 * @example new TabView( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 * ### config 配置参数说明 ###
 * useDrag     - (boolean, 可选, 默认:true)  - 是否使用拖拽切换tab页
 * 
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
 * subViewChanged
 * animStatusByProgress
 * 
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
 * 
 * -- 与视图控制器相关事件
 * bindViewController
 * unbindViewController - 暂无此事件
 * }
 */
Class( 'Fan.ui.TabView', Fan.ui.PageView, function() {
    var
    _config,
 
    _reg_none_i = /^none$/i,
    // 抓取transform
    _reg_matrix_i = /^(matrix\s*\([^,]+,[^,]+,[^,]+,[^,]+),([^,]+),([^),]+)\)$/i,
    _reg_matrix3d_i = /^matrix3d\s*\((?:[^,]+,){15}[^),]+\)$/i,
    
    // 遮盖层
    _cover,
    _isShowCover,
    
    // 允许使用拖拽
    _useDrag,
    
    // 临时缓存css:translate的坐标记录, 在拖动结束时清空, 暂未使用
    _transform,
    _translate,
    _startX,
    _timer,
    
    // 惯性坐标点, 记录最后移动的5个点以及时间点, 由此判断惯性方向
    _inertiaPoints,
    _inertiaPointIdx,
    _inertiaTimeConsumings,
    
    // 最终确定的惯性方向: right | left
    _inertia,
    
    _defaultLongTime,
    
    // 当前激活的子view
    _currSubView;
    
    /**
     * @constructor 
     */
    this.TabView = function( config ) {
        // 当前配置
        _config = Class.apply( {
            useDrag : true
        }, config );
        
        // 父类配置
        config = Class.apply( {
            // 是否隐藏头部,尾部
            hideHeader : false,
            hideFooter : true,
            useUserInterface : _config.useDrag
        }, config );
        
        // 屏蔽配置
        delete config.useDrag;
        
        _useDrag = _config.useDrag;
        _defaultLongTime = 360;
        
        Super( config );
        
        var transform = this.getInnerDom().css( 'transform' );
        if ( !transform || _reg_none_i.test( transform ) || _reg_matrix3d_i.test( transform ) )
            transform = 'matrix(1, 0, 0, 1, 0, 0)';
        else {
            var m = transform.match( _reg_matrix_i );
            if ( m ) {
                transform = transform.replace( _reg_matrix_i, function( v1, v2, v3, v4 ) {
                    return v2 + ', 0, 0)';
                } );
            } else
                transform = 'matrix(1, 0, 0, 1, 0, 0)';
        }
        
        var prefix = '', style = this.getInnerDom()[ 0 ].style;
        switch ( true ) {
        case 'transform' in style :
            break;
        case 'webkitTransform' in style :
            prefix = '-webkit-';
            break;
        case 'MozTransform' in style :
            prefix = '-moz-';
            break;
        case 'msTransform' in style :
            prefix = '-ms-';
            break;
        case 'oTransform' in style :
            prefix = '-o-';
            break;
        }
        
        this.getInnerDom().css( 'transition-property', prefix + 'transform' );
        this.getInnerDom().css( 'transform', transform );
        //var cubicBezier = 'cubic-bezier(0.1, 0.57, 0.1, 1)';
        var cubicBezier = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        //var cubicBezier = 'ease-out';
        this.getInnerDom().css( 'transition-timing-function', cubicBezier );
        
        this.getBodyView().getDom().css( 'overflow', 'hidden' );
    };
    
    /**
     * @description 初始化, 构造对象时会被调用
     */
    this.init = function() {
        // 动态插入一个遮盖层, 用于切换动画中, 避免触发ui上的点击事件
        _cover = jQuery( '<div style="display:none;" class="layout-cover"></div>' );
        this.getDom().append( _cover );
        Super();
    };
    
    /**
     * @description 初始化用户交互事件, 构造对象时会被调用
     */
    this.initEvent = function() {
        // 临时缓存css:translate的坐标记录, 在拖动结束时清空, 暂未使用
        _translate = null;
        
        // 惯性坐标点, 记录最后移动的5个点, 由此判断惯性方向
        _inertiaPoints = [ Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY ];
        _inertiaTimeConsumings = [ 0, 0, 0, 0, 0 ];
        _inertiaPointIdx = 5;
        
        // 最终确定的惯性方向: right | left
        _inertia = 'left';
        
        var _maxWidth, _width,
            hasDrag = false,
            hasTapDonw = false,
            // touch事件数据对象, 用于控制touchstart,touchmove,touchend事件之间的关系
            touchstartData = {};
        
        // 触击按下时, 停止动作, 记录状态
        this.$on( Fan.util.TouchManager.eventName( 'touchstart' ), function( event ) {
            // 禁止拖拽
            if ( !_useDrag ) return;
            
            // 上次操作尚未释放
            if ( _translate ) return;
            
            var data = Fan.util.TouchManager.getTouchStartDataByEvent( event, touchstartData );
            if ( data.stopEvent ) return;
            touchstartData = data;
            
            // 判断是否符合边缘滑动返回的条件
            var y = Fan.dom.getXY( This.getHeaderView().getDom()[ 0 ] ).y;
            if ( data.currY < y + This.getHeaderView().getDom().height() || This.getSubViews().length <= 3 ) {
                // logger.warn( 'false:' + data.currY + ',' + y );
                return;
            }
            
            var elem = Fan.Event.getTarget( event );
            if ( !/^(input|textarea|select|option|button)$/i.test( elem.tagName ) ) {
                Fan.Event.cancel( event );
                // logger.warn( 'TabView.tapdown:cancel event' );
            }
            
            // Fan.stopAnim( this.getInnerDom()[ 0 ] );
            Fan.clearTimer( _timer );
            _transform = This.getInnerDom().css( 'transform' );
            
            // 将该动作, 放在下一帧时绘制
            //Fan.nextFrame( function() {
                This.getInnerDom().css( 'transition-duration', '0ms' );
                This.getInnerDom().css( 'transform', _transform );
            //} );
            
            hasTapDonw = true;
            hasDrag = false;
            
            _startX = null;
            _translate = { x : 0, y : 0, t : Fan.now() };
            _transform.replace( _reg_matrix_i, function( v1, v2, v3, v4 ) {
                _translate.x = v3 >> 0;
                _translate.y = v4 >> 0;
            } );
            
            // y坐标始终为0
            _translate.y = 0;
            
            // 记录触击时的页
            var curPage = This._getCurrPageIndex( _translate.x );
            _translate.p = curPage;
            
            // 单个宽度
            _width = This.getInnerDom().width();
            
            // 记录最大宽度
            _maxWidth = (This.getSubViews().length - 4) * _width;
            
            // logger.warn( '_translate.x:' + _translate.x );
            
            // 当前view若在拖拽时, 阻止事件冒泡, 取消默认行为
            // Fan.Event.cancel( event );
        } );
        
        // 实现边缘拖拽返回上一个vc
        this.$on( Fan.util.TouchManager.eventName( 'touchmove' ), function( event ) {
            // 禁止拖拽
            if ( !_useDrag ) return;
            
            // 若未触发拖动时的点击, 或者没有滚动事件权限时
            if ( !_translate || !This.getScrollAuthority() ) {
                // logger.warn( '未触发拖动时的点击, 或者正在滚动条事件' );
                return;
            }
            
            var data = Fan.util.TouchManager.getTouchMoveDataByEventAndTouchStartData( event, touchstartData );
            if ( data.stopEvent ) return;
            touchstartData = data;
            
            // 计算移动到的边界
            var x = _translate.x + data.speedX;
            
            // 垂直拖动不做处理, 相对移动的位置y>x, 则视为未发生水平拖动
            if ( Fan.ui.View.getScrollingView() != This && (Math.abs(data.speedY) >= Math.abs(data.speedX)) ) {
                // logger.warn('未发生水平拖动:');
                return;
            }
            
            // 获取并锁定权限
            if ( !This.getScrollAuthority( true ) ) {
                // 没有权限
                // logger.warn( '[TabView] - 无事件权限, 放弃拖拽' );
                return;
            }

            // 从新记录起点位置
            if ( null == _startX ) {
                _startX = x;
                // logger.info('重新计算起点:' + _startX);
            }
            
            // 起点偏移
            var offsetX = _startX != null ? _startX - _translate.x : 0;
            x -= offsetX;
            
            hasDrag = true;
            
            // 拖动时显示遮盖, 避免触发不必要的事件
            This.showCover();
            
            // 记录最近移动的5个点
            _inertiaPoints[ _inertiaPointIdx % 5 ] = x;
            // 记录移动的时间点
            _inertiaTimeConsumings[ _inertiaPointIdx++ % 5 ] = Fan.now();
            
            // logger.warn( 'x:' + x + ',w:' + _maxWidth + ',speedX:' + data.speedX );
            
            // 根据百分比调整vc位置
            This._animStatusByProgress( This.getInnerDom(), x );
            
            // 当前view若在拖拽时, 阻止事件冒泡, 取消默认行为
            Fan.Event.cancel( event );
            Fan.Event.stop( event );
        } );
        
        // 拖拽完毕
        this.$on( Fan.util.TouchManager.eventName( 'touchend' ), function( event ) {
            if ( !_useDrag ) return;
            
            if ( !_translate ) {
                This.ref();
                return;
            }
            
            var data = Fan.util.TouchManager.getTouchEndDataByEventAndTouchStartData( event, touchstartData );
            if ( data.stopEvent ) return;
            touchstartData = data;
            
            // 取出最后移动的5个点
            var p    = --_inertiaPointIdx % 5,
                p5   = _inertiaPoints[ p ],
                p5_t = _inertiaTimeConsumings[ p ];
                p    = --_inertiaPointIdx % 5;
            
            // 未发生拖动
            if ( p5 === Number.NEGATIVE_INFINITY || p5_t === 0 ) {
                This.ref();
                // 清理缓存
                _clearCache();
                
                // 释放滚动权限
                This.cancelScrollAuthority();
                return;
            }

            var p4   = _inertiaPoints[ p ],
                p4_t = _inertiaTimeConsumings[ p ];
                
            if ( p4 === Number.NEGATIVE_INFINITY ) {
                p4   = _translate.x;
                p4_t = _translate.t;
            }
            
            var p3 = _inertiaPoints[ --_inertiaPointIdx % 5 ],
                p2 = _inertiaPoints[ --_inertiaPointIdx % 5 ],
                p1 = _inertiaPoints[ --_inertiaPointIdx % 5 ];
            
            // 惯性方向检测
            var n = Number.NEGATIVE_INFINITY;
            switch( true ) {
            case p5 > p4 && p4 >= p3 && p3 >= p2 && p2 >= p1 :
                _inertia = 'right';
                break;
                
            case p5 < p4 && (p4 <= p3 || p3 == n) && (p3 <= p2 || p2 == n) && (p2 <= p1 || p1 == n) :
                _inertia = 'left';
                break;
                
            default :
                // 纵向拖拽, 不做处理, 保留原本惯性
                // logger.info( 'points:' + p5 + ',' + p4 + ',' + p3 + ',' + p2 + ',' + p1 );
                break;
            }
            
            // logger.info( 'points:' + p5 + ',' + p4 + ',' + p3 + ',' + p2 + ',' + p1 );
            
            var
            // 最后一步距离
            lastStepDistance = Math.abs( p5 - p4 ),
            
            // 最后一步耗时
            lastTime = p5_t - p4_t;
            // 暂未出现, 但为避免0, 故最小耗时为1
            lastTime = lastTime < 1 ? 1 : lastTime;
            
            // logger.warn( '最后距离:' + lastStepDistance + ',耗时:' + lastTime + ',points:' + p5 + ',' + p4 + ',' + p3 + ',' + p2 + ',' + p1 );
            
            // 当前速度,每1毫秒移动的百分比
            var currSpeed = lastStepDistance / lastTime;
            
            if ( _inertia == 'right' ) {
                // logger.info( '[惯性移动]: →' );
                
                // 获取当前所在的页
                var
                curPage = This._getCurrPageIndex( p5 ),
                maxPage = Math.abs( _maxWidth / _width ) + 1,
                nextPage;
                
                switch ( true ) {
                case currSpeed < 0.35 :
                    // 速度不足0.35, 则在本页
                    nextPage = curPage;
                    break;
                case currSpeed > 7 :
                    // 速度大于7, 则跨页3页
                    nextPage = curPage - 4;
                    _translate.p != curPage && (nextPage += 1);
                    break;
                case currSpeed > 5 :
                    // 速度大于5, 则跨页2页
                    nextPage = curPage - 3;
                    _translate.p != curPage && (nextPage += 1);
                    break;
                case currSpeed > 3 :
                    // 速度大于2.5, 则跨页1页
                    nextPage = curPage - 2;
                    _translate.p != curPage && (nextPage += 1);
                    break;
                default :
                    // 默认下一页
                    nextPage = curPage - 1;
                    _translate.p != curPage && (nextPage += 1);
                    break;
                }
                
                // 判断是否超过边界
                nextPage = nextPage < 1 ? 1 : nextPage;
                nextPage = nextPage > maxPage ? maxPage : nextPage;
                
                var end = -((nextPage - 1) * _width);
                
                // logger.info( 'curPage:' + curPage + ',nextPage:' + nextPage + ',end:' + end + ',距:' + lastStepDistance + ',耗:' + lastTime + '速:' + currSpeed );
                
                var longTime = _defaultLongTime;
                if ( _translate.p != curPage ) {
                    longTime = Math.ceil( _defaultLongTime * 0.8 );
                }
                
                // 惯性移动
                This.getInnerDom().css( 'transition-duration', longTime + 'ms' );
                This._animStatusByProgress( This.getInnerDom(), end );
                
                _timer = Fan.defer( function() {
                    This.getInnerDom().css( 'transition-duration', '0ms' );
                    var page = This._getCurrPageIndex( end );
                    var subView = This.getSubViews()[ page + 2 ];
                    if ( _currSubView != subView ) {
                        subView.ref();
                        
                        subView.getDom().parent().parent().css( 'z-index', Class.id() );
                        
                        This.fireEvent( 'subViewChanged', [ subView, _currSubView ] );
                        _currSubView = subView;
                    }
                    
                    This.hideCover();
                    
                    // 释放滚动权限
                    This.cancelScrollAuthority();
                }, longTime );
                
            } else if ( _inertia == 'left' ) {
                // logger.info( '[惯性移动]: ←' );
                
                // 获取当前所在的页
                var
                curPage = This._getCurrPageIndex( p5 ),
                maxPage = Math.abs( _maxWidth / _width ) + 1,
                nextPage;
                
                switch ( true ) {
                case currSpeed < 0.35 :
                    // 速度不足0.35, 则在本页
                    nextPage = curPage;
                    break;
                case currSpeed > 7 :
                    // 速度大于7, 则跨页3页
                    nextPage = curPage + 4;
                    _translate.p != curPage && (nextPage -= 1);
                    break;
                case currSpeed > 5 :
                    // 速度大于5, 则跨页2页
                    nextPage = curPage + 3;
                    _translate.p != curPage && (nextPage -= 1);
                    break;
                case currSpeed > 3 :
                    // 速度大于2.5, 则跨页1页
                    nextPage = curPage + 2;
                    _translate.p != curPage && (nextPage -= 1);
                    break;
                default :
                    // 默认下一页
                    nextPage = curPage + 1;
                    _translate.p != curPage && (nextPage -= 1);
                    break;
                }
                
                // 判断是否超过边界
                nextPage = nextPage < 1 ? 1 : nextPage;
                nextPage = nextPage > maxPage ? maxPage : nextPage;
                
                var end = -((nextPage - 1) * _width);

                // logger.info( 'curPage:' + curPage + ',nextPage:' + nextPage + ',end:' + end + ',距:' + lastStepDistance + ',耗:' + lastTime + '速:' + currSpeed );

                var longTime = _defaultLongTime;
                if ( _translate.p != curPage ) {
                    longTime = Math.ceil( _defaultLongTime * 0.8 );
                }
                
                // 惯性移动
                This.getInnerDom().css( 'transition-duration', longTime + 'ms' );
                This._animStatusByProgress( This.getInnerDom(), end );
                
                _timer = Fan.defer( function() {
                    This.getInnerDom().css( 'transition-duration', '0ms' );
                    var page = This._getCurrPageIndex( end );
                    var subView = This.getSubViews()[ page + 2 ];
                    if ( _currSubView != subView ) {
                        subView.ref();
                        
                        subView.getDom().parent().parent().css( 'z-index', Class.id() );
                        
                        This.fireEvent( 'subViewChanged', [ subView, _currSubView ] );
                        _currSubView = subView;
                    }
                    
                    This.hideCover();
                    
                    // 释放滚动权限
                    This.cancelScrollAuthority();
                }, longTime );
                
            } else {
                This.hideCover();
                // 释放滚动权限
                This.cancelScrollAuthority();
            }
            
            // 清理缓存
           _clearCache();
           
           // 当前view若在拖拽时, 阻止事件冒泡, 取消默认行为
           Fan.Event.cancel( event );
           Fan.Event.stop( event );
        } );
        
        // 触击结束时, 根据情况恢复
        this.$on( Fan.util.TouchManager.eventName( 'touchend' ), function( event ) {
            if ( !_useDrag ) return;
            
            if ( hasTapDonw && !hasDrag && touchstartData.tap ) {
                This.ref();
            }
        } );
        
        Super();
    };
    
    /**
     * @description 刷新
     */
    this.ref = function() {
        if ( this.isRender() ) {
            var page = this._getCurrPageIndex();
            Fan.isNumber( page ) && this.gotoSubView( page );
        }
        Super();
    };
    
    /**
     * @private
     * @description 清理缓存
     */
    var _clearCache = function() {
        // 重置缓存
        _translate = null;
        _startX = null;
        _inertiaPointIdx = 5;
        _inertiaPoints[ 0 ] = Number.NEGATIVE_INFINITY;
        _inertiaPoints[ 1 ] = Number.NEGATIVE_INFINITY;
        _inertiaPoints[ 2 ] = Number.NEGATIVE_INFINITY;
        _inertiaPoints[ 3 ] = Number.NEGATIVE_INFINITY;
        _inertiaPoints[ 4 ] = Number.NEGATIVE_INFINITY;
        _inertiaTimeConsumings[ 0 ] = 0;
        _inertiaTimeConsumings[ 1 ] = 0;
        _inertiaTimeConsumings[ 2 ] = 0;
        _inertiaTimeConsumings[ 3 ] = 0;
        _inertiaTimeConsumings[ 4 ] = 0;
    };
    
    /**
     * @private
     * @description 根据当前偏移量, 获取可视面积最大的view的顺序索引
     * @param {number} x 偏移值, 缺省时自动取当前偏移值
     * @returns {int}
     */
    this._getCurrPageIndex = function( x ) {
        if ( x == null ) {
            var transform = this.getInnerDom().css( 'transform' );
            transform.replace( _reg_matrix_i, function( v1, v2, v3, v4 ) {
                x = v3 >> 0;
            } );
        }
        var width = this.getInnerDom().width();
        var maxWidth = (this.getSubViews().length - 4) * width;
        var curPage = x + ( width / 2);
        curPage = x > 0 ? 1 : x < -maxWidth ? Math.abs( maxWidth / width ) + 1 : Math.abs( Math.floor( curPage / width ) ) + 1;
        
        return curPage;
    };
    
    /**
     * @description 跳转至指定的子view
     * @param {View|int} subViewOrPageIndex 子view对象或view对应在tab中的索引号
     * @param {Function} callback 跳转后的回调
     */
    this.gotoSubView = function( subViewOrPageIndex, callback ) {
        var page = subViewOrPageIndex, views = this.getSubViews();
        if ( subViewOrPageIndex instanceof Fan.ui.View ) {
            for ( var i = 3, len = views.length; i < len; ++i ) {
                if ( subViewOrPageIndex === views[ i ] ) {
                    page = i - 2;
                }
            }
            page = null;
        }
        
        if ( Fan.isNumber( page ) ) {
            // 判断是否超过边界
            var width = this.getInnerDom().width();
            var maxWidth = (views.length - 4) * width;
            var maxPage = Math.abs( maxWidth / width ) + 1;
            page = page < 1 ? 1 : page;
            page = page > maxPage ? maxPage : page;
            
            var end = -((page - 1) * width);
            
            this.getInnerDom().css( 'transition-duration', _defaultLongTime + 'ms' );
            this._animStatusByProgress( this.getInnerDom(), end );
            
            _timer = Fan.defer( function() {
                var subView = This.getSubViews()[ page + 2 ];
                if ( _currSubView != subView ) {
                    subView.ref();
                    
                    subView.getDom().parent().parent().css( 'z-index', Class.id() );
                    
                    This.fireEvent( 'subViewChanged', [ subView, _currSubView ] );
                    _currSubView = subView;
                }
                callback && callback();
            }, _defaultLongTime );
        } else {
            logger.warn( '[TabView] - 跳转失败, gotoSubView:' + subViewOrPageIndex );
        }
    };
    
    /**
     * @private
     * @description 根据百分比进度值, 呈现滑动的比例状态(用于切换当前view时的动画之中)
     * @param {JQueryObject} dom 被计算动画的dom元素
     * @param {float} destX 结束值
     */
    this._animStatusByProgress = function( dom, destX ) {
        if ( !_transform )
            _transform = dom.css( 'transform' );
        if ( _reg_none_i.test( _transform ) || _reg_matrix3d_i.test( _transform ) )
            _transform = 'matrix(1, 0, 0, 1, 0, 0)';
        
        _transform = _transform.replace( _reg_matrix_i, function( v1, v2, v3, v4 ) {
            return v2 + ', ' + destX + ', 0)';
        } );
        
        // 将该动作, 放在下一帧时绘制
        Fan.nextFrame( function() {
            dom.css( 'transform', _transform );
        } );
//        Fan.frame( function( easing ) {
//            dom.css( 'transform', _transform );
//        }, 0 );
        
        // dom.css( 'transform', _transform );
        
        // 触发事件, 用于其他动态效果扩展
        this.fireEvent( 'animStatusByProgress', [ this, destX ] );
    };
    
    /**
     * @override
     */
    this.addSubView = function( subView, atIndex ) {
        var subViews = this.getSubViews();
        
        var len = subViews.length <= 3 ? 3 : subViews.length;
        
        // 新加的view, 都套一个div, 用于布局, 从第4个子view开始算位置(前3个是header,body,footer)
        var parentDom = jQuery( '<div class="layout-body layout-tab-item-wrap" style="z-index:' + Class.id() + ';left:' + ((len - 3) * 100) + '%;"><div class="layout-body"></div></div>' );
        this.getInnerDom().append( parentDom );
        
        // div作为view的容器
        subView.setParentDom( parentDom.find( '.layout-body' ) );
        
        Super( subView, atIndex );
    };
    
    /**
     * @description 从当前view中删除指定view
     * @param {View|String} subViewOrId 子view或子view的id
     * @param doDestroy 是否销毁子view
     */
    this.removeSubView = function( subViewOrId, doDestroy ) {
        Super( subViewOrId, doDestroy );
    };
    
    /**
     * @description 显示遮盖层
     */
    this.showCover = function() {
        this.isRender() && !_isShowCover && _cover.show();
        _isShowCover = true;
    };
    
    /**
     * @description 隐藏遮盖层
     */
    this.hideCover = function() {
        this.isRender() && _isShowCover && _cover.hide();
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
        _config = _reg_none_i = _reg_matrix_i = _cover = _isShowCover = _useDrag = null;
        _transform = _translate = _inertiaPoints = _inertiaPointIdx = null;
        _inertiaTimeConsumings = _inertia = _defaultLongTime = _currSubView = null;
        Super( doDestroy );
    };
} );
