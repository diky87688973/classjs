Package( 'Fan.util' );

/**
 * 字符串辅助类
 * @class
 */
Class( 'Fan.util.String', function() {} );

// 静态成员
( function() {
    // 编码器
    var encoders = {};
    
    // 解码器
    var decoders = {};
    
    /**
     * 增加一个编码器
     * @param charsetName - 编码类型
     * @param encoderFn - 进行编码的处理函数, 该函数接受一个需要被编码的字符原串
     * @returns {String} 返回编码后的字符串
     */
    Fan.util.String.addEncoder = function ( charsetName, encoderFn ) {
        encoders[ charsetName.toLowerCase() ] = encoderFn;
    };
    
    /**
     * 增加一个解码器
     * @param charsetName - 解码类型
     * @param decoderFn - 进行解码的处理函数, 该函数接受一个需已被编码的字符串
     * @returns {String} 返回解码后的字符串
     */
    Fan.util.String.addDecoder = function ( charsetName, decoderFn ) {
        decoders[ charsetName.toLowerCase() ] = decoderFn;
    };
    
    // 添加默认的编码器
    Fan.util.String.addEncoder( 'utf-8', function( str ) {
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
    Fan.util.String.addDecoder( 'utf-8', function( code ) {
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
    Fan.util.String.getStringByteLength = function( str, charset ) {
        // 先根据编码格式进行编码
        var encoder = encoders[ (charset || 'utf-8').toLowerCase() ];
        
        // 没有对应的编码格式, 则抛出异常
        if ( !Fan.isFunction( encoder ) ) {
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
    Fan.util.String.toBytes = function( str, charset ) {
        // 获取编码处理函数
        var encoder = encoders[ (charset || 'utf-8').toLowerCase() ];
        
        // 没有对应的编码格式, 则抛出异常
        if ( !Fan.isFunction( encoder ) ) {
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
    Fan.util.String.bytesToString = function( bytes, charset ) {
        // 获取解码处理函数
        var decoder = decoders[ (charset || 'utf-8').toLowerCase() ];
        
        // 没有对应的编码格式, 则抛出异常
        if ( !Fan.isFunction( decoder ) ) {
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
} )();