/**
 * @namespace Fan.util
 * @author Fan
 * @version 0.1
 */

Package( 'Fan.util' );

Import( 'Fan.util.String' );

/*
 * 示例:
 * <code>
 *      var data = "a89f5b9877c1996b96e4834e1779f852-123456-987654321";
 *      var offset = 0;
 *      var base64 = new Fan.util.Base64( { offset : offset, encodingTables : encodingTables } );
 *      var result = base64.encode( data );
 *      var result2 = base64.decode( result );
 *      
 *      logger.warn( '原文:\t' + data );
 *      logger.warn( '偏移:\t' + offset );
 *      logger.warn( '密文:\t' + result );
 *      logger.warn( '解密:\t' + result2 );
 * </code>
 */
Class( 'Fan.util.Base64', function() {

    // 默认组成base64的字符集合, 构造参数中可以将此集合替换成其他字符集合,不能含有"="字符,该字符为补位字符
    var DEFAULT_ENCODING_TABLES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var encodingTables = '';

    /**
     * @class Base64编码辅助类
     * @name Fan.util.Base64
     * @extends Class.Object
     * @memberof Fan.util.Base64
     * 
     * @description 构造方法
     * @constructs Base64
     * @param offset -
     *            可选,字符偏移位置 0-63之间.默认:0
     * @param encodingTables -
     *            编码集, 64个不同字符组成, 不包含"="号.
     * @returns {Fan.util.Base64}
     */
    this.Base64 = function( config ) {
        Super();
        config = config || {};
        Fan.isString( config.encodingTables ) && (DEFAULT_ENCODING_TABLES = config.encodingTables);
        var offset = config.offset >> 0;

        // 偏移值求余
        var move = offset % DEFAULT_ENCODING_TABLES.length;
        // 偏移后的编码集
        encodingTables = DEFAULT_ENCODING_TABLES.substring( move ) + DEFAULT_ENCODING_TABLES.substring( 0, move );
    };

    /**
     * 将一个字符串转换成base64编码格式
     * @public
     * @memberof Fan.util.Base64#
     * @param {String} str
     *            需要编码的字符串
     * @param {String} charset
     *            编码格式, 缺省:utf-8
     * @returns {String} 返回一个经过base64编码后的字符串
     */
    this.encode = function( str, charset ) {
        var raw = Fan.util.String.toBytes( str, charset || 'utf-8' );
        var encoded = [];
        for ( var i = 0; i < raw.length; i += 3 ) {
            encoded.push( encodeBlock( raw, i ).join( '' ) );
        }
        return encoded.join( '' );
    };

    /**
     * 将base64编码的字符串转换成原始字符串
     * @public
     * @memberof Fan.util.Base64#
     * @param {Stirng} base64
     *            经过base64编码的字符串
     * @param {String} charset
     *            编码格式, 缺省:utf-8
     * @return {String} 返回base64的原文
     */
    this.decode = function( base64, charset ) {
        // how many padding digits?
        var pad = 0;
        for ( var i = base64.length - 1; base64.charAt( i ) == '='; i-- )
            pad++;

        // we know know the lenght of the target byte array.
        var length = base64.length * 6 / 8 - pad;

        var raw = new Array( length );
        var rawIndex = 0;

        // loop through the base64 value. A correctly formed
        // base64 string always has a multiple of 4 characters.
        for ( var i = 0; i < base64.length; i += 4 ) {
            var block = (getValue( base64.charAt( i ) ) << 18) + (getValue( base64.charAt( i + 1 ) ) << 12) + (getValue( base64.charAt( i + 2 ) ) << 6) + (getValue( base64.charAt( i + 3 ) ));

            // based on the block, the byte array is filled with the
            // appropriate 8 bit values
            for ( var j = 0; j < 3 && rawIndex + j < raw.length; j++ ) {
                raw[ rawIndex + j ] = (block >> (8 * (2 - j))) & 0xff;
            }
            rawIndex += 3;
        }

        return Fan.util.String.bytesToString( raw, charset || 'utf-8' );
    };

    /**
     * @private
     * 
     * @description creates 4 base64 digits from three bytes of input data. we use an integer, block, to hold the 24 bits of input data.
     * 
     * @return An array of 4 characters
     */
    var encodeBlock = function( raw, offset ) {
        var block = 0;

        // how much space left in input byte array
        var slack = raw.length - offset - 1;

        // if there are fewer than 3 bytes in this block, calculate end
        var end = (slack >= 2) ? 2 : slack;

        // convert signed quantities into unsigned
        for ( var i = 0; i <= end; i++ ) {
            var b = raw[ offset + i ];
            var neuter = (b < 0) ? b + 256 : b;
            block += neuter << (8 * (2 - i));
        }

        // extract the base64 digets, which are six bit quantities.
        var base64 = [];
        for ( var i = 0; i < 4; i++ ) {
            var sixbit = (block >>> (6 * (3 - i))) & 0x3f;
            base64[ i ] = getChar( sixbit );
        }

        // pad return block if needed
        if ( slack < 1 )
            base64[ 2 ] = '=';
        if ( slack < 2 )
            base64[ 3 ] = '=';

        // 始终返回一个4个字符长度的数组
        return base64;
    };

    // encapsulates the translation from six bit quantity to base64 digit
    var getChar = function( sixBit ) {
        return encodingTables.charAt( sixBit );
    };

    // translates from base64 digits to their 6 bit value
    var getValue = function( c ) {
        return '=' == c ? 0 : encodingTables.indexOf( c );
    };

} );

// 静态成员
( function( Base64 ) {
    var base64;

    /**
     * 默认Base64编码
     * @static
     * @function
     * @name Fan.util.Base64.encode
     * @memberof Fan.util.Base64
     * @param {String} data - 需要编码的字符串
     * @returns {String} 返回编码好的字符串
     */
    Base64.encode = function( data ) {
        data = data || '';

        !base64 && (base64 = new Base64());

        var result = base64.encode( data );
        return result;
    };

    /**
     * 默认Base64解码
     * @static
     * @function
     * @name Fan.util.Base64.decode
     * @memberof Fan.util.Base64
     * @param {String} data - 需要解码的字符串
     * @returns {String} 返回解码好的字符串
     */
    Base64.decode = function( data ) {
        data = data || '';

        !base64 && (base64 = new Base64());

        var result = base64.decode( data );
        return result;
    };

    /**
     * Base64测试
     * @static
     * @private
     * @function
     * @name main
     * @memberof Fan.util.Base64
     */
    Base64.main = function( args ) {
        logger.setLevel( 0 );
        var data = "按时打算打asdsadasdabcd是发了狂红绿封adlaasdasd敖德萨十的sd的撒的撒";
        var offset = 0;
        var base64 = new Base64( {
            offset : offset
        } );
        var result = base64.encode( data );
        var result2 = base64.decode( result );

        logger.warn( '原文:\t' + data );
        logger.warn( '偏移:\t' + offset );
        logger.warn( '密文:\t' + result );
        logger.warn( '解密:\t' + result2 );
    };
} )( Fan.util.Base64 );
