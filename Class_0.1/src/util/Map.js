Package( 'Fan.util' );

/**
 * @class Map 集合类
 * 
 * @author FuFan
 * 
 * @version 2.0
 * 
 * <pre>
 * 示例 :
 * var map = new Map();
 * map.put( key, value );
 * </pre>
 * 
 * @constructor Map()
 * 
 * @constructor Map(Map map)
 * 
 * @constructor Map(Entry entry), Entry:{key, value}
 * 
 * @constructor Map(Array entrys), entrys:[{key1, value1}, {key2, value2}]
 * 
 */
Class( 'Fan.util.Map', function() {

    /**
     * @privateProperty entrys 集合中保存的所有条目
     */
    var _es = {};

    /**
     * @privateProperty length 获取集合当前存放的条目个数
     */
    var _len = 0;

    /**
     * @method Map(obj) 构造方法，参数可选
     */
    this.Map = function( o ) {
        Super();
        if ( o ) {
            if ( Fan.isArray( o ) ) {
                // o == Entry[]
                var e = null;
                for ( var i = 0, l = o.length; i < l; ++i ) {
                    e = o[i];
                    if ( e && null != e.key && undefined !== e.value ) {
                        this.put( e.key, e.value );
                    }
                }
                e = null;
            } else if ( o instanceof Fan.util.Map && o.size() > 0 ) {
                // o == Map的实例
                o.each( function( k ) {
                    this.put( k, o.get( k ) );
                }, this );
            } else if ( null != o.key && undefined !== o.value ) {
                // o == entry
                this.put( o.key, o.value );
            }
        }
    };

    /**
     * @method put(key, value) 向集合中增加一项，并返回旧的值
     * @return oldValue
     */
    this.put = function( k, v ) {
        var r = this.get( k );
        if ( this.contains( k ) ) {
            _es[k].value = v;
        } else {
            _es[k] = {
                key : k,
                value : v,
                toString : function() {
                    return '{' + this.key + ':' + this.value + '}';
                }
            };
            _len++;
        }
        return r;
    };
    
    /**
     * @method set(key, value) 兼容set方法,作用同put一致
     * @return oldValue
     */
    this.set = function( key, value ) {
        return this.put( key, value );
    };

    /**
     * @method get(key) 返回key对应的值
     */
    this.get = function( k ) {
        return _es[k] ? _es[k].value : null;
    };

    /**
     * @method getKeySet() 返回一个数组，包含集合所有键
     */
    this.getKeySet = function() {
        var ks = [];
        this.each( function( k ) {
            ks.push( this.key );
        } );
        return ks;
    };

    /**
     * @method remove(key) 从集合中移除指定key对应的条目，并返回被移除的值
     * @return oldValue
     */
    this.remove = function( k ) {
        var r = null;
        if ( this.contains( k ) ) {
            r = _es[k].value;
            if ( delete _es[k] ) {
                _len--;
            }
        }
        return r;
    };

    /**
     * @method clear() 清空集合
     */
    this.clear = function( deleteAll ) {
        if ( deleteAll )
        for (var k in _es )
            delete _es[ k ];
        _es = {};
        _len = 0;
    };

    /**
     * @method contains(key) 校验某个键是否已经存在于集合中
     */
    this.contains = function( k ) {
        return (k in _es);
    };
    
    /**
     * @method has(key) 校验某个键是否已经存在于集合中
     */
    this.has = function( k ) {
        return this.contains( k );
    };

    /**
     * @method size() 获取集合当前存放的条目个数
     */
    this.size = function() {
        return _len;
    };

    /**
     * @method each(fn, scope) 遍历当前集合中所有项，并逐一触发fn函数。fn:遍历过程中，fn将接收到一个正在遍历的key。
     *         scope: fn中this的作用域
     */
    this.each = function( fn, s ) {
        var r = undefined;
        for ( var k in _es ) {
            r = fn.call( s || _es[ k ], k, _es, _es[ k ].value );
            if ( r !== undefined ) {
                return r;
            }
        }
        return r;
    };

//    /**
//     * @method toString() 返回将Map集合序列化成key:value形式的字符串
//     */
//    this.toString = function() {
//        var r = [];
//        this.each( function( k ) {
//            r.push( this.key + ':' + this.value );
//        } );
//        r = r.join( ',' );
//        if ( r.trim() === '' ) {
//            r = '{}';
//        } else {
//            r = '{' + r + '}';
//        }
//        return r;
//    };

    /**
     * @method toJSONString() 返回当前集合序列化成json格式的字符串:{"key1":"value1",
     *         "key2":"value2"}
     */
    this.toJSONString = function() {
        var r = [];
        this.each( function( k ) {
            r.push( '"' + this.key + '":"' + this.value + '"' );
        } );
        r = r.join( ',' );
        if ( r.trim() === '' ) {
            r = '{}';
        } else {
            r = '{' + r + '}';
        }
        return r;
    };
    
    /**
     * 销毁
     */
    this.destroy = function() {
        _es = _len = null;
        Super();
    };
} );