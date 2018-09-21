Package( 'Fan.util' );

Import( 'Fan.util.Browser' );

/**
 * @class DomUtil dom操作辅助类
 * 
 * @author FuFan
 * 
 * @version 2.0
 * 
 */
Class( 'Fan.util.Dom', function() {} );

/**
 * 封装常用操作DOM的函数
 */
(function( Fan, undefined ) {
var
    
    window = this,
    
    arr_slice   = Array.prototype.slice,
    arr_splice  = Array.prototype.splice,
    arr_indexOf = Array.prototype.indexOf,

    // 常量键
    KEYS = {
        // 清除前后分号，在修改css中使用
        REG_CLEAR_SEMICOLON : /^(\s*;)|(;\s*)$/g,
        
        FAN_DOM_ANIM_ELEM_ID : '_FAN_DOM_ANIM_ELEM_ID_'
    },
    
    // 便于访问 ==> Fan.util.anim.Anim.getNowValueByProgressAndConfig
    getNowValueByProgressAndConfig = null,

    // 封装了Anim，提供Dom元素简易使用Anim制作动画
    Anim = {
        // 当前执行动作的元素对象集合
        currDoActionObject : {},
        
        // 停止元素上的动作
        stop : function( elem ) {
            if ( typeof elem === 'string' )
                return Anim.stopAction( animId );
            
            // 动画id
            var animId = elem && elem[ KEYS.FAN_DOM_ANIM_ELEM_ID ];
            
            // 停止原先动作，执行当前动作
            animId && Anim.stopAction( animId );
        },

        // 停止元素上的动作
        stopAction : function( animId ) {
            if ( Anim.currDoActionObject[ animId ] ) {
                Anim.currDoActionObject[ animId ].stop();
                Anim.currDoActionObject[ animId ] = null;
                delete Anim.currDoActionObject[ animId ];
            }
        },

        /**
         * 根据属性获取动画的参数
         */
        getPropAction : function( elem, prop, propValue, propsConfig ) {
            var action;

            switch ( prop ) {
            // 支持动作的CSS
            case 'top'          : case 'left'       : case 'right'          : case 'bottom' :
            case 'marginLeft'   : case 'marginTop'  : case 'marginRight'    : case 'marginBottom' : 
            case 'paddingLeft'  : case 'paddingTop' : case 'paddingRight'   : case 'paddingBottom' :
            case 'width'        : case 'height'     : case 'fontSize'       :
                action = Anim.animPropActions.defaultsCSSAction( elem, prop, propValue, propsConfig );
                break;

            // case 'backgroundColor' :
            // case 'color' :

            // 支持动作的属性
            case 'scrollTop'    : case 'scrollLeft' :
                action = Anim.animPropActions.scrollAction( elem, prop, propValue, propsConfig );
                break;

            // 测试动作
            case 'test' :
                action = Anim.animPropActions.testAction( elem, prop, propValue, propsConfig );
                break;

            // 默认的动作处理，按照CSS处理
            default :
                return null;
                // 返回null
                // action = Anim.animPropActions.defaultsCSSAction( elem, prop, propValue, propsConfig );
                // break;
            }

            return action;
        },

        /**
         * 定义属性参数取值方式
         */
        animPropActions : {
            // 默认CSS动作
            defaultsCSSAction : function( elem, prop, propValue, propsConfig ) {
                var start = dom.getCss( elem, prop );
                start = parseFloat( start );
                var end = parseFloat( propValue );
                var unit = (propValue + '').replace( /[^a-z]/ig, '' ) || 'px';
                return {
                    start : start,
                    end : end,
                    step : function( now, progress ) {
                        elem.style[ prop ] = now + unit;
                    }
                };
            },

            // 滚轮动作
            scrollAction : function( elem, prop, propValue, propsConfig ) {
                var start = elem[ prop ], end = propValue;
                return {
                    start : start,
                    end : end,
                    step : function( now, progress ) {
                        elem[ prop ] = now;
                    }
                };
            },

            // 测试动作
            testAction : function( elem, prop, propValue, propsConfig ) {
                return {
                    start : propsConfig[ 'start' ],
                    end : propsConfig[ 'end' ],
                    step : function( now, progress ) {
                        //logger.warn('now:'+progress);
                        //propsConfig[ prop ] = now;
                    }
                };
            }
        },
        
        /**
         * 给一个html元素定制样式平滑动作
         * 
         * @param {HtmlElement/String}
         *            elem - 需要定制动画的html元素
         * @param {Object}
         *            propsConfig - 需要制作动画的属性配置
         * @param {Object/Function/Number}
         *            animConfig - 动画配置，可选，配置参照Anim类的构造参数
         * 
         * <pre>
         * animConfig配置:
         * 1、animConfig : {
         *        longTime : 动画执行的时长
         *        step 每一个子动作后被调用的函数，该函数返回false则可以终止动作，接受参数：now,progress,propName
         *        callback 动作完毕后调用的函数
         *    }
         * 2、animConfig : function(now, progress) {} callback函数
         * 3、animConfig : longTime 执行的动画时长
         * </pre>
         * 
         * 示例1： Fan.anim('#test-upload-div', {top:0,left:0,width:1438,height:400}, 50)
         * 示例2:
         *       Fan.anim( wrap, {
         *           test : true,
         *           start : curxy.xx,
         *           end : -xy.xx
         *       }, {
         *           longTime : 200,
         *           step : function( now, progress ) {
         *               var css = cssText.replace( _reg_ig, ':translate(' + now + 'px,' + curxy.yy + 'px)' );
         *               wrap.style.cssText = css;
         *           },
         *           callback : function() {
         *               //_currViewController = _centerViewController;
         *               me = wrap = xy = curxy = cssText = null;
         *           } 
         *       } );
         */
        anim : function( elem, propsConfig, animConfig ) {
            if ( typeof elem == 'string' ) {
                elem = Fan.$( elem )[ 0 ];
            }

            if ( !elem || !propsConfig )
                return;

            // 便于访问
            if ( !getNowValueByProgressAndConfig ) {
                Import( 'Fan.util.anim.Anim' );
                getNowValueByProgressAndConfig = Fan.util.anim.Anim.getNowValueByProgressAndConfig;
            }
            
            // 动画id
            var animId = elem[ KEYS.FAN_DOM_ANIM_ELEM_ID ];
            // 停止原先动作，执行当前动作
            animId && Anim.stopAction( animId );

            // 给执行动作的元素生成一个动画ID
            animId = Class.id( 'FAN_DOM_ANIM_ELEM_ID_' );
            elem[ KEYS.FAN_DOM_ANIM_ELEM_ID ] = animId;

            // 动作集合缓存，避免重复获取属性的动作
            var actions = {};

            // Anim的初始配置
            if ( Fan.isFunction( animConfig ) ) {
                animConfig = {
                    callback : animConfig
                };
            } else if ( Fan.isNum( animConfig ) ) {
                animConfig = {
                    longTime : animConfig
                };
            }

            // 用于通过主Anim对象的progress取得子Anim的now值
            animConfig = Class.apply( {}, animConfig );
            var _step = animConfig.step, _callback = animConfig.callback;

            // 若是测试模式
            if ( propsConfig[ 'test' ] ) {
                animConfig.start = propsConfig.start >> 0;
                animConfig.end = propsConfig.end >> 0;
            } else {
                // 主代理动画的起始和结束
                animConfig.start = 0;
                animConfig.end = 100;
            }
            
            // 覆盖step和callback回调函数
            animConfig.callback = function( now, progress ) {
                _callback && _callback.call( this, now, progress );
                Anim.stopAction( animId );
            };
            animConfig.step = function( now, progress ) {
                // 判断_step是否关闭了主动画对象
                if ( this.isStop() ) {
                    Anim.stopAction( animId );
                    return;
                }
                for ( var prop in propsConfig ) {
                    if ( prop ) {
                        var propAction;

                        // 判断属性动作是否存在
                        if ( !(propAction = actions[ prop ]) && null !== propAction ) {
                            // 若不存在，获取属性动作
                            actions[ prop ] = propAction = Anim.getPropAction( elem, prop, propsConfig[ prop ], propsConfig );
                        }

                        if ( propAction ) {
                            // 设置起点和终点
                            animConfig.start = propAction.start;
                            animConfig.end = propAction.end;
                            var nowVal = getNowValueByProgressAndConfig( progress, animConfig );
                            // 调用动作处理
                            propAction.step( nowVal, progress );
                            
                            // 每一步的回调
                            _step && _step.call( this, nowVal, progress, prop );
                        } else {
                            // 删除不支持动画的属性
                            delete propsConfig[ prop ];
                        }
                    }
                }
                
                // 是否为空对象
                if ( Fan.isEmptyObject( propsConfig ) ) {
                    logger.debug( '[动画停止] 无支持动画的属性' );
                    this.stop();
                    Anim.stopAction( animId );
                }
            };

            // 创建主Anim对象
            var anim = new Fan.util.anim.Anim( animConfig );

            // 缓存当前正在动作的元素，动作完毕后需将其移除
            Anim.currDoActionObject[ animId ] = {
                stop : function() {
                    elem[ KEYS.FAN_DOM_ANIM_ELEM_ID ] = undefined;
                    try {
                        // IE 7 BUG
                        delete elem[ KEYS.FAN_DOM_ANIM_ELEM_ID ];
                    } catch ( _ ) {
                    }
                    anim.destroy();
                    actions = elem = animId = anim = animConfig = propsConfig = _step = _callback = null;
                    logger.debug( '[动画停止]' );
                }
            };

            // 启动动画
            anim.start();
        }
    },

    // 扩展Fan.dom
    dom = Fan.dom = {
        Anim : Anim,
        
        // 文本框中的常用操作，在textarea中也通用
        input : {
            // 选中文本
            select : function( ipt, start, end ) {
                if ( ipt.setSelectionRange ) {
                    // for firefox|chrome|safari|opera
                    ipt.setSelectionRange( start || 0, Fan.isNum( end ) ? end : ipt.value.length );
                } else if ( ipt.createTextRange ) {
                    // for ie
                    var r = ipt.createTextRange();
                    r.collapse( true );
                    r.moveStart( 'character', start || 0 );
                    r.moveEnd( 'character', Fan.isNum( end ) ? end : ipt.value.length );
                    r.select();
                }
                ipt.focus();
            },

            // 取出选择的文本
            getSelectText : function( ipt ) {
                if ( document.selection ) {
                    return document.selection.createRange().text;
                } else {
                    return ipt.value.substring( ipt.selectionStart, ipt.selectionEnd );
                }
            },
            
            // 输入限制
            // valueAreaReg - 合法值域
            // illegalValueReg - 非法值
            keypress : function ( input, valueAreaReg, illegalValueReg ) {
                if ( !input || !valueAreaReg )
                    return;
                
                // 粘贴校验
                illegalValueReg && (Fan.addEvent( input, 'paste', function ( event ) {
                    // 此处this在IE7下,指向window, 因此不用this指向当前元素, 改用event的srcElement
                    var ipt = Fan.Event.getTarget( event );
                    Fan.defer( function() {
                        // 粘贴时,去除非法字符
                        ipt.value = ipt.value.replace( illegalValueReg, '' );
                        ipt = null;
                    } );
                } ));
                
                // 输入校验
                Fan.addEvent( input, 'keypress', function ( event ) {
                    var keyCode = event.keyCode || event.charCode || event.which;
                    switch ( true ) {
                    // 放开校验
                    case event.ctrlKey && (keyCode == 97 || keyCode == 65) :  // 全选
                    case event.ctrlKey && (keyCode == 99 || keyCode == 67) :  // 复制
                    case event.ctrlKey && (keyCode == 118 || keyCode == 86) : // 粘贴
                    case event.ctrlKey && (keyCode == 120 || keyCode == 88) : // 剪切
                    case keyCode == 8 :  // 退格
                    case keyCode == 9 :  // tab
                    case keyCode == 13 : // 回车
                    case keyCode == 35 : // home
                    case keyCode == 36 : // end
                    case keyCode == 37 : // 左
                    case keyCode == 38 : // 上
                    case keyCode == 39 : // 右
                    case keyCode == 40 : // 下
                    case keyCode == 46 : // 删除
                        break;
                    // 禁止输入
                    case !( valueAreaReg.test( String.fromCharCode( keyCode ) ) ) : 
                        logger.debug( 'reg:' + valueAreaReg + '\tkeycode:' + event.keyCode );
                        Fan.Event.cancel( event );
                        return false;
                    }
                } );
                input = null;
            }
        },

        // file元素的相关操作
        file : {
            /**
             * 建立一個可存取到該file的url PS: 浏览器需支持HTML5 File API
             */
            getUrl : function( file ) {
                switch ( true ) {
                case Fan.isFunction( window.createObjectURL ) :
                    // basic
                    return window.createObjectURL( file );
                case window.URL && Fan.isFunction( window.URL.createObjectURL ) :
                    // mozilla firefox
                    return window.URL.createObjectURL( file );
                case window.webkitURL && Fan.isFunction( window.webkitURL.createObjectURL ) :
                    // webkit chrome
                    return window.webkitURL.createObjectURL( file );
                default : return null;
                }
            }
        },

        // img元素的相关操作
        img : {
            /**
             * 自适应大小，让不规则大小的图片能够自适应给定的标准大小比例，不产生拉伸效果 该方法用于img的onload事件中
             * 避免闪烁,可在img元素增加样式visibility:hidden;以及父容器增加超出隐藏
             */
            autoSize4ImgOnload : function( img, width, height ) {
                if ( !img )
                    return;

                // 改成自适应，恢复真实大小
                img.style.width = 'auto';
                img.style.height = 'auto';

                try {
                    // 真实大小
                    var w = img.offsetWidth;
                    var h = img.offsetHeight;

                    // 限制大小与比例
                    var p = width / height;

                    // 真实比例
                    var sp = w / h;

                    // 根据比例调整
                    if ( w > width || h > height ) {
                        if ( p > sp ) {
                            // 真实width过大
                            img.style.height = height + 'px';
                        } else if ( p < sp ) {
                            // 真实height过大
                            img.style.width = width + 'px';
                        } else {
                            // 比例相同，但真实大小超过限制
                            img.style.height = height + 'px';
                        }
                    } else {
                        // 没有超过限制，则不限制，如需拉伸限制，则可在此控制
                    }
                    
                    // 调整完大小后,显示出来
                    img.style.visibility = 'inherit';
                    img.setAttribute( '_auto_size_img_size_', w + ',' + h );
                } catch ( _ ) {
                }
            }
        },
        
        /**
         * @staticMethod textOverflow(HTMLElement/Jquery elem, String text, int width)
         *  字符超出后显示省略号
         * 
         * <pre>
         * 1、elem - 文本的容器元素，html元素或者jquery对象，注意：文本容器元素的宽度样式必须是随文本长度可变的。
         * 2、text - 文本内容
         * 3、width - 文本容器的限定宽度，超出此宽度，则显示省略号
         * 4、isOverride - 可选,当没有超出时,也使用text参数覆盖元素innerHTML属性
         * </pre>
         */
        textOverflow : function( elemOrJqueryObj, text, width, isOverride ) {
            if ( !elemOrJqueryObj )
                return;
            var jqEl = jQuery( elemOrJqueryObj );

            var t = text;
            var len = (t + '').replace( /[^\x00-\xff]/g, '' ).length + (t + '').replace( /[\x00-\xff]/g, '' ).length * 1.829268292682927;

            if ( len > 0 ) {
                var fontSize = parseInt( Fan.dom.getCss( jqEl[ 0 ], 'font-size' ) ) || 12;
                // 间距 : 1.1614583333333333
                fontSize = (fontSize / 2) * 1.1614583333333333;

                // logger.debug( '原始长度:' + len );
                // logger.debug( '英文字宽:' + fontSize );
                
                len = len * fontSize;

                // logger.debug( '实际长度:' + len );
                // logger.debug( '限定长度:' + width );

                // 超出长度限制
                if ( len > width ) {
                    var i, s;
                    
                    // logger.debug( '超出长度:' + (len - width - 3 * fontSize) );
                    
                    len = width + (3 * fontSize);

                    // logger.debug( '截取后长度:' + len );

                    // 循环累积法可以换成其他更高效的算法
                    for ( i = 0, s = t.length; 0 < len && i < s; i++ ) {
                        var l = t.charAt( i ).replace( /[^\x00-\xff]/g, 'ii' ).length;
                        if ( l > 1 ) {
                            // 1个中文宽度是1个英文的1.829268292682927倍
                            l = 1.829268292682927;
                        }
                        len -= (l * fontSize);
                        if ( 0 >= len ) {
                            if ( l == 1 ) {
                                i--;
                                if ( t.charAt( i ).replace( /[^\x00-\xff]/g, 'ii' ).length == 1 ) {
                                    i--;
                                    if ( t.charAt( i ).replace( /[^\x00-\xff]/g, 'ii' ).length == 1 ) {
                                        i--;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    // logger.warn(t.length + ',' + i);
                    if ( i < t.length ) {
                        jqEl.text( t.substring( 0, i ) + '...' );
                        jqEl.attr( 'title', t );
                    } else if ( isOverride ) {
                        jqEl.text( t );
                        jqEl.attr( 'title', '' );
                    }
                } else if ( isOverride ) {
                    jqEl.text( t );
                    jqEl.attr( 'title', '' );
                }
            } else if ( isOverride ) {
                jqEl.text( t );
                jqEl.attr( 'title', '' );
            }

            jqEl = elemOrJqueryObj = width = null;
        },
        
        /**
         * 插入html片段
         * @param {HTMLElement} el
         * @param {String} where beforeBegin、afterBegin、beforeEnd、afterEnd
         * @param {String} html
         */
        insertHTML : function ( el, where, html ) {
            if ( !el )
                return false;
             
            where = where.toLowerCase();
             
            if ( el.insertAdjacentHTML )
                el.insertAdjacentHTML( where, html );
            else {
                var range = el.ownerDocument.createRange(),
                    frag = null;
                 
                switch ( where ) {
                    case 'beforebegin':
                        range.setStartBefore( el );
                        frag = range.createContextualFragment( html );
                        el.parentNode.insertBefore( frag, el );
                        return el.previousSibling;
                    case 'afterbegin':
                        if ( el.firstChild ) {
                            range.setStartBefore( el.firstChild );
                            frag = range.createContextualFragment( html );
                            el.insertBefore( frag, el.firstChild );
                        } else {
                            el.innerHTML = html;
                        }
                        return el.firstChild;
                    case 'beforeend':
                        if ( el.lastChild ) {
                            range.setStartAfter( el.lastChild );
                            frag = range.createContextualFragment( html );
                            el.appendChild( frag );
                        } else {
                            el.innerHTML = html;
                        }
                        return el.lastChild;
                    case 'afterend':
                        range.setStartAfter( el );
                        frag = range.createContextualFragment( html );
                        el.parentNode.insertBefore( frag, el.nextSibling );
                        return el.nextSibling;
                }
            }
        },

        /**
         * @staticMethod xmlToString(XMLObject xmlObj) 将xml对象（dom对象）转换成字符串形式
         * 
         * <pre>
         * 1、xmlObj - 需要被序列化成字符串的xml对象
         * </pre>
         * 
         * @return 返回字符串形式的xml
         */
        xmlToString : function( xmlObj ) {
            if ( typeof XMLSerializer != 'undefined' )
                return (new XMLSerializer()).serializeToString( xmlObj );
            else if ( Fan.type( xmlObj.xml ) != 'undefined' )
                return xmlObj.xml;
            else if ( document.implementation.hasFeature( 'LS', '3.0' ) ) {
                var serialier = document.implementation.createLSSerializer();
                return serialier.writeToString( xmlObj );
            } else {
                throw new Error( 'Error::浏览器不支持序列化XML对象' );
            }
        },

        /**
         * @staticMethod stringToXml(String xmlStr) 将字符串形式的xml转换成xml对象
         * 
         * <pre>
         * 1、xmlStr - 需要被构建成xml对象的字符串
         * </pre>
         * 
         * @return 返回xml对象
         */
        stringToXml : function( xmlStr ) {
            if ( null == xmlStr )
                return null;
            var doc;

            if ( typeof DOMParser != 'undefined' ) {
                doc = (new DOMParser()).parseFromString( xmlStr, 'text/xml' );
            } else if ( document.implementation.hasFeature( 'LS', '3.0' ) ) {
                var impl = document.implementation;
                var parser = impl.createLSParser( impl.MODE_SYNCHRONOUS, null );
                var ipt = impl.createLSInput();
                ipt.stringData = xmlStr;
                doc = parser.parse( ipt );
            } else if ( typeof ActiveXObject != 'undefined' ) {
                doc = new ActiveXObject( 'Microsoft.XMLDOM' );
                doc.async = 'false';
                doc.loadXML( xmlStr );
                if ( doc.parseError != 0 ) {
                    throw new Error( 'Error::解析xml字符串异常，错误原因:' + doc.parseError.reason );
                }
            }

            return doc;
        },

        /**
         * @method attr(key, val) 获取或设置元素属性值
         * 
         * @param {String}
         *            key 返回key对应的值
         * 
         * @param {Object}
         *            val 可选，存在val参数时，则是存值
         */
        attr : function( el, key, val ) {
            if ( null == el || null == key )
                return null;

            var v;

            // 仅当元素节点才有具有attribute
            if ( el.nodeType !== 1 )
                return null;

            if ( el.hasAttribute && el.hasAttribute( key ) || el.getAttribute( key ) != null )
                v = el.getAttribute( key );
            else
                v = el[ key ];

            if ( arguments.length > 2 ) {
                if ( null == val )
                    el.removeAttribute( key );
                else
                    el.setAttribute( key, val );
            }
            return v;
        },

        /**
         * 创建html元素，接受一个html的字符串形式
         * 
         * <code>
         * var div = Fan.dom.create( '<div>Fan.dom.' + '   <span onclick="window.location=\'/fan/dom/create\'">' + '      create(String/elementhtml)' + '   </span>' + '</div>' );
         * </code>
         */
        create : (function() {
            var div, ul, tbl, row, sel;
            return function( html ) {
                var type = Fan.type( html );
                if ( type == 'string' ) {
                    var tag = '';
                    html.replace( /^\s*[<]([^>\s]+)([>]|\s)/, function( v1, v2, v3 ) {
                        // logger.debug('_' + v2 + '_');
                        tag = v2;
                    } );
                    switch ( tag.toLowerCase() ) {
                    case 'td' :
                        if ( !row ) {
                            row = document.createElement( 'tr' );
                            row.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        row.innerHTML = html;
                        html = [];
                        while ( row.cells[ 0 ] ) {
                            html.push( row.cells[ 0 ] );
                            row.removeChild( row.cells[ 0 ] );
                        }
                        break;
                    case 'tr' :
                        if ( !tbl ) {
                            tbl = document.createElement( 'table' );
                            tbl.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        tbl.innerHTML = '<tbody>' + html + '</tbody>';
                        html = [];
                        while ( tbl.rows[ 0 ] ) {
                            html.push( tbl.rows[ 0 ] );
                            tbl.removeChild( tbl.rows[ 0 ] );
                        }
                        break;
                    case 'tbody' :
                        if ( !tbl ) {
                            tbl = document.createElement( 'table' );
                            tbl.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        tbl.innerHTML = html;
                        html = [];
                        html.push( tbl.getElementsByTagName( "tbody" )[ 0 ] );
                        html[ 0 ] && tbl.removeChild( html[ 0 ] );
                        break;
                    case 'option' :
                        if ( !sel ) {
                            sel = document.createElement( 'select' );
                            sel.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        sel.innerHTML = html;
                        html = [];
                        while ( sel.firstChild ) {
                            html.push( sel.firstChild );
                            sel.removeChild( sel.firstChild );
                        }
                        break;
                    case 'li' :
                        if ( !ul ) {
                            ul = document.createElement( 'ul' );
                            ul.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        ul.innerHTML = html;
                        html = [];
                        while ( ul.firstChild ) {
                            html.push( ul.firstChild );
                            ul.removeChild( ul.firstChild );
                        }
                        break;
                    default :
                        if ( !div ) {
                            div = document.createElement( 'div' );
                            div.setAttribute( 'elform', 'Fan.dom.create' );
                        }
                        div.innerHTML = html;
                        html = [];
                        while ( div.firstChild ) {
                            html.push( div.firstChild );
                            div.removeChild( div.firstChild );
                        }
                        break;
                    }
                    return Fan.isArray( html ) && html.length > 1 ? html : html[ 0 ];
                } else if ( type == 'element' ) {
                    return html;
                } else
                    return null;
            };
        })(),

        /**
         * @method checkIn(parentEl, subEl, ref) 检测元素是否存在包含关系,Array ref外部引用数据，传递一个空数组，方便把更多细节结果传递出去
         * 
         * <pre>
         * 1、parentEl - 父元素 
         * 2、subEl - 子元素
         * 3、refArray - 数组形式表示从父元素到子元素的层次，数组中每一项对应一个dom层次
         * </pre>
         * 
         * @return {boolean} 返回是否包含
         */
        checkIn : function( parentEl, subEl, refArray ) {
            if ( !parentEl || !subEl )
                return false;
            refArray && refArray.push( subEl );
            subEl = subEl.parentNode;
            var r;
            while ( !r && subEl ) {
                r = subEl == parentEl;
                refArray && refArray.push( subEl );
                subEl = subEl.parentNode;
            }
            parentEl = null, subEl = null, refArray = null;
            return !!r;
        },

        /**
         * @method contains(parentEl, subEl) 检测元素是否存在包含关系, 自身不算
         * 
         * <pre>
         * 1、parentEl - 父元素 
         * 2、subEl - 子元素
         * </pre>
         * 
         * @return {boolean} 返回是否包含
         */
        contains : function( parentEl, subEl ) {
            if ( !subEl || !parentEl )
                return false;
            if ( parentEl.contains && Fan.browser.engine.webkit > 522 )
                return parentEl.contains( subEl ) && parentEl != subEl;
            else if ( parentEl.compareDocumentPosition )
                return !!(parentEl.compareDocumentPosition( subEl ) & 16);
            else
                return this.checkIn( parentEl, subEl, null );
        },

        /**
         * 获取元素的绝对位置x/y和相对位置xx/yy
         * 
         * @param el
         *            被获取未知的元素，或元素的ID
         * @param relative
         *            是否仅获取相对位置, 默认false
         * @return {x, y, xx, yy}
         */
        getXY : function( el, relative ) {
            // 取得x坐标
            var x = el.offsetLeft, xx = x, r = /\babsolute\b|\brelative\b/i, flg = 1;
            var tmp = el.offsetParent;
            while ( null != tmp ) {
                if ( flg && tmp.style && r.test( this.getCss( tmp, 'position' ) ) ) {
                    flg = 0;
                    xx = x;
                    if ( relative ) {
                        x = 0;
                        break;
                    }
                }
                x += tmp.offsetLeft;
                tmp = tmp.offsetParent;
            }
            flg = 1;
            // 取得y坐标
            var y = el.offsetTop, yy = y;
            tmp = el.offsetParent;
            while ( null != tmp ) {
                if ( flg && tmp.style && r.test( this.getCss( tmp, 'position' ) ) ) {
                    flg = 0;
                    yy = y;
                    if ( relative ) {
                        y = 0;
                        break;
                    }
                }
                y += tmp.offsetTop;
                tmp = tmp.offsetParent;
            }
            return {
                x : x,
                y : y,
                xx : xx,
                yy : yy
            };
        },

        /**
         * 设置dom上的cssText
         */
        css : function( el, cssText, val ) {
            // 如果是json对象的样式，则解析并组成字符串形式
            if ( val != null ) {
                cssText += ':' + val + ';';
            } else if ( cssText && typeof cssText == 'object' ) {
                var t = [];
                Class.each( cssText, function( k ) {
                    t.push( k + ':' + this );
                } );
                cssText = t.join( ';' );
                t = null;
            }
            el.style.cssText = el.style.cssText + ';' + cssText;
        },

        /**
         * @method checkCollision(element1, element2 [,depth] [,depthArray] [,depthX [,depthY]]) 检测两个元素是否碰撞
         * depth为碰撞深度:{x, y} / [x[, y]] / x / x,y
         * @return boolean
         */
        checkCollision : function( el1, el2, deX, deY ) {
            var de = [ 0, 0 ];
            if ( null != deX )
                if ( Fan.isNumber( deX ) ) {
                    de[ 0 ] = deX, de[ 1 ] = deY || 0;
                } else if ( Fan.isArray( deX ) ) {
                    de[ 0 ] = deX[ 0 ] || 0, de[ 1 ] = deX[ 1 ] || 0;
                } else {
                    de[ 0 ] = deX.x || 0, de[ 1 ] = deX.y || 0;
                }

            // 取得双方xy坐标
            var xy1 = this.getXY( el1 );
            var xy2 = this.getXY( el2 );
            // 计算双方各一半的宽高
            var l1 = {
                x : this.width( el1 ) / 2,
                y : this.height( el1 ) / 2
            };
            var l2 = {
                x : this.width( el2 ) / 2,
                y : this.height( el2 ) / 2
            };
            // 计算双方中心点坐标
            var o1 = {
                x : xy1.x + l1.x,
                y : xy1.y + l1.y
            };
            var o2 = {
                x : xy2.x + l2.x,
                y : xy2.y + l2.y
            };
            // 计算双方的中心点坐标x和y的距离
            var x = o1.x - o2.x, y = o1.y - o2.y;
            x = x < 0 ? -x : x;
            y = y < 0 ? -y : y;
            // 判断双方最短距离：当连心线距离小于双方最短距离（el1/2 + el2/2），则相碰撞
            return ((x < l1.x + l2.x - de[ 0 ]) && (y < l1.y + l2.y - de[ 1 ]));
        },

        /**
         * @method checkMouseCollision(element, event [,depth] [,depthArray] [,depthX [,depthY]]) 检测鼠标是否碰撞了指定元素
         * depth为碰撞深度:{x, y} / [x[, y]] / x / x,y
         * @return boolean
         */
        checkMouseCollision : function( el1, evt, deX, deY ) {
            var de = [ 0, 0 ];
            if ( null != deX )
                if ( Fan.isNumber( deX ) ) {
                    de[ 0 ] = deX, de[ 1 ] = deY || 0;
                } else if ( Fan.isArray( deX ) ) {
                    de[ 0 ] = deX[ 0 ] || 0, de[ 1 ] = deX[ 1 ] || 0;
                } else {
                    de[ 0 ] = deX.x || 0, de[ 1 ] = deX.y || 0;
                }

            // 取得双方xy坐标
            var xy1 = this.getXY( el1 );
            var xy2 = Fan.Event.getXY( evt );
            // 计算双方各一半的宽高
            var l1 = {
                x : this.width( el1 ) / 2,
                y : this.height( el1 ) / 2
            };
            var l2 = {
                x : 1 / 2,
                y : 1 / 2
            };
            // 计算双方中心点坐标
            var o1 = {
                x : xy1.x + l1.x,
                y : xy1.y + l1.y
            };
            var o2 = {
                x : xy2.x + l2.x,
                y : xy2.y + l2.y
            };
            // 计算双方的中心点坐标x和y的距离
            var x = o1.x - o2.x, y = o1.y - o2.y;
            x = x < 0 ? -x : x;
            y = y < 0 ? -y : y;
            // 判断双方最短距离：当连心线距离小于双方最短距离（el1/2 + el2/2），则相碰撞
            return ((x < l1.x + l2.x - de[ 0 ]) && (y < l1.y + l2.y - de[ 1 ]));
        },
        
        /**
         * @method checkMousedownInScroll(element, event)
         * 检测鼠标是否按住了滚动条
         * @return object or null, object:{right:true,down:false}
         */
        checkMousedownInScroll : function( elem, mouseEvent ) {
            var inRightScroll, inDwonScroll;
            
            // 检测是否存在滚动条
            if ( elem.offsetWidth > elem.clientWidth ) {
                var eXY = Fan.dom.getXY( elem );
                var mXY = Fan.Event.getXY( mouseEvent );
                var scrollWidth = elem.offsetWidth - elem.clientWidth;
                var minX = eXY.x + elem.offsetWidth - scrollWidth;
                var maxX = eXY.x + elem.offsetWidth;
                
                // 判断鼠标是否在右侧滚动条上
                inRightScroll = minX < mXY.x && mXY.x < maxX;
            }
            if ( !inRightScroll && elem.offsetHeight > elem.clientHeight ) {
                var eXY = Fan.dom.getXY( elem );
                var mXY = Fan.Event.getXY( mouseEvent );
                var scrollHeight = elem.offsetHeight - elem.clientHeight;
                var minY = eXY.y + elem.offsetHeight - scrollHeight;
                var maxY = eXY.y + elem.offsetHeight;
                
                // 判断鼠标是否在下侧滚动条上
                inDwonScroll = minY < mXY.y && mXY.y < maxY;
            }
            
            return (inRightScroll || inDwonScroll) ? {
                right : !!inRightScroll,
                dwon : !!inDwonScroll
            } : null;
        },

        /**
         * 动态添加style标签，接受一个字符串形式的style样式表的所有内容
         * 
         * 如： div {margin:0px;} table {border:0px;}
         * 
         * @param styleString
         *            字符串形式的样式表
         * @param id
         *            给样式表指定id，不建议指定id，IE中暂不兼容，不允许更改样式表id
         * @return Style元素
         */
        addStyle : function( styleString, id ) {
            var style;
            if ( Class.ie ) {
                style = document.createStyleSheet();
                style.cssText = styleString;
            } else {
                style = document.createElement( 'style' );
                style.type = 'text/css';
                style.innerHTML = styleString;

                var head = document.getElementsByTagName( 'head' )[ 0 ] || document.documentElement;
                head.insertBefore( style, head.firstChild );
                id && (style.id = id + '');
            }
            return style;
        },

        /**
         * 从DOM中删除一个style元素
         * 
         * @param style
         *            style的id或style元素
         */
        removeStyle : function( style ) {
            if ( null == style )
                return null;

            // 取得style
            style = typeof style == 'string' ? document.getElementById( style ) : style;
            this.remove( style );
        },

        /**
         * @method addClass(element, className) 增加类样式引用 className:样式名称
         */
        addClass : function( el, className ) {
            var r = new RegExp( '(\\s+|^)' + className + '(\\s+|$)', 'gi' );
            r.lastIndex = 0;
            !r.test( el.className ) && (el.className = (el.className + ' ' + className).trim());
        },

        /**
         * @method removeClass(element, className) 删除类样式引用 className:样式名称
         */
        removeClass : function( el, className ) {
            var r = new RegExp( '(\\s+|^)' + className + '(\\s+|$)', 'gi' );
            r.lastIndex = 0;
            r.test( el.className ) && (el.className = el.className.replace( r, ' ' ).trim());
        },

        /**
         * @method hasClass(element, className) 判断元素是否存在指定class样式 className:样式名称
         */
        hasClass : function( el, className ) {
            var r = new RegExp( '(\\s+|^)' + className + '(\\s+|$)', 'gi' );
            r.lastIndex = 0;
            return r.test( el.className );
        },

        /**
         * @method alterClass(element, className) class样式交替，有则删，无则加 className:样式名称
         */
        alterClass : function( el, className ) {
            var r = new RegExp( '(\\s+|^)' + className + '(\\s+|$)', 'gi' );
            r.lastIndex = 0;
            if ( r.test( el.className ) )
                this.removeClass( el, className );
            else
                this.addClass( el, className );
        },

        // 删除指定的html元素
        remove : (function() {
            var d = document.createElement( 'div' );
            return function( el ) {
                if ( el.parentNode ) {
                    el.parentNode.removeChild( el );
                    if ( Class.ie ) {
                        d.appendChild( el );
                        d.innerHTML = '';
                    }
                }
            };
        })(),

        // 返回元素指定的样式值 styleName 必须为驼峰风格
        // TODO 部分样式名和关键字冲突，暂未处理
        getCss : function( el, styleName ) {
            var style;
            if ( (style = el.style[ styleName ]) ) {
            } else if ( document.defaultView && document.defaultView.getComputedStyle ) {
                styleName = styleName.replace( /([A-Z])/g, '-$1' ).toLowerCase();
                style = document.defaultView.getComputedStyle( el, null );
                style = style ? style.getPropertyValue( styleName ) : '';
            } else if ( el.currentStyle ) {
                style = el.currentStyle[ styleName ];
            }

            style = style == null ? '' : style;

            switch ( style ) {
            case 'auto' :
                switch ( styleName ) {
                case 'top' :
                    style = el.offsetTop + 'px';
                    break;
                case 'left' :
                    style = el.offsetLeft + 'px';
                    break;
                case 'right' :
                case 'bottom' :
                    // 暂未处理
                    break;
                case 'width' :
                    style = el.offsetWidth + 'px';
                    break;
                case 'height' :
                    style = el.offsetHeight + 'px';
                    break;
                }
                break;
            }

            return style;
        },

        // 默认的公用动作，支持格式：(数值[单位]) 如123, 123px, 123em, 23pt,
        // 默认单位(px)
        _defaultAction : function( el, endValue, totalStep, property ) {
            var start = dom.getCss( el, property );
            start = parseFloat( start );

            var end = parseFloat( endValue );
            var unit = (endValue + '').replace( /[-\d]/g, '' ) || 'px';
            var unitFn = Fan.proxy( function( curr ) {
                return Math.ceil( curr ) + this;
            }, unit );

            var initAction = dom.initAction( property, start, end, unitFn, totalStep );
            start = end = unit = unitFn = el = endValue = totalStep = property = null;

            try {
                return initAction;
            } finally {
                initAction = null;
            }
        },

        // 背景色渐变+背景透明渐变
        _backgroundColorAction : function( el, endValue/* rgb(x,x,x)|rgba(x,x,x,x) */, totalStep, property ) {
            var old = dom.getCss( el, property );
            el = null;
            old = old.replace( /[^\d,\.]/g, '' ).split( ',' );

            var end = endValue; // 需要转换成rgb(x,x,x)/rgba(x,x,x,x)
            var prefix = /^(rgba|rgb)/.exec( end )[ 1 ]; // rgb/rgba
            end = end.replace( /[^\d,\.]/g, '' ).split( ',' );

            var regRGBA = /rgba/;

            var cssTextArr = [];
            // 通过组装单位时，将值传出来赋予cssTextArr数组中，返回虚假的内容
            var unitR = function( curr ) {
                cssTextArr[ 0 ] = Math.ceil( curr );
                return '';
            }, unitG = function( curr ) {
                cssTextArr[ 1 ] = Math.ceil( curr );
                return '';
            }, unitB = function( curr ) {
                cssTextArr[ 2 ] = Math.ceil( curr );
                return '';
            }, unitA = function( curr ) {
                cssTextArr[ 3 ] = curr;
                return '';
            };

            var startR = parseInt( old[ 0 ] ), startG = parseInt( old[ 1 ] ), startB = parseInt( old[ 2 ] ), startA = regRGBA.test( prefix ) && parseFloat( old[ 3 ] );
            startA = startA != 0 && !startA ? 1 : startA;

            var endR = parseInt( end[ 0 ] ), endG = parseInt( end[ 1 ] ), endB = parseInt( end[ 2 ] ), endA = regRGBA.test( prefix ) && parseFloat( end[ 3 ] );

            var r = dom.initAction( property + '_r', startR, endR, unitR, totalStep ), g = dom.initAction( property + '_g', startG, endG, unitG, totalStep ), b = dom.initAction( property + '_b',
                    startB, endB, unitB, totalStep ), a = regRGBA.test( prefix ) && dom.initAction( property + '_a', startA, endA, unitA, totalStep );

            return {
                step : function( currStep, cssTextArray ) {
                    var overCount = 0, tmp = [];

                    r.step( currStep, tmp ) && overCount++;
                    g.step( currStep, tmp ) && overCount++;
                    b.step( currStep, tmp ) && overCount++;
                    regRGBA.test( prefix ) && a.step( currStep, tmp ) && overCount++;

                    var rgba = prefix + '(' + cssTextArr.join( ',' ) + ')';
                    cssTextArray.push( property.replace( /([A-Z])/g, '-$1' ).toLowerCase() + ':' + rgba );

                    // logger.warn(property.replace(/([A-Z])/g,
                    // '-$1').toLowerCase() + ':' + rgba);

                    // 执行完毕，清空所有临时内容
                    if ( a && overCount >= 4 || !a && overCount >= 3 ) {
                        cssTextArr = tmp = overCount = rgba = prefix = null;
                        startR = startG = startB = startA = null;
                        unitR = unitG = unitB = unitA = null;
                        endR = endG = endB = endA = null;
                        old = end = regRGBA = null;
                        r = g = b = a = null;
                        return true;
                    }
                },
                stop : function() {
                    cssTextArr = prefix = r = g = b = a = null;
                    startR = startG = startB = startA = null;
                    unitR = unitG = unitB = unitA = null;
                    endR = endG = endB = endA = null;
                    old = end = regRGBA = null;
                }
            };
        },

        // 滚动条滑动动作
        _scrollAction : function( el, endValue, totalStep, property ) {
            var start = el[ property ], end = endValue, unitFn = '';
            var action = dom.initAction( property, start, end, unitFn, totalStep );
            return action;
        },

        /**
         * 定制各种样式的动作处理方式
         */
        initActionHandler : function() {

            // 属性动作对应处理
            this.propAction = {
                // 无效的属性，用于测试生成连续动作点，并在step中使用这些点，达到任意动画
                'test' : this._testAction,

                scrollTop : this._scrollAction,
                scrollLeft : this._scrollAction
            };

            // css样式动作对应处理
            this.cssAction = {
                // 支持动作的样式
                width           : this._defaultAction,
                height          : this._defaultAction,
                top             : this._defaultAction,
                left            : this._defaultAction,
                right           : this._defaultAction,
                bottom          : this._defaultAction,
                marginLeft      : this._defaultAction,
                marginTop       : this._defaultAction,
                marginRight     : this._defaultAction,
                marginBottom    : this._defaultAction,
                paddingLeft     : this._defaultAction,
                paddingTop      : this._defaultAction,
                paddingRight    : this._defaultAction,
                paddingBottom   : this._defaultAction,

                backgroundColor : this._backgroundColorAction,
                color           : this._backgroundColorAction,
                fontSize        : this._defaultAction,

                // 暂不支持动作的样式
                padding         : false,
                margin          : false,
                border          : false,
                borderLeft      : false,
                borderTop       : false,
                borderRight     : false,
                borderBottom    : false,
                background      : false

            // 背景定位
            // ...
            };
        }
    };

    Class.apply( Fan, {

        /**
         * @staticMethod call(Function fn, Object scope, [Array arguments])
         * 尝试调用一个函数, 并可指定函数内的this作用域和入参列表
         * 
         * <pre>
         * 1、fn - 被执行的函数
         * 2、scope - 函数内this指向的对象, 可以为null
         * 3、arguments - 参数数组
         * </pre>
         * 
         * @returns 返回被执行的函数的返回值
         */
        call : function ( fn, scope, args ) {
            if ( Fan.isFunction( fn ) ) {
                if ( arguments.length == 1 )
                    return fn();
                else
                    return fn.apply( scope, args || [] );
            }
        },
        
        /**
         * 获取调用者的arguments属性并存放在新数组中, 返回该数组
         */
        getArgs : function () {
            // 有bug return [].concat( arguments.callee.caller.arguments );
            var func_arguments = arguments.callee.caller.arguments;
            var args = [];
            for ( var i = 0, l = func_arguments.length; i < l; i++ )
                args.push( func_arguments[ i ] );
            return args;
        },
        
        /**
         * @staticMethod checkVersion(String version1, String version2)
         *               版本号检测，返回两个版本号的比较值
         * 
         * <pre>
         * 1、version1 - 版本号1
         * 2、version2 - 版本号2
         * </pre>
         * 
         * @return {int} -1：版本号1小于版本号2, 0：版本号相等, 1：版本号1大于版本号2
         * 
         * @throws 参数列表异常
         */
        checkVersion : function ( ver1, ver2 ) {
            if ( arguments.length >= 2 ) {
                ver2 = ver2 + '';
                ver1 = ver1 + '';
    
                var ret = 0, tmpOld = ver2.split( '.' ), tmpNew = ver1.split( '.' ), len = tmpOld.length > tmpNew.length ? tmpOld.length : tmpNew.length;
                for ( var i = 0, o, n; i < len; i++ ) {
                    o = parseFloat( tmpOld[ i ] || '0' );
                    n = parseFloat( tmpNew[ i ] || '0' );
                    if ( o < n ) {
                        ret = 1;
                        break;
                    } else if ( o == n ) {
                        ret = 0;
                        continue;
                    } else if ( o > n ) {
                        ret = -1;
                        break;
                    }
                }
                tmpOld = tmpNew = len = null;
                return ret;
            }
            
            throw new Error( 'Error:Fan.checkVersion(version1, version2) params list error' );
        },
    
        /**
         * @method proxy(Function fn, Object scope, Array args)
         *         创建代理函数，传入一个Function对象，返回该函数的代理函数，并可指定函数内的this
         *         作用域，和函数被调用时的参数
         * 
         * <pre>
         * 1、fn - 被代理的函数 
         * 2、scope - 被代理函数内部this的作用域 
         * 3、args - 参数数组
         * </pre>
         * 
         * @return 代理函数
         */
        proxy : function ( fn, scope, args ) {
            if ( arguments.length > 2 && !Fan.isArray( args ) && args && !(args.callee && args.length != null) ){
                args = [ args ];
            }
            return function () {
                var ret;
                Fan.isFunction( fn ) && (ret = fn.apply( scope || this, args || arguments ));
                return ret;
            };
        },
    
        /**
         * @staticMethod defer(Function fn, int lazyTime, Object scope,
         *               Array args) 延迟执行函数
         * 
         * <pre>
         * 1、fn -  被延迟执行的函数 
         * 2、lazyTime - 延迟时间，缺省值:0
         * 3、scope - 延迟函数中的this作用域，可选
         * 4、args - 参数数组，可选
         * </pre>
         * 
         * @return setTimeout标示
         */
        defer : function ( fn, lazyTime, scope, args ) {
            if ( Fan.isFunction( fn ) ) {
                var proxyFn = arguments.length < 3 ? fn : arguments.length > 3 ? this.proxy( fn, scope, args ) : this.proxy( fn, scope );
                return setTimeout( proxyFn, lazyTime >> 0 );
            }
        },
    
        /**
         * @staticMethod indexOf(Collection items, Object item)
         *               在集合对象中，检索某一个元素位于集合中的位置
         * 
         * <pre>
         * 1、items - 集合对象
         * 2、item - 被检索的对象
         * </pre>
         * 
         * @return 返回被检索对象对应集合中的位置，当未检索到对象时返回-1
         */
        indexOf : function ( items, item ) {
            if ( arr_indexOf )
                return arr_indexOf.call( items, item );
            
            var idx = null;
            if ( items ) {
                idx = Class.each( items, function ( i ) {
                    if ( items[ i ] === item ) {
                        return i;
                    }
                } );
            }
            return idx == null ? -1 : idx;
        },
    
        /**
         * @staticMethod formatTemplet(String templet, Array/Object arrayOrObject, String defaultValue)
         *  字符串格式化模版
         * 
         * <code>
         * 示例1:
         * 用模板生成：'<name>Fu Fan</name>'
         * (1) formatTemplet('<name>{{name}}</name>', {name : 'Fu Fan'}, 'unname');
         * (2) formatTemplet('<name>{{0}} {{1}}</name>', ['Fu', 'Fan']);
         * (3) formatTemplet('<name>{{user.name}}</name>', {user:{name:'Fu Fan'}});
         * 示例2:
         * 用模板生成：'<sex>男</sex>'
         * (1) formatTemplet('<sex>#{return sex==0?'男':'女';}#</sex>', {sex : 0});
         * (2) formatTemplet('<sex>#{if(sex==0){return '男';}else{return '女';}}#</sex>', {sex : 0});
         * (3) formatTemplet('<sex>#{if(this.sex==0)return man;else return this.woman;}#</sex>', {sex:0,man:'男',woman:'女'});
         * </code>
         * 
         * <pre>
         * 1、tpl - 需要格式化的字符串
         * 2、arrayOrObject - 数组对象，或者一个普通Object对象，用以替换格式化字符串中被大括号包裹起来的内容
         * 3、defaultValue - 当没有数据填充时,提供默认值填充.
         * </pre>
         * 
         * @return 完成格式化后的字符串
         */
        formatTemplet : function ( tpl, values, defaultValue ) {
            var _getVal = arguments.callee._getVal;
            if ( !_getVal ) {
                arguments.callee._getVal = _getVal = function( name, obj ) {
                    // 取出层级属性名
                    var i = 0, p = name.split( '.' ), tmp = obj;
                    while( i < p.length && null != tmp ) {
                        tmp = tmp[ p[ i++ ] ];
                    }
                    return tmp;
                };
            }
            
            // 匹配模版中的代码逻辑块, 每一个逻辑块都应return一个结果作为填充的数据
            tpl && values && (tpl = tpl.replace( /#{([\s\S]+?)}#/g, function ( v1, v2, v3, idx ) {
                v2 = (v2 || '').trim();
                var val;
                if ( v2 ) {
                    var fn = Function( 'with(this){\n' + v2 + '\n}' );
                    val = fn.call( values );
                    fn = null;
                } else {
                    val = _getVal( v2 );
                }
                return val == null ? (defaultValue == null ? v1 : defaultValue) : val;
            } ));
            
            // 普通填充
            tpl && values && (tpl = tpl.replace( /{{([\s\S]+?)}}/g, function ( v1, v2, v3, idx ) {
                v2 = (v2 || '').trim();
                var val = _getVal( v2, values );
                return val == null ? (defaultValue == null ? v1 : defaultValue) : val;
            } ));
            
            _getVal = null;
            return tpl;
        },
        
        /**
         * @staticMethod formatTempletList( String tpl, Array objArr, String defaultValue )
         * 解析填充列表, 接收一个item模板,和一个对象数组
         * 返回一个填充数据后的item模板的结果数组
         */
        formatTempletList : function( tpl, objArr, defaultValue ) {
            var tpls = [];
            for ( var i = 0, len = objArr.length; i < len; ++i ) {
                tpls.push( Fan.formatTemplet( tpl, objArr[ i ], defaultValue ) );
            }
            return tpls;
        },
    
        // 1. + URL 中+号表示空格 %2B
        // 2. 空格 URL中的空格可以用+号或者编码 %20
        // 3. / 分隔目录和子目录 %2F
        // 4. ? 分隔实际的 URL 和参数 %3F
        // 5. % 指定特殊字符 %25
        // 6. # 表示书签 %23
        // 7. & URL 中指定的参数间的分隔符 %26
        // 8. = URL 中指定参数的值 %3D
        /**
         * @staticMethod encode(String code) url参数转义
         *               注意：服务需对参数反转义，java.net.URLDecoder.decode(param, "UTF-8");
         * 
         * <pre>
         * 1、code - 需要被转义的字符串
         * </pre>
         * 
         * @return 转义后的内容
         */
        encode : function ( code ) {
            return this.encodeParam( code );
        },
    
        /**
         * @staticMethod encodeParam(String param) url参数转义
         * 
         * 注意：服务器需对参数反转义，java.net.URLDecoder.decode(param, "UTF-8");
         * 
         * <pre>
         * 1、code - 需要被转义的字符串
         * </pre>
         * 
         * <code>
         * 字符转义：
         * 1、escape - js使用数据时可以使用escape，对0-255以外的unicode值进行编码时输出%u****格式，其它情况下escape，encodeURI，encodeURIComponent编码结果相同。
         * 2、encodeURI - 进行url跳转时可以整体使用encodeURI，location.href=encodeURI("http://cang.baidu.com/do/s?word=百度&ct=21");
         * 3、encodeURIComponent - 最多使用的应为encodeURIComponent，它是将中文、韩文等特殊字符转换成utf-8格式的url编码，所以如果给后台传递参数需要使用encodeURIComponent时需要后台解码对utf-8支持（form中的编码方式和当前页面编码方式相同）
         * 
         * 对应解码：
         * 1、unescape
         * 2、decodeURI
         * 3、decodeURIComponent
         * 
         * 附注：jsp传递中文参数乱码问题的解决。（web服务器：tomcat6，页面字符集编码：utf-8）
         * <Connector port="8080"
         *            protocol="HTTP/1.1" 
         *            connectionTimeout="20000"
         *            redirectPort="8443" 
         *            URIEncoding="UTF-8"/>;
         * </code>
         * 
         * @return 转义后的内容
         */
        encodeParam : function ( param ) {
            return encodeURI( encodeURIComponent( param ) );
        },
    
        /**
         * @staticMethod getCustomEventMap(HTMLElement/Document/String element/keyId)
         * 获取该元素上绑定的自定义事件集合
         * 
         * <pre>
         * 1、element - dom对象,或者dom对象的keyId
         * </pre>
         */
        getCustomEventMap : function ( elem ) {
            if ( !elem )
                return null;
            
            var keyId;
            if ( typeof elem === 'string' )
                keyId = elem;
            else
                keyId = Fan.getElemKeyId( elem );
            
            var eventMap = customEventMap.get( keyId );
            return eventMap || Class.map();
        },
        
        /**
         * @staticMethod setCustomEventMap(HTMLElement/Document/String element/keyId)
         * 获取该元素上绑定的自定义事件集合
         * 
         * <pre>
         * 1、element - dom对象,或者dom对象的keyId
         * 2、eventMap - 自定义事件集合
         * </pre>
         */
        setCustomEventMap : function ( elem, eventMap ) {
            if ( !elem || !eventMap )
                return false;
            
            var keyId;
            if ( typeof elem === 'string' )
                keyId = elem;
            else
                keyId = Fan.getElemKeyId( elem );
            
            customEventMap.put( keyId, eventMap );
        },
        
        /**
         * @staticMethod removeCustomEventMap(HTMLElement/Document/String element/keyId)
         * 获取该元素上绑定的自定义事件集合
         * 
         * <pre>
         * 1、element - dom对象,或者dom对象的keyId
         * 2、eventType - 自定义的事件类型,值为true,则清除该元素上的所有自定义事件
         * 3、srcHandler - 事件对应的原始处理函数,取值为true,则清除指定事件类型上的所有自定义事件
         * </pre>
         */
        removeCustomEventMap : function ( elem, eventType, srcHandler ) {
            if ( !elem )
                return false;
            
            var keyId;
            if ( typeof elem === 'string' )
                keyId = elem;
            else
                keyId = Fan.getElemKeyId( elem );
            
            if ( true === eventType ) {
                
                // 清理所有事件事件处理
                customEventMap.remove( keyId );
    
            } else if ( eventType ) {
                
                var eventMap = customEventMap.get( keyId );
                
                if ( true === srcHandler ) {
                    
                    // 清理指定类型的所有事件处理
                    if ( eventMap ) {
                        eventMap.remove( eventType );
                        
                        // 集合为空时, 删除相关的集合对象
                        eventMap.size() <= 0 && customEventMap.remove( keyId );
                    }
            
                } else if ( eventMap && srcHandler ) {
                    
                    // 清理指定类型的具体某个事件处理
                    var handlers = eventMap.get( eventType ), handler;
                    Class.each( handlers, function( i ) {
                        handler = this;
                        if ( handler === srcHandler ) {
                            // 从数组中删除指定函数
                            handlers.splice( i, 1 );
                            
                            // 集合为空时, 删除相关的集合对象
                            handlers.length <= 0 && eventMap.remove( eventType );
                            return false;
                        }
                    } );
                    
                    // 集合为空时, 删除相关的集合对象
                    eventMap.size() <= 0 && customEventMap.remove( keyId );
                    
                    handlers = handler = eventMap = srcHandler = elem = null;
                }
            } else {
                return false;
            }
        },
        
        /**
         * @staticMethod addEvent(HTMLElement/Document element, String
         *               eventType, Function fn) 增加事件监听
         * 
         * <pre>
         * 1、element - 被监听的元素对象
         * 2、type - 事件类型，如：click
         * 3、handler - 事件处理函数
         * </pre>
         */
        addEvent : document.addEventListener ?
                function ( elem, type, handler ) {
                    if ( !type || !Fan.isFunction( handler ) )
                        return;
                    elem.addEventListener( type, handler, false );
                } : document.attachEvent ? function ( elem, type, handler ) {
                    if ( !type || !Fan.isFunction( handler ) )
                        return;
                    
                    // 处理自定义事件, 解决旧版ie不支持自定义事件
                    var eventType = 'on' + type;
                    if ( !(eventType in elem) ) {
                        var eventMap = Fan.getCustomEventMap( elem );
                        var handlers = eventMap.get( type );
                        if ( handlers ) {
                            handlers.push( handler );
                        } else {
                            handlers = [ handler ];
                            eventMap.put( type, handlers );
                            Fan.setCustomEventMap( elem, eventMap );
                        }
                    }
                    
                    elem.attachEvent( eventType, handler );
                    
                } : function ( elem, type, handler ) {
                    if ( !type || !Fan.isFunction( handler ) )
                        return;
                    elem[ 'on' + type ] = handler;
                },
    
        /**
         * @staticMethod removeEvent(HTMLElement/Document element, String
         *               eventType, Function fn) 取消事件监听，addEvent的逆操作。
         * 
         * <pre>
         * 1、element - 被监听的元素对象
         * 2、eventType - 事件类型，如：click
         * 3、fn - 通过addEvent绑定时的事件处理函数
         * </pre>
         */
        removeEvent : document.removeEventListener ?
                function( elem, type, handler ) {
                    if ( !type || !Fan.isFunction( handler ) )
                        return;
                    elem.removeEventListener( type, handler, false );
                } : document.detachEvent ? function( elem, type, handler ) {
                    if ( !type || !Fan.isFunction( handler ) )
                        return;
                    
                    // 从自定义事件集合中删除
                    var eventType = 'on' + type;
                    if ( eventType in elem ) {
                        Fan.removeCustomEventMap( elem, type, handler );
                    }
                    
                    elem.detachEvent( eventType, handler );
                    
                } : function( elem, type, handler ) {
                    if ( !type || !Fan.isFunction( handler ) )
                        return;
                    elem[ 'on' + type ] = null;
                },
        
        /**
         * @staticMethod fireEvent(HTMLElement/Document element, String
         *               eventType, Array args)
         *               触发dom事件
         * 
         * <pre>
         * 1、element - 被监听的元素对象
         * 2、eventType - 事件类型，如：click
         * 3、args - 传递给事件处理函数的参数
         * </pre>
         */
        fireEvent : function ( elem, eventType, args ) {
            return Fan.Event.fire( elem, eventType, args );
        },
        
        /**
         * 事件代理
         * 
         * <pre>
         * 1、element - 被监听的元素对象
         * 2、selector - 符合触发事件条件对象的选择器
         * 3、eventType - 事件类型，如：click
         * 4、handler - 事件处理函数
         * </pre>
         */
        $on : function ( elem, selector, eventType, handler ) {
            var _el = Class.ieDocMode < 9 ? elem : null;
            Fan.addEvent( elem, eventType, function() {
                var
                ret,
                args = Fan.getArgs(),
                evt = args[ 0 ],
                el = Class.ieDocMode < 9 ? _el : this,
                
                // 优先判断是否为自定义触发的事件
                target = evt._target || Fan.Event.getTarget( evt ),
                curTarget = target;
                
                // [低效率, 此处需要优化] 检测子dom是否在selector选择器指向的dom之中
                // TODO
                if ( selector ) {
                    var sels = selector.split( /\s*,\s*/g );
                    while ( curTarget && (Fan.dom.contains( el, curTarget ) || el === curTarget ) ) {
                        
                        ret = Class.each( sels, function( k ) {
                            logger.debug( '[DOM事件代理] - 检测:' + this + ' in ' + curTarget.tagName + '.' + curTarget.className );
                            // 检测是否符合条件
                            if ( jQuery( curTarget ).is( this + '' ) )
                                return true;
                        } );
                        
                        if ( ret )
                            break;
                            
                        curTarget = curTarget.parentElement || curTarget.parentNode;
                    }
                }
                
                // 若符合条件, 则调用回调函数
                if ( ret ) {
                    handler && handler.apply( curTarget, args );
                } else if ( selector == '' ) {
                    handler && handler.apply( target, args );
                } else {
                    logger.debug( '[DOM事件代理] - 忽略, selector:' + selector + ', eventType:' + eventType );
                }
                
                args = evt = el = target = curTarget = ret = null;
            } );
        },
    
        /**
         * 移除事件代理
         * 
         * <pre>
         * 1、element - 被监听的元素对象
         * 2、selector - 符合触发事件条件对象的选择器
         * 3、eventType - 事件类型，如：click
         * 4、handler - 事件处理函数
         * </pre>
         */
        $un : function ( elem, selector, eventType, handler ) {
            
        },
        
        /**
         * @staticMethod removeObject(obj, prop) 移除对象中的属性
         * 
         * <code>
         * 1、obj - 需要被移除属性的对象
         * 2、prop - 被移除的属性名称。可选，默认为空，则是移除全部属性
         * </code>
         */
        removeObject : function ( obj, prop ) {
            if ( null == obj )
                return;
            if ( Fan.isNum( prop ) && Fan.isCollection( obj ) ) {
                arr_splice.call( obj, prop, 1 );
            } else if ( null != prop ) {
                obj[ prop ] = null;
            } else {
                for ( var n in obj )
                    null != n && (obj[ n ] = null);
            }
        },
    
        /**
         * @staticMethod newClosure(obj) 创建一个简单的闭包函数, 该函数返回闭包中的对象
         */
        newClosure : function ( obj ) {
            return function () {
                return obj;
            };
        },
    
        /**
         * @staticMethod checkName(String name) 检测命名规范
         * 
         * <pre>
         * 1、name - 名称
         * </pre>
         * 
         * @return {Boolean}
         */
        checkName : function ( name ) {
            return !(KEYS.REG_NAME_RULE.test( name ));
        },
    
        /**
         * @staticMethod clone(Object obj) 对象克隆
         * 
         * <pre>
         * 1、obj - 被克隆的对象，仅支持普通对象克隆。
         * </pre>
         * 
         * @return 返回新的对象
         */
        clone : function ( obj ) {
            var f = new Function();
            Class.apply( f, { prototype : obj } );
            return new f();
        },
    
        /**
         * @staticMethod onReady(Function fn, Object scope)
         *               页面加载完毕后执行，不包含延迟部分的加载
         * 
         * <pre>
         * 1、fn - 加载完毕后的回调函数
         * 2、scope - 回调函数中的this指向
         * </pre>
         */
        onReady : function ( fn, scope ) {
            Fan.isFunction( fn ) && Fan( fn, scope );
        },
    
        /**
         * @staticMethod isReady(Window win) 判断指定窗口的页面是否加载完成，默认当前窗口
         * 
         * <pre>
         * 1、win - window对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isReady : function ( win ) {
            win = win || window;
            return Fan.isWindow( win ) && win.document && 'complete' == win.document.readyState;
        },
    
        /**
         * @staticMethod type(Object win) 判断传入的对象的类型
         * @param obj
         * @returns {String} 类型：
         *          string|number|boolean|function|undefined|
         *          null|object|array|date|element|regexp
         */
        type : function ( obj ) {
            var type = typeof obj;
            switch ( type ) {
            case 'string' :
            case 'number' :
            case 'boolean' :
            case 'function' :
            case 'undefined' : break;
            case 'object' :
                switch ( true ) {
                case null === obj          : type = 'null';    break;
                case Fan.isArray( obj )    : type = 'array';   break;
                case obj instanceof Date   : type = 'date';    break;
                case Fan.isElement( obj )  : type = 'element'; break;
                case obj instanceof RegExp : type = 'regexp';  break;
                default : type = 'object'; break;
                }
                break;
            default :
                type = 'undefined'; break;
            }
            return type;
        },
    
        /**
         * @staticMethod isArray(Object obj) 判断传入的对象是否为数组
         * 
         * <pre>
         * 1、obj - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isArray : Array.isArray || function ( obj ) {
            return (obj instanceof Array) || ('[object Array]' == obj_toString.apply( obj ) && null != obj.length);
        },
    
        /**
         * @staticMethod isCollection(Object obj) 判断传入的对象是否为集合对象
         * 
         * <pre>
         * 1、obj - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isCollection : function ( collection ) {
            return collection && (Fan.isArray( collection )
                    || collection.length != null
                    || /List]$/.test( obj_toString.call( collection ) )
                    || '[object HTMLCollection]' == obj_toString.call( collection )
                    || '[object NodeList]' == obj_toString.call( collection )
                    || (typeof (collection) == 'object' 
                        && ('isIE' + collection.constructor
                                == 'isIE[object StaticNodeList]')));
        },
    
        /**
         * @staticMethod isElement(Object obj) 判断传入的对象是否为HTML元素对象
         * @param elem
         * @returns {Boolean}
         */
        isElement : function ( elem ) {
            if ( !elem ) return false;
            if ( window.HTMLElement )
                return elem instanceof window.HTMLElement;
            else
                return !!(elem.nodeType && elem.cloneNode && elem.tagName);
        },
    
        /**
         * @staticMethod isWindow(Object obj)
         *               判断传入的对象是否为window对象，该函数只可在同域情况下使用。
         * 
         * <pre>
         * 1、obj - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isWindow : (function () {
            // 从top递归向下找，找到与当前相等的window才返回true，未找到则返回false
            var _f = function ( c, w, i, r ) {
                if ( !w )
                    return false;
                if ( w == c )
                    return true;
                while ( !r && w.length > i )
                    r = arguments.callee( c, w[ i++ ], 0, false );
                return r;
            };
            return function ( c ) {
                return c == window || c == top || _f( c, top, 0, false );
            };
        })(),
    
        /**
         * @staticMethod isFunction(Object obj) 判断传入的对象是否为function
         * 
         * <pre>
         * 1、obj - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isFunction : function ( f ) {
            return (typeof f == 'function' || f instanceof Function);
        },
    
        /**
         * @staticMethod isEmpty(Object obj) 判断传入的对象是否为null或空字符串
         * 
         * <pre>
         * 1、obj - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isEmpty : function ( obj ) {
            return null == obj || (typeof obj == 'string' && '' == obj);
        },
    
        /**
         * @staticMethod isEmptyObject(Object obj) 判断传入的对象是否为空对象，即:不包含任何内容的对象{}
         * 
         * <pre>
         * 1、obj - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isEmptyObject : function( obj ) {
            if ( null == obj )
                return true;
            
            for ( var p in obj ) {
                if ( p )
                    return false;
            }
            
            return true;
        },
    
        /**
         * @staticMethod isNumber(Object obj) 判断传入的内容是否为数值类型，包含（+-无穷大）
         * 
         * <pre>
         * 1、obj - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isNumber : function ( obj ) {
            return typeof obj == 'number' && !isNaN( obj );
        },
    
        /**
         * @staticMethod isNum(Object obj) 判断传入的内容是否为合法数值，不包含（+-无穷大）
         * 
         * <pre>
         * 1、obj - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isNum : function ( n ) {
            return typeof n == 'number' && !isNaN( n ) && (Number.POSITIVE_INFINITY != n && Number.NEGATIVE_INFINITY != n);///^[-+]?\d*\.?\d+$/.test( n + '' );
        },
        
        /**
         * 判断是否为boolean类型
         */
        isBoolean : function ( b ) {
            return typeof b == 'boolean'; // b === true || b === false;
        },
    
        /**
         * @staticMethod isString(Object obj) 判断传入的内容是否为字符串
         * 
         * <pre>
         * 1、obj - 被判断的对象
         * </pre>
         * 
         * @return {Boolean}
         */
        isString : function ( str ) {
            return typeof str == 'string' || str instanceof String;
        },
    
        /**
         * @staticMethod isChinese(String str) 判断传入的字符串是否全部是中文
         */
        isChinese : function ( str ) {
            return KEYS.REG_CHINESE.test( str );
        },
        
        /**
         * 返回dom元素的唯一keyid
         * @param elem
         * @returns
         */
        getElemKeyId : function ( elem ) {
            var keyId;
            if ( Fan.isElement( elem ) ) {
                keyId = elem[ KEYS.ELEM_KEY_ID_NAME ];
                if ( !keyId ) {
                    keyId = Class.id( KEYS.ELEM_KEY_ID_NAME );
                    elem[ KEYS.ELEM_KEY_ID_NAME ] = keyId;
                }
            }
            return keyId || null;
        },
    
        /**
         * @staticMethod getAbsPath(String path)
         *               根据任意路径，返回该路径的绝对路径，缺省参数时，返回当前绝对路径
         * 
         * <pre>
         * 1、path - 任意路径，可选
         * </pre>
         * 
         * @return {String} 返回绝对路径
         */
        getAbsPath : function() {
            var m = document.createElement( Class.ie ? 'img' : 'script' );
            m.setAttribute( 'src', '/' );
            var domain = m.src.replace( /[\/]+$/, '' );
            m.src = '';
            
            return function ( path ) {
                if ( '/' == path )
                    return domain;
                try {
                    m.setAttribute( 'src', path || './' );
                    return m.src.replace( /[\/]+$/, '' );
                } finally {
                    m.src = '';
                }
            };
        }(),
    
        /**
         * @staticMethod notice(String spaceName, Function callback)
         *               指定的类或接口加载完毕后执行的通知
         * 
         * @param spaceName -
         *            空间名，类名或者接口名
         * @param callback -
         *            类或接口加载完毕后，执行该回调
         */
        notice : function ( spaceName, callback ) {
            var id = Class.on( spaceName, function () {
                Class.un( spaceName, id );
                Fan.call( callback );
                callback = spaceName = id = null;
            } );
        },
    
        // 设置一个日志输入对象
        setLogger : function ( lgr ) {
            Class.apply( logger, lgr );
            Class.fire( 'Fan.setLogger', [ lgr ] );
        },
    
        // 获取一个日志输入对象
        getLogger : function () {
            return logger;
        },
        
        // 缓存
        cache : {}
    } );
    
    
    // # dom 事件处理
    Fan.Event = {};
    
    /**
     * @staticMethod getXY(event) 获取事件上的鼠标xy坐标
     */
    Fan.Event.getXY = function( e ) {
        e = e || window.event;
        if ( e )
            if ( e.pageX || e.pageY )
                return {
                    x : e.pageX,
                    y : e.pageY
                };
            else
                return {
                    x : e.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft),
                    y : e.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop)
                };
    };

    /**
     * @staticMethod getDetail(event) 获取滚轮滚动状态
     */
    Fan.Event.getDetail = function( event ) {
        var detail = 0;
        if ( event.wheelDelta ) {
            detail = event.wheelDelta;
            if ( Class.chrome || Class.ie || Class.opare < 10 ) {
                detail = -detail;
            }
        } else {
            detail = event.detail;
        }
        
        detail = detail < 0 ? -1 : 1;
        
        // 由于事件对象的原有属性是只读，通过添加一个私有属性detailOffset来解决兼容问题
        event.detailOffset = detail || 0;
        
        return event.detailOffset;
    };

    /**
     * @staticMethod getTarget(event) 获取事件关联的DOM元素
     */
    Fan.Event.getTarget = function( e ) {
        e = e || window.event;
        return e.srcElement || e.target;
    };

    /**
     * @staticMethod getKeyCode(event) 获取键盘看下的ASCii键码
     */
    Fan.Event.getKeyCode = function( e ) {
        e = e || window.event;
        return e.keyCode || e.charCode || e.which;
    };

    /**
     * @staticMethod stop(event) 停止事件冒泡
     */
    Fan.Event.stop = function( e ) {
        e = e || window.event;
        if ( e.stopPropagation )
            e.stopPropagation();
        else
            e.cancelBubble = true;
    };

    /**
     * @staticMethod cancel(event) 取消事件默认执行
     */
    Fan.Event.cancel = function( e ) {
        e = e || window.event;
        if ( e.preventDefault )
            e.preventDefault();
        else
            e.returnValue = false;
    };

    /**
     * @staticMethod getClipboardText(event) 获取剪切板中的文本，适用于copy、cut、paste事件中
     */
    Fan.Event.getClipboardText = function( e ) {
        e = e || window.event;
        var clipboardData = e.clipboardData || window.clipboardData;
        if ( clipboardData ) {
            return clipboardData.getData( 'text' );
        }
    };

    /**
     * @staticMethod setClipboardText(event, text) 设置剪切板中的文本，适用于copy、cut、paste事件中
     */
    Fan.Event.setClipboardText = function( e, text ) {
        e = e || window.event;
        if ( e.clipboardData ) {
            return e.clipboardData.setData( 'text/plain', text );
        } else if ( window.clipboardData ) {
            // for ie
            return window.clipboardData.setData( 'text', text );
        }
    };

    /**
     * @staticMethod fire(element, eventType|eventObject, args) 触发指定的事件
     * 注: args参数将绑定在event对象的_args属性上传递给监听者
     */
    Fan.Event.fire = function( elem, type, args ) {
        var ret, evt, target;

        // 标准浏览器
        if ( document.createEvent ) {
            // 已指定事件对象, 则无需构造一个事件对象
            if ( type && type.type && type.target ) {
                target = type.target;
                type = type.type;
            }
            
            if ( /^mouse|^(contextmenu$|DOMMouseScroll)$/i.test( type ) ) {
                evt = document.createEvent( 'MouseEvents' );
                evt.initEvent( type, false, true, document.defaultView );
            } else {
                evt = document.createEvent( 'HTMLEvents' );
                evt.initEvent( type, false, true, document.defaultView );
            }

            if ( target ) {
                evt._target = target;
            }
            evt._args = args || [];
            ret = elem.dispatchEvent( evt );
        } else if ( document.createEventObject ) {
            // 已指定事件对象, 则无需构造一个事件对象
            if ( type && type.type && type.target ) {
                target = type.target;
                type = type.type;
            }
            
            // if IE
            var eventType = 'on' + type;
            
            // 判断是否属于自定义事件
            var isSupportEvent = eventType in elem;
            if ( isSupportEvent ) {
                evt = document.createEventObject();
                evt.screenX  = 0;
                evt.screenY  = 0;
                evt.clientX  = 0;
                evt.clientY  = 0;
                evt.ctrlKey  = false;
                evt.altKey   = false;
                evt.shiftKey = false;
                evt.button   = 0;
                evt.type     = type;
                
                if ( target ) {
                    evt._target = target;
                }
                evt._args = args || [];
                ret = elem.fireEvent( eventType, evt );
            } else {
                /*
                 * 自定义事件的触发
                 * 需要通过Fan.addEvent(..)添加监听事件
                 */
                
                // 已指定事件对象, 则无需构造一个事件对象
                if ( type && type.type && type.target ) {
                    target = type.target;
                    type = type.type;
                }
                
                // var keyId = Fan.getElemKeyId( elem );
                
                // 通过keyId或者elem查找该元素绑定的事件集合
                var eventMap = Fan.getCustomEventMap( elem );
                
                // 从绑定的事件集合中查找与本次事件对应的处理函数集合
                var handlers = eventMap.get( type );
                
                // 遍历函数集合,逐个调用
                var handler;
                Class.each( handlers, function( i ) {
                    handler = this;
                    ret = handler.apply( elem, [ { _args : args || [], _target : target } ] );
                    
                    // 当事件函数中返回false则结束事件调用
                    if ( ret === false )
                        return false;
                } );
                eventMap = handlers = handler = ret = elem = args = null;
            }
        }
        evt = elem = null;
        return ret;
    };
    
    
    // # 请求动画帧封装
    var
    RAF_timeoutId   = null,
    RAF             = window.requestAnimationFrame        ||
                      window.webkitRequestAnimationFrame  ||
                      window.mozRequestAnimationFrame     ||
                      window.oRequestAnimationFrame       ||
                      window.msRequestAnimationFrame      ||
                      function ( callback ) { return RAF_timeoutId = window.setTimeout( callback, 1000 / 60 ); },
    CAF             = window.cancelAnimationFrame         ||
                      window.webkitCancelAnimationFrame   ||
                      window.mozCancelAnimationFrame      ||
                      window.oCancelAnimationFrame        ||
                      function ( timeoutId ) {
                          if ( timeoutId ) {
                              window.clearTimeout( timeoutId );
                              return;
                          }
                          RAF_timeoutId && window.clearTimeout( RAF_timeoutId );
                          RAF_timeoutId = null;
                      };
                      
    // 动画路径绘制, 根据时间, 计算不同的点  
    Fan.ease = {
        quadratic: {
            style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fn: function (k) {
                return k * ( 2 - k );
            }
        },
        circular: {
            style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',   // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
            fn: function (k) {
                return Math.sqrt( 1 - ( --k * k ) );
            }
        },
        back: {
            style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            fn: function (k) {
                var b = 4;
                return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
            }
        },
        bounce: {
            style: '',
            fn: function (k) {
                if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
                    return 7.5625 * k * k;
                } else if ( k < ( 2 / 2.75 ) ) {
                    return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
                } else if ( k < ( 2.5 / 2.75 ) ) {
                    return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
                } else {
                    return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
                }
            }
        },
        elastic: {
            style: '',
            fn: function (k) {
                var f = 0.22,
                    e = 0.4;

                if ( k === 0 ) { return 0; }
                if ( k == 1 ) { return 1; }

                return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
            }
        }
    };

    // 生成单个动画帧(动画中的1帧)
    Fan.frame = function( callbcak, duration, easingFn ) {
        duration = duration >> 0;
        
        var startTime = Fan.now(),
            destTime  = startTime + duration,
            isAnimating, easing;
            easingFn  = easingFn || Fan.ease.quadratic.fn;

        function step() {
            var now = Fan.now();

            if ( now >= destTime ) {
                isAnimating = false;
                callbcak( 1 );
                return;
            }

            now = ( now - startTime ) / duration;
            easing = easingFn( now );
            
            // curr = ( end - start ) * easing + start;
            
            callbcak( easing );

            if ( isAnimating )
                return RAF( step );
        }

        isAnimating = true;
        return step();
    };

    // 取消动画帧回调
    Fan.cancelFrame = function( timeoutId ) { CAF( timeoutId ); };

    // 下一帧回调
    Fan.nextFrame = function( callback ) { return RAF( callback ); };
    // 取消下一帧回调
    Fan.cancelNextFrame  = function( timerId ) { CAF( timerId ); };

    // 公布到Fan上
    Fan.anim     = Anim.anim;
    Fan.stopAnim = Anim.stop;
    

    // -- 统一记录鼠标按键 -- begin --
    var
    winResizeTimer, winScrollTimer,
    // 键位记录
    leftKey  = 'o', middleKey = 'o',
    rightKey = 'o', mouseWhichKey = 0,
    mousedownFn, mouseupFn,
    // 鼠标按键统一组合值:(xoo:对应鼠标左中右三个键位,x:按下,o:未按下)
    keyMap = {
        ooo : 0,
        xoo : 1,
        oxo : 2,
        oox : 3,
        xxo : 4,
        xox : 5,
        oxx : 6,
        xxx : 7
    };
    
    // 浏览器窗口大小发生改变
    Fan.addEvent( window, 'resize', function () {
        clearTimeout( winResizeTimer );
        
        var args = arr_slice.call( arguments, 0 );
        
        winResizeTimer = setTimeout( function() {
            Class.fire( 'window-resize', args );
        }, 50 );
    } );
    
    // 浏览器全局滚动条发生改变
    Fan.addEvent( window, 'scroll', function ( evt ) {
        clearTimeout( winScrollTimer );
        var doc = document.documentElement, body = document.body;
        var top = doc.scrollTop || body.scrollTop,
            left = doc.scrollLeft || body.scrollLeft;
        
        winScrollTimer = setTimeout( function() {
            Class.fire( 'window-scroll', [ top >> 0, left >> 0 ] );
        }, 50 );
    } );
    
    // 若是移动设备, 监听设备摆放
    if ( 'orientation' in window ) {
        var types = {
            // 默认
            '0' : 'top',
            // 颠倒
            '180' : 'bottom',
            // 左倾斜
            '-90' : 'left',
            // 右倾斜
            '90' : 'right'
        };
        
        // 监听窗口变化
        Fan.addEvent( window, 'onorientationchange' in window ? 'orientationchange' : 'resize', function() {
            logger.debug( '移动设备摆放变动: ' + window.orientation );
            Class.fire( 'window-orientationchange', [ types[ (window.orientation >> 0) + '' ], window.orientation >> 0 ] );
        } );
    }
    
    // 获取组合键位值
    Fan.getMouseWhichKey = function( event, eventType ) {
        if ( event && eventType ) {
            // 当传递了event参数时,则表示按此事件参数刷新一次组合键值
            if ( /^mousedown$/i.test( eventType ) )
                mousedownFn( event );
            else if ( /^mouseup$/i.test( eventType ) )
                mouseupFn( event );
        }
        return mouseWhichKey || 0;
    };
    Fan.addEvent( document, 'mousedown', mousedownFn = function( event ) {
        if ( !event || event._oop_mousedown_used_ )
            return;
        // 对使用过的event对象做个标记
        event._oop_mousedown_used_ = 1;

        if ( Class.ieDocMode < 9 ) {
            switch ( event.button ) {
            case 1 : leftKey   = 'x'; break;
            case 2 : rightKey  = 'x'; break;
            case 3 : leftKey   = 'x'; rightKey  = 'x'; break;
            case 4 : middleKey = 'x'; break;
            case 5 : leftKey   = 'x'; middleKey = 'x'; break;
            case 6 : rightKey  = 'x'; middleKey = 'x'; break;
            case 7 : leftKey   = 'x'; rightKey  = 'x'; middleKey = 'x'; break;
            }
        } else {
            switch ( event.which ) {
            case 1 : leftKey   = 'x'; break;
            case 2 : middleKey = 'x'; break;
            case 3 : rightKey  = 'x'; break;
            }
        }
        mouseWhichKey = keyMap[ [ leftKey, middleKey, rightKey ].join( '' ) ];
        // logger.debug('按下:mousedown::' + [ leftKey, middleKey, rightKey ].join( '' ));
    } );
    Fan.addEvent( document, 'mouseup', mouseupFn = function( event ) {
        if ( !event || event._oop_mouseup_used_ )
            return;
        // 对使用过的event对象做个标记
        event._oop_mouseup_used_ = 1;
        
        if ( Class.ieDocMode < 9 ) {
            switch ( event.button ) {
            case 1 : leftKey   = 'o'; break;
            case 2 : rightKey  = 'o'; break;
            case 3 : leftKey   = 'o'; rightKey  = 'o'; break;
            case 4 : middleKey = 'o'; break;
            case 5 : leftKey   = 'o'; middleKey = 'o'; break;
            case 6 : rightKey  = 'o'; middleKey = 'o'; break;
            case 7 : leftKey   = 'o'; rightKey  = 'o'; middleKey = 'o'; break;
            }
        } else {
            switch ( event.which ) {
            case 1 : leftKey   = 'o'; break;
            case 2 : middleKey = 'o'; break;
            case 3 : rightKey  = 'o'; break;
            }
        }
        mouseWhichKey = keyMap[ [ leftKey, middleKey, rightKey ].join( '' ) ];
        // logger.debug('释放:mouseup::' + [ leftKey, middleKey, rightKey ].join( '' ));
    } );
    // -- 统一记录鼠标按键 -- end --
    
})( Fan );