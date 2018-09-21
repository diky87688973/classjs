Package( 'Fan.util.anim' );

/**
 * 动画对象类 自定义动画过程，给定起点和终点，详细看参数配置
 * 
 * 示例： <code>
 * var anim = new Fan.util.anim.Anim({
 *           fps : 75,               // 1秒钟的播放帧速，默认75
 *           longTime : 400,        // 单位时长，默认400毫秒
 *           start : 0,              // 起点
 *           end : 0,                // 终点
 *           
 *           // 每1帧的回调函数
 *           step : function(now, progress){
 *              now > 100 && this.stop();
 *           },
 *           
 *           // 完成所有动画后的回调函数
 *           callback : function(now, progress){
 *              now > 100 && this.stop();
 *           }
 *         });
 *         
 * 主要方法：
 * anim.start();            // 开始执行动画
 * anim.pause();            // 暂停正在执行的动画
 * anim.stop(isDestroy);    // 停止正在执行的动画，并可指定是否销毁当前动画对象，默认false
 * anim.setFPS(fps);        // 设置每秒的动画帧的数量，帧速，默认75
 * anim.setLongTime(longTime);  // 设置动画时长，默认400毫秒
 * anim.destroy();          // 销毁当前动画对象
 * </code>
 * 
 */
Class( 'Fan.util.anim.Anim', function () {

    var

    // 当前实例的引用
    me,

    // 每秒播放帧速
    fps,

    // 起点
    start,

    // 终点
    end,

    // 动作的开始时间
    startTime,

    // 当前时间
    nowTime,

    // 计时器
    timer,

    // 整个动画的执行时长，默认400毫秒
    longTime,
    
    // 动画模式
    mode,

    // 每1帧的回调函数
    step,

    // 完全执行完毕后的回调
    callback,

    // 是否已经停止了动作
    isStop = true,
    
    // 执行完动画后自动销毁，默认true
    autoDestroy,
    
    // 便于访问 ==> Fan.util.anim.Anim.getPos
    getPos;

    // 构造方法，接受一个配置参数对象
    this.Anim = function ( config ) {
        Super();

        // 默认值配置
        var cfg = Class.apply( {
            // 1秒钟的播放帧速，默认75
            fps : 75,
            // 动画的整个时长
            longTime : 400,
            // 起点
            start : 0,
            // 终点
            end : 0,
            // 动画模式
            mode : 'swing', // 默认摆动式，两头速度慢，中间快。
            // 每1帧的回调函数
            step : null,
            // 完全执行完毕后的回调
            callback : null,
            // 执行完动画后自动销毁，默认true
            autoDestroy : true
        }, config );

        fps = cfg.fps,
        start = cfg.start,
        end = cfg.end,
        longTime = cfg.longTime > 0 ? cfg.longTime : 1,
        mode = cfg.mode,
        step = cfg.step,
        callback = cfg.callback,
        autoDestroy = cfg.autoDestroy;
        
        // 便于访问
//        getPos = Fan.util.anim.Anim.getPos;
        getPos = Fan.util.anim.Anim.getHandler( mode );

        cfg = null;
        timer = null;
    };

    // 执行动作
    var doAction = function () {
        nowTime = new Date().getTime();
        var gap = nowTime - startTime;
        var progress = gap / longTime;
        progress = progress >= 1 ? 1 : progress;
        var pos = getPos( progress, gap, 0, 1, longTime, mode );
        var now = start + ((end - start) * pos);

        // console.log( 'start:' + start + ', end:' + end + ', now:' + now + ', progress:' + progress );
        Fan.call( step, me, [ now, progress ] );

        if ( progress >= 1 ) {
            Fan.call( callback, me, [ now, progress ] );

            // 判断是否销毁，销毁后没有stop方法
            Fan.call( me.stop, me );
        }
    };

    // 开始动画
    this.start = function () {
        me = this;
        isStop = false;
        nowTime = startTime = new Date().getTime();
        timer = setInterval( doAction, Math.round( 1000 / fps ) );
        doAction();
    };

    // 结束动画
    this.stop = function () {
        if ( autoDestroy )
            this.destroy();
        else
            this.pause();
    };

    // 暂停动画
    this.pause = function () {
        isStop = true;
        clearInterval( timer );
        timer = null;
    };

    // 设置每秒动画的帧数
    this.setFPS = function ( _fps ) {
        fps = _fps || 75;
    };

    // 获取每秒动画的帧数
    this.getFPS = function () {
        return fps;
    };

    // 设置动画的时长
    this.setLongTime = function ( _longTime ) {
        longTime = _longTime || 400;
    };

    // 获取动画的时长
    this.getLongTime = function () {
        return longTime;
    };

    // 设置动画的起点
    this.setStart = function ( _start ) {
        start = _start || 0;
    };

    // 设置动画的终点
    this.setEnd = function ( _end ) {
        end = _end || 0;
    };
    
    // 设置动画的每一帧回调函数
    this.setStep = function ( _step ) {
        step = _step;
    };

    // 设置动画完成后的回调
    this.setCallback = function ( _callback ) {
        callback = _callback;
    };

    // 动画是否停止
    this.isStop = function () {
        return isStop;
    };

    /**
     * 销毁
     */
    this.destroy = function () {
        this.pause();
        fps = start = end = startTime = nowTime = timer = longTime = mode = null;
        step = getPos = callback = isStop = autoDestroy = doAction = null;
//        Fan.removeObject( this );
        Super();
    };
} );

// 静态成员
(function( Anim ) {
    
    /**
     * 动画模式
     * 
     * 每种模式的进出格式一致，都是根据时间比例，返回路程比例，比例范围0-1
     * 
     * @param progress -
     *            时间进度
     * @param gap -
     *            开始到现在的时间差
     * @param offset -
     *            偏移值
     * @param difference -
     *            差异值，通常为1
     * @returns {Number} 区间轨迹: [0-差异值]
     */
    var animMode = Anim.animMode = {
         // 摆动式，动作：由慢变快，再由快变慢
         swing : function ( progress, gap, offset, difference, longTime ) {
             return ((-Math.cos( progress * Math.PI ) / 2) + 0.5) * difference + offset;
         },
         
         // 线性式，动作：匀速
         linear : function( progress, gap, offset, difference, longTime ) {
             return difference * progress + offset;
         }
    };
    
    /**
     * 根据时间比例，返回路程比例
     * 
     * @param progress -
     *            时间进度
     * @param gap -
     *            开始到现在的时间差
     * @param firstNum -
     *            偏移值
     * @param difference -
     *            差异值，通常为1
     * @param mode -
     *            动画模式
     * @returns {Number} 区间轨迹: [0-差异值]
     */
    var getPos = Anim.getPos = function ( progress, gap, firstNum, difference, longTime, mode ) {
        var handler = getHandler( mode );
        return handler( progress, gap, firstNum, difference, longTime );
    };
    
    /**
     * 通过mode返回动作计算的函数
     */
    var getHandler = Anim.getHandler = function ( mode ) {
        return animMode[ mode ] || animMode[ 'swing' ];
    };
    
    /**
     * 通过进度取得当前值
     * 
     * @param progress -
     *            进度值
     * @param config -
     *            其他配置值, 用于构造Anim对象的配置参数
     * @param resetConfig -
     *            是否重置配置参数, 默认false
     * @returns {Number} 返回当前值
     */
    Anim.getNowValueByProgressAndConfig = function ( progress, config, resetConfig ) {
        // 默认值配置
        if ( resetConfig )
            config = Class.apply( {
                fps : 75,
                longTime : 400,
                start : 0,
                end : 0,
                mode : 'swing',
                step : null,
                callback : null
            }, config );
        else 
            config = config || {};
        progress = progress >= 1 ? 1 : progress;
        progress = progress <= 0 ? 0 : progress;
        var gap = progress * config.longTime;
        var pos = getPos( progress, gap, 0, 1, config.longTime, config.mode );
        var now = config.start + ((config.end - config.start) * pos);
        return now;
    };
})( Fan.util.anim.Anim );