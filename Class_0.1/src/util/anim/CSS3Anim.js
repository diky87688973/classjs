Package( 'Fan.util.anim' );

/**
 * 静态类, 提供简单的css3动画特效
 *
 */
Class( 'Fan.util.anim.CSS3Anim', function() {} );

(function ( CSS3Anim ) {
    var
    // css前缀
    _cssPrefix = (function() {
        var style = document.createElement( 'div' ).style;
        switch ( true ) {
        case 'transform'       in style : return '';
        case 'webkitTransform' in style : return '-webkit-';
        case 'MozTransform'    in style : return '-moz-';
        case 'msTransform'     in style : return '-ms-';
        case 'oTransform'      in style : return '-o-';
        }
        return '';
    })(),
    
    // 特效
    effects = {
        zoom : {
            // 获取基点偏移坐标
            getOriginOffset : function( subElem, parentElem ) {
                /**
                 * Origin偏移计算公式:
                 * 若需要将elem缩放填充至某个矩形容器中
                 *
                 * elem中心和容器中心重合时elem的x       容器的中心点x
                 * -----------------------   =   --------------------
                 *       elem当前的x                elem当前放大的基点x
                 */
                
                subElem      = $( subElem );
                parentElem   = $( parentElem );
                
                var wh       = { w : parentElem.width(), h : parentElem.height() },
                    bWidth   = wh.w / subElem.width(),    // 宽度比例
                    bHeight  = wh.h / subElem.height(),   // 高度比例
                    centerXY = { x : wh.w / 2, y : wh.h / 2 }, // 屏幕中心点
                
                    // 当前xy
                    xy1      = Fan.dom.getXY( subElem[ 0 ] ),
                    xy2      = Fan.dom.getXY( parentElem[ 0 ] ),
                    xy       = { xx : xy1.x - xy2.x, yy : xy1.y - xy2.y },
                
                    // 当前中心点xy
                    centerX  = (xy.xx + subElem.width() - xy.xx) / 2 + xy.xx,
                    centerY  = (xy.yy + subElem.height() - xy.yy) / 2 + xy.yy,
                
                    // 中心点重合时的xy
                    cx       = xy.xx + (centerXY.x - centerX),
                    cy       = xy.yy + (centerXY.y - centerY),
                
                    // 套公式计算基点
                    originX  = xy.xx * centerXY.x / cx,
                    originY  = xy.yy * centerXY.y / cy;
                
                logger.info( '[容器] - 宽度:' + wh.w + ', 高度:' + wh.h + ', 宽度比例:' + bWidth + ', 高度比例:' + bHeight + ', 中点:[' + centerXY.x + ',' + centerXY.y + ']' );
                logger.info( '当前元素:[' + xy.xx + ',' + xy.yy + '],当前中点:[' + centerX + ',' + centerY + '],中心时:[' + cx + ',' + cy + '],基点:[' + originX + ',' + originY + ']' );
                
                return {
                    originX     : originX,
                    originY     : originY,
                    scaleWidth  : bWidth,
                    scaleHeight : bHeight
                };
            },
            
            // 放大, 将子元素放大并填满父元素
            amplify : function( subElem, parentElem, longTime, callback ) {
                longTime = longTime >> 0;
                
                var offset      = this.getOriginOffset( subElem, parentElem ),
                    $parentElem = $( parentElem ),    
                    srcProperty = $parentElem.css( 'transition-property' ),
                    srcFunction = $parentElem.css( 'transition-timing-function' );
                
                // 应用样式
                $parentElem.css( {
                    transformOrigin          : offset.originX + 'px ' + offset.originY + 'px 0px',
                    transitionProperty       : _cssPrefix + 'transform',
                    transitionTimingFunction : 'ease-out',
                    transitionDuration       : longTime + 'ms'
                } );
                
                $parentElem.css( {
                    transform : 'scale(' + offset.scaleWidth + ', ' + offset.scaleHeight + ') translateZ(0)'
                } );
                
                setTimeout( function() {
                    // 还原设置
                    $parentElem.css( {
                        transitionProperty       : srcProperty,
                        transitionTimingFunction : srcFunction
                    } );
                    Fan.call( callback, CSS3Anim, [ subElem, parentElem, offset ] );
                    
                    subElem = parentElem = $parentElem = longTime = callback = offset = srcProperty = srcFunction = null;
                }, longTime );
                
                return offset;
            },
            
            // 恢复原始比例
            recover : function( parentElem, longTime, callback ) {
                $( parentElem ).css( {
                    transitionDuration : longTime + 'ms'
                } );
                
                $( parentElem ).css( {
                    transform : 'scale(1, 1) translateZ(0)'
                } );
                
                setTimeout( function() {
                    Fan.call( callback, CSS3Anim, [ parentElem ] );
                   
                    parentElem = longTime = callback = null;
                }, longTime );
            }
        }
    };
    
    // 暴露接口
    Class.apply( CSS3Anim, effects );
    
})( Fan.util.anim.CSS3Anim );