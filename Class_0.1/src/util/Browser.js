Package( 'Fan.util' );

/**
 * @class Browser 浏览器封装类, 单例 包含系统平台信息，展示引擎及版本
 * 
 * @author FuFan
 * 
 * @version 2.0
 * 
 */
Class( 'Fan.util.Browser', function() {
    
    /**
     * @property urlRequest url请求对象，处理请求url上的参数
     */
    this.urlRequest = null;

    /**
     * @property selectorOpened 是否启用了浏览器内置的css选择器
     */
    this.selectorOpened = null;

    /**
     * @property name 浏览器名称
     */
    this.name = null;

    /**
     * @property version 浏览器版本
     */
    this.version = null;

    this.ver = null;

    /**
     * @property engine 呈现引擎
     */
    this.engine = null;

    /**
     * @property os 系统平台
     */
    this.os = null;

    /**
     * @method Browser() 构造方法，该方法会做单例检测
     */
    this.Browser = function() {
        Super();

        if ( Fan.browser ) {
            return Fan.browser;
        }

        // 取得url参数
        function f( url ) {
            var urlParams = url || window.location.search + '';
            var idx = urlParams.indexOf( '?' );
            var map = Class.map();
            if ( -1 != idx ) {
                urlParams = urlParams.substring( idx + 1 );
                urlParams = urlParams.trim();
                if ( '' == urlParams ) {
                    return map;
                }
                var pms = urlParams.split( '&' );
                for ( var i = 0; i < pms.length; ++i ) {
                    var p = pms[ i ];
                    p = p.split( '=' );
                    p[ 0 ] = (p[ 0 ] + '').trim();
                    if ( '' !== p[ 0 ] ) {
                        map.put( p[ 0 ], p[ 1 ] ? (p[ 1 ] + '').trim() : '' );
                    }
                }
                return map;
            } else
                return map;
        };

        Class.apply( f, {
            get : function( paramName ) {
                if ( !f.map ) {
                    f.map = f() || Fan.newMap();
                }
                return f.map.get( paramName );
            }
        } );

        this.urlRequest = f;
        this.selectorOpened = true;
        this.name = Class.browserName;
        this.version = this.ver = Class.browserVersion;

        // 显示引擎
        this.engine = {
            ie     : 0,
            gecko  : 0,
            webkit : 0,
            khtml  : 0,
            opera  : 0,
            ver    : null
        };

        // 系统平台
        this.os = {
            win       : false,
            mac       : false,
            x11       : false,

            android   : false,
            ios       : false,
            iphone    : false,
            ipod      : false,
            nokiaN    : false,
            winMobile : false,
            macMobile : false,

            // 游戏系统
            wii       : false,
            ps        : false
        };

        // 检测浏览器使用的显示引擎
        var ua = navigator.userAgent;
        switch ( true ) {
        case !!window.opera :
            this.engine.ver = this.ver = this.version = Fan.opera = Fan.browserVersion = window.opera.version;
            this.engine.opera = parseFloat( this.engine.ver );
            break;

        case /AppleWebKit\/(\S+)/.test( ua ) :
            this.engine.ver = RegExp[ '$1' ];
            this.engine.webkit = parseFloat( this.engine.ver );

            if ( !Class.chrome && !Class.safari ) {
                if ( this.engine.webkit < 100 ) {
                    this.ver = 1;
                } else if ( this.engine.webkit < 312 ) {
                    this.ver = 1.2;
                } else if ( this.engine.webkit < 412 ) {
                    this.ver = 1.3;
                } else
                    this.ver = 2;
            }
            break;

        // \u003b -> ; 避免检测语法告警,将;字符转换成unicode编码
        case /KHTML\/(\S+)/.test( ua ) || /Konqueror\/([^\u003b]+)/.test( ua ) :
            this.engine.ver = this.ver = RegExp[ '$1' ];
            this.engine.khtml = Fan.konq = parseFloat( this.engine.ver );
            break;

        case /rv:([^\)]+)\) Gecko\/\d{8}/.test( ua ) :
            this.engine.ver = RegExp[ '$1' ];
            this.engine.gecko = parseFloat( this.engine.ver );
            break;
        }

        // 检测平台
        var p = navigator.platform;
        this.os.win = p.indexOf( 'Win' ) == 0;
        this.os.mac = p.indexOf( 'Mac' ) == 0;
        this.os.x11 = (p == 'X11') || p.indexOf( 'Linux' ) == 0;

        // 检测windows平台
        if ( this.os.win ) {
            if ( /Win(?:dows )?([^do]{2})\s?(\d+\.\d+)?/.test( ua ) ) {
                if ( RegExp[ '$1' ] == 'NT' ) {
                    switch ( RegExp[ '$2' ] ) {
                    case '5.0' : this.os.win = '2000';  break;
                    case '5.1' : this.os.win = 'XP';    break;
                    case '6.0' : this.os.win = 'Vista'; break;
                    case '6.1' : this.os.win = '7';     break;
                    case '6.2' : this.os.win = '8';     break;
                    default    : this.os.win = 'NT';    break;
                    }
                } else if ( RegExp[ '$1' ] == '9x' ) {
                    this.os.win = 'ME';
                } else
                    this.os.win = RegExp[ '$1' ];
            }
        }

        // 移动设备检测
        var ios = ua.match( /\biphone\s+os\s+([^\s]+)\s+/i );
        if ( ios && ios.length > 1 ) {
            this.os.ios = ios[ 1 ].replace( /_/g, '.' );
        }
        var android = ua.match( /\bandroid\s+([\d.]+)\b/i );
        if ( android && android.length > 1 ) {
            this.os.android = android[ 1 ];
        }
        
        this.os.iphone    = ua.indexOf( 'iPhone' ) > -1;
        this.os.ipod      = ua.indexOf( 'ipod' )   > -1;
        this.os.nokiaN    = ua.indexOf( 'NokiaN' ) > -1;
        this.os.winMobile = this.os.win == 'CE';
        //this.os.ios = this.os.iphone || this.os.ipod;

        // 游戏平台
        this.os.wii = ua.indexOf( 'Wii' ) > -1;
        this.os.ps  = /playstation/i.test( ua );
        
        this.os.isMobile = this.os.iphone || this.os.ipod || this.os.nokiaN || this.os.winMobile
                            || this.os.ios || this.os.ps || this.os.wii;
        this.os.isPC = !this.os.isMobile;
    };

    // 函数:获取客户端视窗可见区域大小，不包含滚动区域
    // return {w,h}
    this.getBodyWH = function() {
        var dom = document.documentElement;
        return {
            w : dom.clientWidth || dom.scrollWidth,
            h : dom.clientHeight || dom.scrollHeight
        };
    };

    // 函数:获取文档总高度，包含滚动区域
    // return {w,h}
    this.getBodyAndScrollWH = function() {
        var body = document.body;
        var html = document.documentElement;
        return {
            w : Math.max( body.scrollWidth, body.clientWidth, html.scrollWidth, html.scrollWidth ),
            h : Math.max( body.scrollHeight, body.clientHeight, html.scrollHeight, html.clientHeight )
        };
    };

    // 函数:获得浏览器可见区域的左上角坐标xy
    // return {x,y}
    this.getBrowserLeftTop = function() {
        var doc = document.documentElement, bd = document.body;
        return {
            x : doc.scrollLeft || bd.scrollLeft,
            y : doc.scrollTop || bd.scrollTop
        };
    };

    // 函数:获得浏览器可见区域的右上角坐标xy
    // return {x,y}
    this.getBrowserRightTop = function() {
        return {
            x : this.getBodyAndScrollWH().w,
            y : document.documentElement.scrollTop || document.body.scrollTop
        };
    };

    // 函数:获得浏览器可见区域的左下角坐标xy
    // return {x,y}
    this.getBrowserLeftBottom = function() {
        return {
            x : document.documentElement.scrollLeft || document.body.scrollLeft,
            y : this.getBodyAndScrollWH().h
        };
    };

    // 函数:获得浏览器可见区域的右下角坐标xy
    // return {x,y}
    this.getBrowserRightBottom = function() {
        var wh = this.getBodyAndScrollWH();
        return {
            x : wh.w,
            y : wh.h
        };
    };

    // 函数:添加页面地址到收藏夹, 返回:true|false 表示成功与否
    this.addFavorite = function( url, title ) {
        try {
            if ( Class.ie ) {
                window.external.AddFavorite( url, title );
                return true;
            } else if ( window.sidebar ) {
                window.sidebar.addPanel( title, url, '' );
                return true;
            }
        } catch ( e ) {
            logger.error( '收藏失败, 请使用Ctrl + D快捷键收藏.' );
        }
        return false;
    };

    // 函数:设置指定页面url为首页, 返回:true|false 表示成功与否
    var aTag;
    this.setHomePage = function( url ) {
        try {
            !aTag && (aTag = document.createElement( 'a' ));
            aTag.style.behavior = 'url(#default#homepage)';
            aTag.setHomePage( url );
            return true;
        } catch ( e ) {
            if ( window.netscape ) {
                try {
                    netscape.security.PrivilegeManager.enablePrivilege( 'UniversalXPConnect' );
                } catch ( e ) {
                    alert( '此操作被浏览器拒绝！\n请在浏览器地址栏输入“about:config”并回车\n然后将 [signed.applets.codebase_principal_support]的值设置为\'true\',双击即可。' );
                }
                try {
                    var prefs = Components.classes[ '@mozilla.org/preferences-service;1' ].getService( Components.interfaces.nsIPrefBranch );
                    prefs.setCharPref( 'browser.startup.homepage', url );
                    return true;
                } catch ( e ) {
                    logger.error( '设置主页失败, ' + e );
                }
            }
        }
        return false;
    };
} );

// 获得一个实例，该实例为单例，重复调用将返回同一个实例
Fan.util.Browser.getInstance = function() {
    if ( Fan.browser instanceof Fan.util.Browser )
        return Fan.browser;
    return (Fan.browser = new Fan.util.Browser());
};

// 创建一个浏览器单例对象
Fan.browser = Fan.util.Browser.getInstance();