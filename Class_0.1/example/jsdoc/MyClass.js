// jsDoc注释示例
/**
 * @namespace Fan
 */
Package( 'Fan' );

Class( 'Fan.MyClass', function() {
    /**
     * @class 这是类的的说明
     * @name Fan.MyClass
     * @extends Object
     * @memberof Fan.MyClass
     * @constructs MyClass
     * @description 构造方法说明
     * @param {String} arg1 - 参数1
     * @param {Array}  arg2 - 参数2
     * @param {Object} arg3 - 参数3
     * @returns {MyClass}
     */
    this.MyClass = function() {
        
    };
    
    /**
     * 实例方法1
     * @public
     * @memberof Fan.MyClass#
     * @param {String} arg1 - 参数1
     * @param {String} arg2 - 参数2
     * @returns {String}
     */
    this.method1 = function( arg1, arg2 ) {
        
    };
    
    /**
     * 实例方法2
     * @public
     * @memberof Fan.MyClass#
     * @param {String} arg1 - 参数1
     * @param {String} arg2 - 参数2
     * @returns {Object}
     */
    this.method2 = function( arg1, arg2 ) {
        
    };
} );

(function(MyClass) {
    /**
     * 静态常量1
     * @static
     * @name Fan.MyClass.staticValue1
     * @memberof Fan.MyClass
     */
    MyClass.staticValue1 = 123;
    
    /**
     * 静态常量2
     * @static
     * @name Fan.MyClass.staticValue2
     * @memberof Fan.MyClass
     */
    MyClass.staticValue2 = 321;
    
    /**
     * 静态方法1
     * @static
     * @function
     * @name Fan.MyClass.staticMethod1
     * @memberof Fan.MyClass
     * @param {String} arg1 - 参数1
     * @returns {Object}
     */
    MyClass.staticMethod1 = function() {
        
    };
    
    /**
     * 静态方法2
     * @static
     * @function
     * @name Fan.MyClass.staticMethod2
     * @memberof Fan.MyClass
     * @param {String} arg1 - 参数1
     * @param {String} arg2 - 参数2
     * @returns {boolean}
     */
    MyClass.staticMethod2 = function() {
        
    };
    
})(Fan.MyClass);