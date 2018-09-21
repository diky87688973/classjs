/**
 * @namespace Fan.util
 * @author Fan
 * @version 0.1
 */
Package( 'Fan.util' );

Import( 'Fan.util.Base64' );

/*
 * 示例:
 * <code>
 *    var data = "a89f5b9877c1996b96e4834e1779f852-123456-987654321";
 *    var offset = 12;
 *    var b = new Fan.util.Base64x( offset );
 *    var result = b.encode( data );
 *    logger.warn( '原文:\t' + data );
 *    logger.warn( '偏移:\t' + offset );
 *    logger.warn( '密文:\t' + result );
 * </code>
 */
Class( 'Fan.util.Base64x', Fan.util.Base64, function() {
    
    /**
     * @class 扩展 Base64 编码, Base64x 单向加密类, 无解密
     * @name Fan.util.Base64x
     * @extends Fan.util.Base64
     * @memberof Fan.util.Base64x
     * 
     * @description 构造方法
     * @constructs Base64x
     * @param offset -
     *            可选,字符偏移位置 0-63之间.默认:0
     * @param encodingTables -
     *            编码集, 64个不同字符组成, 不包含"="号.
     * @returns {Fan.util.Base64x}
     */
    this.Base64x = function( offset ) {
        Super( {
            encodingTables : Fan.util.Base64x._df(),
            offset : offset
        } );
    };

    /**
     * coverts a byte array to a string populated with base64 digits. It steps
     * through the byte array calling a helper methode for each block of three
     * input bytes
     * @public
     * @override
     * @memberof Fan.util.Base64x#
     * @param {String} str
     *            需要编码的字符串
     * @param {String} charset
     *            编码格式, 缺省:utf-8
     * @returns {String} 返回一个经过base64编码后的字符串
     */
    this.encode = function( str, charset ) {
        return Super( str, charset );
    };

    /**
     * 不提供解码
     * @public
     * @override
     * @memberof Fan.util.Base64x#
     * @throws {Error} 不支持解码, 抛出异常 
     */
    this.decode = function( code, charset ) {
        throw new Error( '该字符串无法解码！' );
    };
    
} );

// 静态成员
( function( Base64x ) {
    // 默认编码对象
    var base64x;
    // 默认编码对象对应的偏移量
    var base64offset;
    
    /**
     * 默认Base64x编码
     * @static
     * @function
     * @name Fan.util.Base64x.encode
     * @memberof Fan.util.Base64x
     * @param {String} data - 需要编码的字符串
     * @returns {String} 返回编码好的字符串
     */
    Base64x.encode = function( data, offset ) {
        data = data || '',
        offset = offset >> 0;
        
        // 未构造Base64对象或者偏移量改变了,则重新构造一个默认的Base64
        if( !base64x || base64offset != offset ) {
            base64x = new Base64x( offset );
            base64offset = offset;
        }
        
        var encode = base64x.encode( data );
        
//        logger.warn( '原文:' + data );
//        logger.warn( '偏移:' + offset );
//        logger.warn( '密文:' + encode );
        
        return encode;
    };
    
    Base64x._df = function() {
        var s = 12 + 36;
        var df = [];
        for ( var i = 123; i < 133; i++ ) {
            df.push( String.fromCharCode( s++ ) );
        }
        df.push( '!' );
        s += 7;
        for ( var i = 456; i < 482; i++ ) {
            df.push( String.fromCharCode( s++ ) );
        }
        df.push( '@' );
        s += 6;
        for ( var i = 789; i < 815; i++ ) {
            df.push( String.fromCharCode( s++ ) );
        }
        df = df.join( '' );
        return df;
    };
} )( Fan.util.Base64x );
