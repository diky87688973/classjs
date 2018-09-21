Package( 'Fan.util' );

/**
 * cookie操作封装类, 提取自GH.util.Cookie
 */
Class( 'Fan.util.Cookie', function() {
    this.Cookie = function() {
        Super();
    };
} );

/**
 * 设置cookie
 */
// options - {expires,path,domain,secure}
Fan.util.Cookie.set = function( name, value, options ) {
    options = options || {};
    var expires = '';
    if ( options.expires && (typeof options.expires == 'number' || options.expires.toUTCString) ) {
        var date;
        if ( typeof options.expires == 'number' ) {
            date = new Date();
            date.setTime( date.getTime() + (options.expires * 24 * 60 * 60 * 1000) );
        } else {
            date = options.expires;
        }
        // use expires attribute, max-age is not supported by IE
        expires = '; expires=' + date.toUTCString();
    }
    var path = options.path ? '; path=' + options.path : '';
    var domain = options.domain ? '; domain=' + options.domain : '';
    var secure = options.secure ? '; secure' : '';
    document.cookie = [ name, '=', encodeURIComponent( value ), expires, path, domain, secure ].join( '' );
};

/**
 * 获取指定名字的cookie值, cookie名不存在时返回null
 */
Fan.util.Cookie.get = function( name ) {
    var cookieValue = null;
    if ( document.cookie && document.cookie != '' ) {
        var cookies = document.cookie.split( ';' );
        for ( var i = 0; i < cookies.length; i++ ) {
            var cookie = (cookies[ i ] || '').trim();
            // Does this cookie string begin with the name we want?
            if ( cookie.substring( 0, name.length + 1 ) == (name + '=') ) {
                cookieValue = decodeURIComponent( cookie.substring( name.length + 1 ) );
                break;
            }
        }
    }
    return cookieValue;
};

/**
 * 删除指定的cookie
 */
Fan.util.Cookie.remove = function( name ) {
    this.set( name, null, {
        expires : -1
    } );
};

/**
 * 判断cookie中,是否存在指定名字的cookie
 */
Fan.util.Cookie.has = function( name ) {
    var isFound = false;
    if ( null != this.get( name ) ) {
        isFound = true;
    }
    return isFound;
};