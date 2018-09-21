/**
 * @fileOverview 容器视图控制器
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.ui' );

Import( 'Fan.ui.ViewController' );

/**
 * @author Fan
 * @class Fan.ui.ContaineViewController
 * @constructor ContaineViewController
 * @extends Fan.ui.ViewController
 * @description 该管视图控制器允许包含多个子视图控制器器
 * @see The <a href="#">Fan</a >.
 * @example new ContaineViewController( config );
 * @since version 0.1
 * @param {Object} config 构造配置参数
 * config:
 * {
 * // 默认就加载好的子视图控制器
 * subViewControllers : { controllerClass, controllerConfig }
 * 
 * on - 事件监听
 * id - 控制器的id
 * name - 控制器的名称
 * viewClass - 控制器自身的view
 * viewConfig - 控制器构造自身view时的传入参数, 详细见viewClass参数类对应的构造配置参数
 * 
 * ### 支持的事件 ###
 * 
 * 自身事件
 * addViewController
 * removeViewController
 * 
 * 与父视图控制器相关事件
 * activing
 * active
 * unactiving
 * unactive
 * addToParentViewController
 * removeOfParentViewController
 * }
 */
Class( 'Fan.ui.ContaineViewController', Fan.ui.ViewController, function() {
    var
    _config,
    _viewControllers;
    
    /**
     * @constructor 
     */
    this.ContaineViewController = function( config ) {
        _config = config || {};
        _viewControllers = [];
        
        Super( {
            viewClass : _config.viewClass,
            viewConfig : _config.viewConfig,
            id : _config.id,
            name : _config.name,
            on : _config.on
        } );
        
        // 当前controller已经初始化完成, 则开始组装子controller
        if ( Fan.isArray( config.subViewControllers ) && config.subViewControllers.length > 0 ) {
            var me = this;
            Class.each( config.subViewControllers, function( i ) {
                if ( this instanceof Fan.ui.ViewController ) {
                    me.addViewController( this );
                } else {
                    var vcClass = Class.forName( this.controllerClass || Fan.ui.ViewController );
                    var subVC = new vcClass( this.controllerConfig || {} );
                    me.addViewController( subVC );
                }
            } );
            me = null;
        }
    };

//    /**
//     * @description 初始化, 构造对象时会被调用
//     */
//    this.init = function() {    
//        
//    };
//    
//    /**
//     * @description 初始化用户交互事件, 构造对象时会被调用
//     */
//    this.initEvent = function() {    
//        
//    };
    
    /**
     * @description 增加一个视图控制器
     * @param {ViewController}
     */
    this.addViewController = function( viewController ) {
        if ( viewController instanceof Fan.ui.ViewController ) {
            _viewControllers.push( viewController );
            viewController.parentController = this;
            viewController.fireEvent( 'addToParentViewController', [ this ] );
            this.fireEvent( 'addViewController', [ viewController ] );
        }
    };
    
    /**
     * @description 获取当前容器中的控制器数量
     * @returns {int}
     */
    this.getViewControllerCount = function() {
        return _viewControllers.length;
    };
    
    /**
     * @description 获取视图控制器数组集合
     * @returns {Array}
     */
    this.getViewControllers = function() {
        return _viewControllers.concat();
    };
    
    /**
     * @description 获取视图控制器
     * @returns {ViewController}
     */
    this.getViewController = function( viewControllerId ) {
        var vc;
        viewControllerId += '';
        Class.each( _viewControllers, function() {
            if ( viewControllerId === (this.id + '') ) {
                vc = this;
                return false;
            }
        } );
        return vc || null;
    };
    
    /**
     * @description 查找指定名字的子view列表
     * @param {String} viewControllerName 控制器名称
     * @param {int} findQuantity 查多少个, 缺省-1, 表示查所有
     * @returns {Array} ViewController数组
     */
    this.finds = function( viewControllerName, findQuantity ) {
        if ( !_viewControllers.length )
            return [];
        
        var refSubVCs = [], refFindCount = {};
        refFindCount.findCount = 0;
        findQuantity = Fan.isNum( findQuantity ) ? findQuantity > -1 ? findQuantity : -1 : -1;
        
        if ( 0 < findQuantity || findQuantity == -1 ) {
            Fan.ui.ContaineViewController.finds( this, viewControllerName, refSubVCs, findQuantity, refFindCount );
        }
        
        return refSubVCs;
    };
    
    /**
     * @description 查找第一个出现的指定名字的子控制器
     * @param {String} viewControllerName 控制器名称
     * @returns {ViewController}
     */
    this.find = function( viewControllerName ) {
        if ( !_viewControllers.length )
            return null;
        return this.finds( viewControllerName, 1 )[ 0 ];
    };
    
    /**
     * @description 从容器中删除指定的视图控制器
     * @param {String|ViewController} viewControllerOrId 控制器或id
     * @returns {ViewController} 返回被移除的控制器
     */
    this.removeViewController = function( viewControllerOrId, doDestroy ) {
        var oldVC, isObj;
        isObj = viewControllerOrId instanceof Fan.ui.ViewController;
        if ( !isObj )
            viewControllerId += '';
        
        Class.each( _viewControllers, function( i ) {
            if ( (isObj && (viewControllerOrId === this)) || (!isObj && viewControllerId === (this.id + '')) ) {
                oldVC = _viewControllers.splice( i, 1 )[ 0 ];
                if ( oldVC ) {
                    oldVC.parentController = null;
                    oldVC.fireEvent( 'removeOfParentViewController' );
                    This.fireEvent( 'removeViewController', [ oldVC ] );
                    doDestroy && oldVC.destroy( true );
                }
                return false;
            }
        } );
        return oldVC || null;
    };
    
    /**
     * @description 从容器中删除所有视图控制器, 删除顺序与添加顺序相反
     * @param {boolean} doDestroy 是否销毁被移除的控制器
     */
    this.removeAllViewController = function( doDestroy ) {
        var vc;
        while ( vc = _viewControllers.splice( _viewControllers.length - 1, 1 )[ 0 ] ) {
            vc.parentController = null;
            vc.fireEvent( 'removeOfParentViewController' );
            This.fireEvent( 'removeViewController', [ vc ] );
            doDestroy && vc.destroy( true );
        }
        _viewControllers = [];
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
     * @param {boolean}
     */
    this.destroy = function( doDestroy ) {
        this.removeAllViewController( doDestroy );
        
        _config = _viewControllers = null;
        
        Super( doDestroy );
    };
} );

/**
 * 静态方法
 */
(function( Controller, undefined ) {
    /**
     * 根据指定名字和数量,查找子视图控制器集合
     */
    Controller.finds = function( viewController, subViewControllerName, refSubVCs, findQuantity, refFindCount ) {
        refFindCount = refFindCount || {};
        refFindCount.findCount = refFindCount.findCount || 0;
        
        // 此判断存在多线程问题, 单线程无事
        if ( refFindCount.findCount >= findQuantity && findQuantity != -1 || !(viewController instanceof Controller) ) {
            return false;
        }
        
        var vcList = viewController.getViewControllers();
        subViewControllerName += '';
        Class.each( vcList, function() {
            
            var subVC = this;
            if ( subViewControllerName === (subVC.name + '') ) {
                refFindCount.findCount += 1;
                refSubVCs.push( subVC );
                // 此判断存在多线程问题, 单线程无事
                if ( refFindCount.findCount >= findQuantity && findQuantity != -1) {
                    return false;
                }
            }
            
            if ( !(subVC instanceof Controller) ) {
                // return undefined ==> continue
                return undefined;
            }
            Controller.finds( subVC, subViewControllerName, refSubVCs, findQuantity, refFindCount );
         
            // 此判断存在多线程问题, 单线程无事
            if ( refFindCount.findCount >= findQuantity && findQuantity != -1 ) {
                return false;
            }
        } );
        vcList = viewController = subViewControllerName = refSubVCs = findQuantity = refFindCount = null;
    };
})( Fan.ui.ContaineViewController );
