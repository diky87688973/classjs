/*!
 * Base64.js 代码由 Fan.util.Base64 中抽取
 * 
 * 示例:
 * <code>
 *      var data = "a89f5b9877c1996b96e4834e1779f852-123456-987654321";
 *      var offset = 0;
 *      var base64 = new Base64( { offset : offset, encodingTables : encodingTables } );
 *      var result = base64.encode( data );
 *      var result2 = base64.decode( result );
 *      
 *      logger.warn( '原文:\t' + data );
 *      logger.warn( '偏移:\t' + offset );
 *      logger.warn( '密文:\t' + result );
 *      logger.warn( '解密:\t' + result2 );
 * </code>
 */
function Base64( config ) {

    // 默认组成base64的字符集合, 构造参数中可以将此集合替换成其他字符集合,不能含有"="字符,该字符为补位字符
    var DEFAULT_ENCODING_TABLES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var encodingTables = '';
    
    // 构造
    config = config || {};
    (typeof config.encodingTables == 'string') && (DEFAULT_ENCODING_TABLES = config.encodingTables);
    var offset = config.offset >> 0;

    // 偏移值求余
    var move = offset % DEFAULT_ENCODING_TABLES.length;
    // 偏移后的编码集
    encodingTables = DEFAULT_ENCODING_TABLES.substring( move ) + DEFAULT_ENCODING_TABLES.substring( 0, move );

    
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
        var raw = Base64.String.toBytes( str, charset || 'utf-8' );
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
        var pad = 0;
        for ( var i = base64.length - 1; base64.charAt( i ) == '='; i-- )
            pad++;

        var length = base64.length * 6 / 8 - pad;

        var raw = new Array( length );
        var rawIndex = 0;

        for ( var i = 0; i < base64.length; i += 4 ) {
            var block = (getValue( base64.charAt( i ) ) << 18) + (getValue( base64.charAt( i + 1 ) ) << 12) + (getValue( base64.charAt( i + 2 ) ) << 6) + (getValue( base64.charAt( i + 3 ) ));

            for ( var j = 0; j < 3 && rawIndex + j < raw.length; j++ ) {
                raw[ rawIndex + j ] = (block >> (8 * (2 - j))) & 0xff;
            }
            rawIndex += 3;
        }

        return Base64.String.bytesToString( raw, charset || 'utf-8' );
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
        var slack = raw.length - offset - 1;
        var end = (slack >= 2) ? 2 : slack;

        for ( var i = 0; i <= end; i++ ) {
            var b = raw[ offset + i ];
            var neuter = (b < 0) ? b + 256 : b;
            block += neuter << (8 * (2 - i));
        }

        var base64 = [];
        for ( var i = 0; i < 4; i++ ) {
            var sixbit = (block >>> (6 * (3 - i))) & 0x3f;
            base64[ i ] = getChar( sixbit );
        }

        if ( slack < 1 )
            base64[ 2 ] = '=';
        if ( slack < 2 )
            base64[ 3 ] = '=';

        // 始终返回一个4个字符长度的数组
        return base64;
    };

    var getChar = function( sixBit ) {
        return encodingTables.charAt( sixBit );
    };

    var getValue = function( c ) {
        return '=' == c ? 0 : encodingTables.indexOf( c );
    };
}


// # String
( function( Base64 ) {
    // 编码器
    var encoders = {};
    
    // 解码器
    var decoders = {};
    
    Base64.String = {};
    
    /**
     * 增加一个编码器
     * @param charsetName - 编码类型
     * @param encoderFn - 进行编码的处理函数, 该函数接受一个需要被编码的字符原串
     * @returns {String} 返回编码后的字符串
     */
    Base64.String.addEncoder = function ( charsetName, encoderFn ) {
        encoders[ charsetName.toLowerCase() ] = encoderFn;
    };
    
    /**
     * 增加一个解码器
     * @param charsetName - 解码类型
     * @param decoderFn - 进行解码的处理函数, 该函数接受一个需已被编码的字符串
     * @returns {String} 返回解码后的字符串
     */
    Base64.String.addDecoder = function ( charsetName, decoderFn ) {
        decoders[ charsetName.toLowerCase() ] = decoderFn;
    };
    
    // 添加默认的编码器
    Base64.String.addEncoder( 'utf-8', function( str ) {
        str = str.replace( /\r\n/g, '\n' );
        var code = '';
        for ( var i = 0, len = str.length; i < len; ++i ) {
            var c = str.charCodeAt( i );
            switch ( true ) {
            case c < 128 :
                code += String.fromCharCode( c );
                break;
            case c > 127 && c < 2048 :
                code += (String.fromCharCode( (c >> 6) | 192 ) +
                        String.fromCharCode( (c & 63) | 128 ));
                break;
            default :
                code += (String.fromCharCode( (c >> 12) | 224 ) +
                        String.fromCharCode( ((c >> 6) & 63) | 128 ) +
                        String.fromCharCode( (c & 63) | 128 ));
                break;
            }
        }
        return code;
    } );
    
    // 添加默认的解码器
    Base64.String.addDecoder( 'utf-8', function( code ) {
        var str = '';
        var c1 = 0, c2 = 0, c3 = 0;
        for ( var i = 0, len = code.length; i < len; ++i ) {
            c1 = code.charCodeAt( i );
            switch ( true ) {
            case c1 < 128 :
                str += String.fromCharCode( c1 );
                break;
            case c1 > 191 && c1 < 224 :
                c2 = code.charCodeAt( i + 1 );
                str += String.fromCharCode( ((c1 & 31) << 6) | (c2 & 63) );
                i++;
                break;
            default :
                c2 = code.charCodeAt( i + 1 );
                c3 = code.charCodeAt( i + 2 );
                str += String.fromCharCode( ((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63) );
                i += 2;
                break;
            }
        }
        return str;
    } );
    
    /**
     * 获取字符串的字节长度
     * @param str - 原字符串
     * @param charset - 编码的格式
     * @returns {int} 字节长度
     */
    Base64.String.getStringByteLength = function( str, charset ) {
        // 先根据编码格式进行编码
        var encoder = encoders[ (charset || 'utf-8').toLowerCase() ];
        
        // 没有对应的编码格式, 则抛出异常
        if ( typeof encoder !== 'function' ) {
            throw new Error( '[Error] - 未知的编码格式:' + charset );
        }
        
        str = encoder( str );
        
        return str.length;
    };
    
    /**
     * 字符串转字节数组
     * @param str - 原字符串
     * @param charset - 编码的格式
     * @returns {bytes} 字节数组
     */
    Base64.String.toBytes = function( str, charset ) {
        // 获取编码处理函数
        var encoder = encoders[ (charset || 'utf-8').toLowerCase() ];
        
        // 没有对应的编码格式, 则抛出异常
        if ( typeof encoder !== 'function' ) {
            throw new Error( '[Error] - 未知的编码格式:' + charset );
        }
        
        // 先根据编码格式进行编码
        str = encoder( str );
        
        // 编码后再转成字节数组
        var bytes = [];
        for ( var i = 0, len = str.length; i < len; i++ ) {
            bytes.push( str.charCodeAt( i ) );
        }
        return str == null ? null : bytes;
    };

    /**
     * 字节数组转字符串
     * @param bytes - 字节数组
     * @param charset - 解码格式
     * @returns {String} 返回解码后字符串
     */
    Base64.String.bytesToString = function( bytes, charset ) {
        // 获取解码处理函数
        var decoder = decoders[ (charset || 'utf-8').toLowerCase() ];
        
        // 没有对应的编码格式, 则抛出异常
        if ( typeof decoder !== 'function' ) {
            throw new Error( '[Error] - 未知的编码格式:' + charset );
        }
        
        var str = '';
        
        // 先将字节数组转成字符串
        for ( var i = 0, len = bytes.length; i < len; i++ ) {
            str += String.fromCharCode( bytes[ i ] );
        }
        
        // 再根据字符编码进行解码
        str = decoder( str );
        return str;
    };
    
} ) ( Base64 );

//静态成员
( function( Base64 ) {
    var base64;

    /**
     * 默认Base64编码
     * @param {String} data - 需要编码的字符串
     * @returns {String} 返回编码好的字符串
     */
    Base64.encode = function( data, charset ) {
        data = data || '';

        !base64 && (base64 = new Base64());

        var result = base64.encode( data, charset );
        return result;
    };

    /**
     * 默认Base64解码
     * @param {String} data - 需要解码的字符串
     * @returns {String} 返回解码好的字符串
     */
    Base64.decode = function( data, charset ) {
        data = data || '';

        !base64 && (base64 = new Base64());

        var result = base64.decode( data, charset );
        return result;
    };

    /**
     * Base64测试
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
} )( Base64 );
