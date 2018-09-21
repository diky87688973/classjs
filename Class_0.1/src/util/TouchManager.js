Package( 'Fan.util' );

Import( 'Fan.util.Dom' );

/**
 * 静态类, 手指触摸管理器
 * 被列入管理器中的元素, 将可能会触发以下事件:
 * 1, swipeleft - 单指左刷
 * 2, swiperight - 单指右刷
 * 3, swipeup - 单指上刷
 * 4, swipedown - 单指下刷
 * 5, tapup - 触击按下
 * 6, tapdown - 触击松开
 * 7, tap - 触击一次(单击)
 * 8, doubletap - 双击
 * 9, drag - 拖动
 * 10, dragend - 拖动停止
 */
Class( 'Fan.util.TouchManager', function() {} );

(function ( TouchManager ) {
    var
    
    /**
     * touchstart：触摸开始的时候触发
     * touchmove：手指在屏幕上滑动的时候触发
     * touchend：触摸结束的时候触发
     * 
     * 而每个触摸事件都包括了三个触摸列表，每个列表里包含了对应的一系列触摸点（用来实现多点触控）：
     * touches：当前位于屏幕上的所有手指的列表。
     * targetTouches：位于当前DOM元素上手指的列表。
     * changedTouches：涉及当前事件手指的列表。
     * 
     * 每个触摸点由包含了如下触摸信息（常用）：
     * identifier：一个数值，唯一标识触摸会话（touch session）中的当前手指。一般为从0开始的流水号（android4.1，uc）
     * target：DOM元素，是动作所针对的目标。
     * pageX/pageX/clientX/clientY/screenX/screenY：一个数值，动作在屏幕上发生的位置（page包含滚动距离,client不包含滚动距离，screen则以屏幕为基准）。
     */
    
    // 在不支持touch的浏览器中,则以鼠标事件代替
    eventName = 'ontouchend' in document ? {
        touchstart : 'touchstart',
        touchend : 'touchend',
        touchmove : 'touchmove'
    } : {
        touchstart : 'mousedown',
        touchend : 'mouseup',
        touchmove : 'mousemove'
    },
    
    // 保存受管理的元素和事件处理函数的集合
    elems  = Class.map(),
    events = Class.map(),
    
    // 判定滑动的最小距离, 默认20px
    minSpeed = 20,
    
    // 判断是否是鼠标事件
    _isMouseEvent = function ( event ) {
        return (event instanceof (window.MouseEvent || Class.noop)) || /^mouse|^(contextmenu$|DOMMouseScroll)$/i.test( event.type );
    },
    
    // 触摸管理器
    manager = {
        /**
         * 处理touchstart|mousedown事件, 并返回状态数据
         */
        getTouchStartDataByEvent : function( event, data, filterTagReg ) {
            if ( event._isProcessTouchEventData )
                return event._isProcessTouchEventData;
            
            data = data || {};
            event._isProcessTouchEventData = data;
            
            data.stopEvent   = false;
            data.tapdup      = false;
            data.tapdown     = false;
            data.tap         = false;
            data.doubletap   = false;
            data.swipeup     = false;
            data.swipedown   = false;
            data.swipeleft   = false;
            data.swiperight  = false;
            filterTagReg     = filterTagReg || /^(input|textarea|select|option|button)$/i;
            
            // 是否为鼠标一般事件
            var isMouseEvent = _isMouseEvent( event ),
            
                target  = event.target || event.srcElement,
                tagName = target.tagName;
            
            
            
            if ( isMouseEvent ) {
                
                // 提高效率,组织浏览器默认行为, 当点击的是input|textarea|select|option|button则不阻止
                if ( (Fan.isFunction( filterTagReg ) ? filterTagReg( target ) : filterTagReg.test( tagName )) ) {
                    // logger.debug( '放弃touch动作:tagName:' + tagName + ', ' + eventName[ 'touchstart' ] );
                    
                    data.stopEvent = true;
                    // return data;
                } else {
                    // 阻止浏览器默认行为
                    Fan.Event.cancel( event );
                    // logger.debug( '阻止默认行为:tagName:' + tagName + ', ' + eventName[ 'touchstart' ] );
                }
            }

            // 检测是已经否存在touch事件,是则本次触发无效
            if ( data.isTouch && isMouseEvent ) {
                // logger.debug( '触摸无效:' + eventName[ 'touchstart' ] );
                data.stopEvent = true;
                return data;
            }
            
            // 鼠标事件 或 单指触摸
            if ( isMouseEvent || event.changedTouches.length >= 1 ) {

                // 兼容鼠标, 若该操作由鼠标事件触发, 则取出鼠标位置
                if ( !event.changedTouches ) {
                    var xy = Fan.Event.getXY( event );
                    data.startX = xy.x;
                    data.startY = xy.y;
                } else {
                    // 取出手指位置
                    var touch = event.changedTouches[ 0 ];
                    // 触发该元素的单指拖动事件
                    data.startX = touch.pageX;
                    data.startY = touch.pageY;
                }
                
                // 记录触摸
                data.isTouch = true;
                data.isDraging = false;
            }
            
            data.currX = data.startX;
            data.currY = data.startY;
            
            // 触击按下
            // logger.info( '●' );
            data.tapdown = true;
            
            return data;
        },
        
        /**
         * 处理touchmove|mousemove事件, 并返回状态数据
         */
        getTouchMoveDataByEventAndTouchStartData : function( event, data, cancelEvent ) {
            if ( event._isProcessTouchEventData )
                return event._isProcessTouchEventData;
            
            data = data || {};
            event._isProcessTouchEventData = data;
            
            data.stopEvent = false;
            var isMouseEvent = _isMouseEvent( event );
            
            // 阻止浏览器默认动作,滑动,缩放
            cancelEvent && Fan.Event.cancel( event );
            
            // 当触摸结束或鼠标按键松开
            if ( (event.touches && event.touches.length < 1) || !data.isTouch || (isMouseEvent && Fan.getMouseWhichKey() === 0) ) {
                /*data.isDraging && manager.fireEvent( document.body, 'dragend', [ event, data, that ] );*/
                
                // 当前没有手指在屏幕上
                if ( isMouseEvent || (event.touches && event.touches.length < 1) ) {
                    data.isDraging = false;
                    data.isTouch = false;
                }
                
                // logger.debug( '触摸已经结束, 停止拖动' );
                data.stopEvent = true;
                return data;
            }
            
            // 鼠标事件 或 单指触摸
            if ( isMouseEvent || event.changedTouches.length >= 1 ) {
                // 兼容鼠标, 若该操作由鼠标事件触发, 则取出鼠标位置
                if ( !event.changedTouches ) {
                    var xy = Fan.Event.getXY( event );
                    data.currX = xy.x;
                    data.currY = xy.y;
                } else {
                    var touch = event.changedTouches[ 0 ];
                    data.currX = touch.pageX;
                    data.currY = touch.pageY;
                }

                // 拖动事件, 传递起点和当前点坐标
                data.isDraging = true;
                data.speedX = data.currX - data.startX;
                data.speedY = data.currY - data.startY;
                
                /*manager.fireEvent( document.body, 'drag', [ event, data ] );*/
            }
            
            return data;
        },
        
        /**
         * 处理touchend|mouseup事件, 并返回状态数据
         */
        getTouchEndDataByEventAndTouchStartData : function( event, data ) {
            if ( event._isProcessTouchEventData )
                return event._isProcessTouchEventData;
            
            data = data || {};
            event._isProcessTouchEventData = data;
            
            data.stopEvent   = false;
            data.tapdup      = false;
            data.tapdown     = false;
            data.tap         = false;
            data.doubletap   = false;
            data.swipeup     = false;
            data.swipedown   = false;
            data.swipeleft   = false;
            data.swiperight  = false;
            var isMouseEvent = _isMouseEvent( event );
            
            // 兼容鼠标, 若该操作由鼠标事件触发, 则取出鼠标位置
            if ( !event.changedTouches ) {
                var xy = Fan.Event.getXY( event );
                data.currX = xy.x;
                data.currY = xy.y;
            } else {
                var touch = event.changedTouches[ 0 ];
                data.currX = touch ? touch.pageX : data.currX;
                data.currY = touch ? touch.pageY : data.currY;
            }
            
            // 触击松开
            // logger.info( '○' );
            
            data.speedX = data.currX - data.startX;
            data.speedY = data.currY - data.startY;
            
            data.tapup = true;
            /*manager.fireEvent( document.body, 'tapup', [ event, data, that ] );*/

            // 判断触点间距, 以及确定移动方向
            var x = data.speedX, y = data.speedY,
                toRight = x > 0, toDown = y > 0;
                x = Math.abs( x );
                y = Math.abs( y );

            // 任何一项大于最小间距,则视为拖动
            if ( x > minSpeed || y > minSpeed ) {
                // 若x位移大于y, 则视为左右移动
                if ( x >= y ) {
                    if ( toRight ) {
                        // 右移
                        // logger.info( '→' );
                        data.swiperight = true;
                        /*manager.fireEvent( document.body, 'swiperight', [ event, data, that ] );*/
                    } else {
                        // 左移
                        // logger.info( '←' );
                        data.swipeleft = true;
                        /*manager.fireEvent( document.body, 'swipeleft', [ event, data, that ] );*/
                    }
                } else {
                    // 上下移动
                    if ( toDown ) {
                        // 下移
                        // logger.info( '↓' );
                        data.swipedown = true;
                        /*manager.fireEvent( document.body, 'swipedown', [ event, data, that ] );*/
                    } else {
                        // 上移
                        // logger.info( '↑' );
                        data.swipeup = true;
                        /*manager.fireEvent( document.body, 'swipeup', [ event, data, that ] );*/
                    }
                }
                data.doubletapFlg = null;
            } else {
                // 否则视为单击
                // logger.info( '⊙' );
                data.tap = true;
                /*manager.fireEvent( document.body, 'tap', [ event, data, that ] );*/
                
                // 600毫秒内,再次单击,且2次单击的坐标在+-20px之内, 则算一次双击
                if ( data.doubletapFlg && ( Math.abs( data.doubletapFlg.x - data.currX ) < 20 && Math.abs( data.doubletapFlg.y - data.currY ) < 20 ) ) {
                    data.doubletapFlg = null;
                    data.doubletap = true;
                    // logger.info( '⊙⊙' );
                    /*manager.fireEvent( document.body, 'doubletap', [ event, that ] );*/
                } else {
                    if( data.doubletapFlg )
                        clearTimeout( data.doubletapFlg.timer );
                    
                    data.doubletapFlg = {
                        x : data.currX,
                        y : data.currY,
                        timer : setTimeout( function() {
                            data.doubletapFlg = null;
                        }, 600 )
                    };
                }
            }

            // 拖动事件结束
            /*data.isDraging && manager.fireEvent( document.body, 'dragend', [ event, data, that ] );*/
            
            // 当前没有手指在屏幕上
            if ( isMouseEvent || (event.touches && event.touches.length < 1) ) {
                data.isDraging = false;
                data.isTouch = false;
            }
            
            return data;
        },
        
        /**
         * 添加一个dom元素到触碰管理器中
         * @param elem - 需要被管理的dom元素
         * @param filterTagReg - 可以是个函数,并接受一个当前触碰的dom元素,函数返回true则放弃touch动作.
         *                       也可以是一个正则对象,用于过滤触碰的元素标签名称,正则返回true时,放弃touch动作.
         * @returns {Boolean}
         */
        add : function ( elem, filterTagReg ) {
            elem = jQuery( elem )[ 0 ];
            if ( !elem || !Fan.isElement( elem ) )
                return false;

            // 取出管理id
            var elemId = jQuery( elem ).attr( '_oop_touch_manager_id_' );

            // 若已经存在管理中, 则直接返回
            if ( elemId && elems.has( elemId ) )
                return true;

            // 生成一个新的id, 并纳入管理的集合中
            elemId = Class.id( '_oop_touch_manager_id_' );
            jQuery( elem ).attr( '_oop_touch_manager_id_', elemId );
            elems.put( elemId, elem );

            // 记录三个管理事件, 移除时需用到
            var evts = {};
            
            // 用于过滤touchstart时触碰的元素标签名称
            filterTagReg = filterTagReg || /^(input|textarea|select|option|button)$/i;
            
            // 单指触碰开始
            var touchstartData = {};
            Fan.addEvent( elem, eventName[ 'touchstart' ], evts.touchstart = function ( event ) {
                var data = Fan.util.TouchManager.getTouchStartDataByEvent( event, touchstartData, filterTagReg );
                if ( data.stopEvent )
                    return;
                touchstartData = data;
                
                if ( data.tapdown ) {
                    manager.fireEvent( document.body, 'tapdown', [ event, data, Class.ieDocMode < 9 ? elem : this ] );
                }
            } );

            // 单指触碰结束, 计算触点距离, 判定触摸方向
            Fan.addEvent( elem, eventName[ 'touchend' ], evts.touchend = function ( event, flag ) {
                var data = Fan.util.TouchManager.getTouchEndDataByEventAndTouchStartData( event, touchstartData );
                if ( data.stopEvent )
                    return;
                touchstartData = data;
                
                if ( data.tapup ) {
                    manager.fireEvent( document.body, 'tapup', [ event, data, Class.ieDocMode < 9 ? elem : this ] );
                }
                
                if ( data.tap ) {
                    manager.fireEvent( document.body, 'tap', [ event, data, Class.ieDocMode < 9 ? elem : this ] );
                }
                
                if ( data.doubletap ) {
                    manager.fireEvent( document.body, 'doubletap', [ event, data, Class.ieDocMode < 9 ? elem : this ] );
                }
                
                if ( data.swipeleft ) {
                    manager.fireEvent( document.body, 'swipeleft', [ event, data, Class.ieDocMode < 9 ? elem : this ] );
                } else if ( data.swiperight ) {
                    manager.fireEvent( document.body, 'swiperight', [ event, data, Class.ieDocMode < 9 ? elem : this ] );
                } else if ( data.swipeup ) {
                    manager.fireEvent( document.body, 'swipeup', [ event, data, Class.ieDocMode < 9 ? elem : this ] );
                } else if ( data.swipedown ) {
                    manager.fireEvent( document.body, 'swipedown', [ event, data, Class.ieDocMode < 9 ? elem : this ] );
                }
            } );

            // 单指拖动
            Fan.addEvent( elem, eventName[ 'touchmove' ], evts.touchmove = function ( event ) {
                var data = Fan.util.TouchManager.getTouchMoveDataByEventAndTouchStartData( event, touchstartData );
                if ( data.stopEvent )
                    return;
                touchstartData = data;
            } );
            
            // 保存被管理的事件
            events.put( elemId, evts );
            
            // 销毁可能造成闭包引用的对象
            !(Class.ieDocMode < 9) && (elem = null);
            
            // logger.info( '[触摸管理器] - 新增元素: ' + elemId );
            return true;
        },
        
        // 从管理器中移除元素
        remove : function ( elem ) {
            elem = jQuery( elem )[ 0 ];
            
            if ( !elem || !Fan.isElement( elem ) )
                return false;
            
            var elemId = jQuery( elem ).attr( '_oop_touch_manager_id_' );
            
            // 尝试删除被管理的元素, 若存在, 则移除事件
            if ( elems.remove( elemId ) ) {
                var evts = events.remove( elemId );
                if ( evts ) {
                    Fan.removeEvent( elem, eventName[ 'touchstart' ], evts.touchstart );
                    Fan.removeEvent( elem, eventName[ 'touchend' ], evts.touchend );
                    Fan.removeEvent( elem, eventName[ 'touchmove' ], evts.touchmove );
                    evts.touchstart  = evts.touchend = evts.touchmove = null;
                }
                // logger.debug( '[触摸管理器] - 移除元素: ' + elemId );
            }
        },
        
        // 触发自定义的事件, 支持在指定元素内冒泡
        fireEvent : function( wrapElem, eventType, args ) {
            var ret,
                srcEvent = args[ 0 ],
                subElem  = Fan.Event.getTarget( srcEvent ),
                target   = subElem;

            // 从最内层的元素开始触发事件, 模拟冒泡触发事件
            var id = Class.id(), attr;
            while ( wrapElem && subElem && Fan.dom.contains( wrapElem, subElem ) ) {
                attr = subElem.getAttribute( 'ui-use-user-interface' );
                
                if ( null == attr ) {
                    
                     // logger.debug( '[自定义事件冒泡] - 忽略:' + id + ':' + eventType + ', wrap:' + wrapElem.tagName + ', sub:' + subElem.tagName + ', className:' + subElem.className );
                     subElem = subElem.parentElement || subElem.parentNode;
                     continue;
                    
                } else if ( attr === 'false' ) {
                    // 打上ui-use-user-interface属性标志, 且值为false, 则停止事件冒泡
                    // logger.debug('[自定义事件冒泡] - 停止冒泡, useUserInterface:false');
                    Fan.Event.stop( srcEvent );
                    
                    return ret;
                }
                
                // logger.debug( '[自定义事件冒泡] - 冒泡:' + id + ':' + eventType + ', wrap:' + wrapElem.tagName + ', sub:' + (wrapElem === subElem) + ', className:' + subElem.className );
                ret = Fan.fireEvent( subElem, { target : target, type : eventType }, args );
                
                if ( srcEvent.cancelBubble )
                    return ret;
                
                subElem = subElem.parentElement || subElem.parentNode;
            }
            
            // 外层的事件触发
            ret = Fan.fireEvent( wrapElem || document.body || document.documentElement, { target : target, type : eventType }, args );
            
            return ret;
        },
        
        // 设置判定滑动的最小距离
        setMinSpeed : function( speed ) {
            minSpeed = speed || 20;
        },
        
        // 返回所支持的事件的名字,如: mousedown -> touchstart
        eventName : function( evtName ) {
            return eventName[ evtName ] || evtName;
        }
    };
    
    // 暴露接口
    Class.apply( TouchManager, manager );
    
    // 阻止默认行为
    Fan.addEvent( document, eventName[ 'touchmove' ], function ( event ) { Fan.Event.cancel( event ); } );
    
})( Fan.util.TouchManager );