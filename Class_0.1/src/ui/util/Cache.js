Package( 'Fan.ui.util' );

Import( 'Fan.util.Map' );

/**
 * 简易缓存的实现类
 * 
 * @author Fan
 * 
 * @data 2012/8/24
 */
Class( 'Fan.ui.util.Cache', function() {
    // store.js 的句柄, 避免直接使用store, 存在访问不到store对象的bug
    var _store;
    
    /**
     * 缓存的类型, 同一类型的对象, 缓存一起
     * @private
     */
    var _type;
    
    /**
     * 唯一标示, 区别于同一类型的其他缓存对象
     * @private
     */
    var _key;
    
    /**
     * 构造方法
     * 
     * @param type - 缓存类型
     */
    this.StoreCache = function( type, key ) {
        Super();
        
        key  = key + '';
        type = type + '' ;
        
        if ( Fan.isEmpty( type ) || Fan.isEmpty( key ) ) {
            throw new Error( '缓存对象必须提供 type 和 key.' );
        }
        
        _type = type;
        _key = key;
        
        // IE7以下,store不兼容,换成Map缓存
        // _store = Class.ie < 7 ? new Fan.util.Map() : window.store;
        
        // 使用内存缓存
        _store = new Fan.util.Map();
        
        // 默认存储结构
        _store.set( type, {} );
    };
    
    /**
     * 获取缓存类型
     */
    this.getType = function() {
        return _type;
    };
    
    /**
     * 获取唯一标示
     */
    this.getKey = function() {
        return _key;
    };
    
    /**
     * 增加
     */
    this.add = function( item ) {
        var store = _store.get( this.getType() );
        var old = store[ item[ this.getKey() ] + '' ];
        store[ item[ this.getKey() ] + '' ] = item;
        _store.set( this.getType(), store );
        return old;
    };
    
    /**
     * 获取
     */
    this.get = function( key ) {
        key = key + '' ;
        var store = _store.get( this.getType() );
        return store[ key ];
    };
    
    /**
     * 获取所有
     */
    this.getAll = function() {
        var store = _store.get( this.getType() );
        return store;
    };
    
    /**
     * 设置
     */
    this.set = function( key, item ) {
        key = key + '' ;
        var store = _store.get( this.getType() );
        var old = store[ key ];
        store[ key ] = item;
        _store.set( this.getType(), store );
        return old;
    };
    
    /**
     * 删除一个
     */
    this.remove = function( key ) {
        key = key + '' ;
        var store = _store.get( this.getType() );
        if ( key in store ) {
            return delete store[ key ];
            _store.set( this.getType(), store );
        };
    };
    
    /**
     * 更新
     */
    this.update = function( key, item ) {
        key = key + '' ;
        var store = _store.get( this.getType() );
        var old = store[ key ];
        store[ key ] = item;
        _store.set( this.getType(), store );
        return old;
    };
    
    /**
     * 清除
     */
    this.clear = function() {
        _store.remove( this.getType() );
        store.set( this.getType(), {} );
    };
    
    /**
     * 检测缓存中是否存在
     */
    this.isExist = function( key ) {
        key = key + '' ;
        var store = _store.get( this.getType() );
        return key != null && (key in store);
    };
} );
