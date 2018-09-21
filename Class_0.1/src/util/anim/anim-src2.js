/**
 * 简单缓动效果封装(存在bug)
 * 
 * anim( startNumber, endNumber, longTime, function( currentNumber, progress,
 * fps ) { // step callback }, function() { // complete callback })
 */
function anim( start, end, longTime, stepCallback, complateCallback ) {
  var
  fps = 60,
  second = 1000,
  stepGap = second / fps,
  distance = (end - start) / longTime, // 单位时间变换距离,此变量可以是动态,在实现非线性动画时,可以通过其他算法得到瞬时距离
  
  last = Date.now(),
  step = start,
  timer,
  
  ctl = {
    start : function() { last = Date.now();timer = setTimeout( oneFream, stepGap ); },
    pause : function() { clearTimeout( timer ); },
    stop : function() { this.pause(); last = Date.now(), step = start; }
  };
  
  // 一帧
  function oneFream() {
    
    // 计算与上一帧的时间间隔
    var curr = Date.now();
    var speed = curr - last;
    last = curr;
    
    // 计算间隔时间内,变化的值
    step += distance * speed;
    
    // 判定结束
    var isEnd = step >= end;
    
    // 限制边界
    step = isEnd ? end : step;
    
    // 调用每一次变化的回调
    stepCallback && stepCallback.call( ctl, step, speed );
    
    // 动画完成, 则调用完成回调
    if ( isEnd ) complateCallback && complateCallback.call( ctl, step, speed );
    
    // 若未完成, 继续创建下一帧的回调
    // else timer = setTimeout( arguments.callee, stepGap );
    
    // 如果要处理99变化到100,则在最后一次回调中,传入间隔时间减去不必要的时间
    else {
      var tmp = step + distance * stepGap;
      
      // 正常帧速情况下,计算超出部分的耗时, 不足1毫秒,算1毫秒
      var useTime = tmp > end ? Math.ceil( (tmp - end) / distance ) : 0;
      
      useTime > 0 && console.log( '最后一步省去耗时:' + useTime );
      
      timer = setTimeout( arguments.callee, stepGap - useTime );
    }
        
  }
  
  // 启动
  timer = setTimeout( oneFream, stepGap );
  
  return ctl;
}

var ctl = anim( -100, 100, 1000, function( step, speed ){ console.log( '与上一帧间隔:' + speed + '\t当前点:' + step ); }, function( step, speed ) { console.log( 'over' ) } );
//setTimeout(function(){ctl.pause();}, 500);
//setTimeout(function(){ctl.start();}, 3000);
