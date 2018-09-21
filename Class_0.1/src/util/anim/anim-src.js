/**
 * 简单缓动效果封装
 * 
 * anim(
 * - startNumber 开始值
 * - endNumber 结束值
 * - longTime 动画过程时间
 * - stepCallback( currentNumber, progress, fps ) 每一桢回调(每一次变换)
 * - completeCallback() 动画结束回调
 * )
 * 
 * return stopFn 返回一个函数,调用该函数可以停止动画,传入参数true表示停止到最终位置,并调用完成回调
 */
(function( window ) {
    var RAF_timerId = null,
        RAF = window.requestAnimationFrame
            || window.webkitRequestAnimationFrame
            || window.mozRequestAnimationFrame
            || window.oRequestAnimationFrame
            || window.msRequestAnimationFrame
            || function( callback ) {
                   return RAF_timerId = window.setTimeout( callback, 1000 / 60 );
               },
        CAF = window.cancelAnimationFrame
            || window.webkitCancelAnimationFrame
            || window.mozCancelAnimationFrame
            || window.oCancelAnimationFrame
            || function( timerId ) {
                   if ( timerId ) {
                       window.clearTimeout( timerId );
                       return;
                   }
                   RAF_timerId && window.clearTimeout( RAF_timerId );
                   RAF_timerId = null;
               };

    // 下一帧回调
    function nextFrame( callback ) {
        return RAF( callback );
    };

    // 取消下一帧回调
    function cancelNextFrame( timerId ) {
        CAF( timerId );
    };

    // 取时间
    var now = Date.now || function() {
        return new Date().getTime();
    };

    // # 执行动画的主函数
    function anim( start, end, longTime, stepCallback, completeCallback ) {

        start = parseFloat( start || 0 ), end = parseFloat( end || 0 ), longTime = longTime >> 0;

        // 統計1秒幀速:fps
        var startTime, timer, fps = 0, tmpFps = 0, canAnim = true;

        startAnim();

        // 开始动画
        function startAnim() {
            // 动画的起始时间
            startTime = now();

            // 动画当前帧的执行时间
            frameNow = now();

            // 統計1秒幀速:fps
            timer = setInterval( function() {
                fps = tmpFps;
                tmpFps = 0;
                // console.log( fps );
            }, 1000 );

            // 主循环
            var animationLoop = function() {
                if ( !canAnim )
                    return;

                tmpFps++;

                // 使用浏览器动画帧处理, FPS基本固定在60
                nextFrame( arguments.callee );

                // 定时器, FPS因执行效率影响
                // setTimeout( arguments.callee, 1000 / 20 );

                var curr = now();

                // 执行动画,并传递上一帧到现在过去的时间, 以及传递fps
                doAnim( curr - frameNow, fps );

                frameNow = curr;
            };

            animationLoop();
        };

        // 动画的每一帧
        function doAnim( frameSpeed, fps ) {
            var nowTime = now();
            var gap = nowTime - startTime;
            var progress = gap / (longTime || 400);
            progress = progress >= 1 ? 1 : progress;
            var pos = swing( progress, gap, 0, 1, longTime );
            var curr = start + ((end - start) * pos);

            // console.log( 'start:' + start + ', end:' + end + ', curr:' + curr
            // + ', progress:' + progress );
            stepCallback && stepCallback.call( this, curr, progress, fps );

            if ( progress >= 1 ) {
                completeCallback && completeCallback.call( this, curr, progress, fps );

                stop();
            }
        };

        // 摆动式，动作：由慢变快，再由快变慢
        function swing( progress, gap, offset, difference, longTime ) {
            return ((-Math.cos( progress * Math.PI ) / 2) + 0.5) * difference + offset;
        }

        // 线性式，动作：匀速
        function linear( progress, gap, offset, difference, longTime ) {
            return difference * progress + offset;
        }

        // 停止, toEnd:true - 直接跳到结束位置并调用完成回调
        function stop( toEnd ) {
            clearInterval( timer );
            canAnim = null;
            toEnd && completeCallback && completeCallback.call( this, end, 1, fps );
            start = end = longTime = stepCallback = completeCallback = null;
        }

        // 返回一个函数, 可以使其停止动画
        return stop;
    };

    // 暴露接口
    window.anim = anim;
})( window );
