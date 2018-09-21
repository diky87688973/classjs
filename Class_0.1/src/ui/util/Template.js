Package( 'Fan.ui.util' );

/**
 * 简易模板的实现类
 * 
 * @author Fan
 * 
 * @data 2012/8/23
 */
Class( 'Fan.ui.util.Template', function() {
    
    var _tplRootPath;
    
    /**
     * 构造方法
     */
    this.Template = function( tplRootPath ) {
        _tplRootPath = tplRootPath ? tplRootPath + '/' : 'tpl/';
        Super();
    };
    
    /**
     * 获取模板文件, 优先从缓存中获取
     */
    this.getTemplate = function( templateName, success, failure, async ) {
        var template = null;
        
        // 优先判断缓存中是否已经存在该模板
        var store = Fan.cache.template.get( templateName );
        
        // 若缓存中有该模板, 则从缓存中取出来
        if ( store ) {
            template = store.template;
            logger.info( '[加载模板文件] - form 缓存或预加载: ' + templateName );
            Fan.call( success, null, [ templateName, template ] );
        } else {
            
            // --- 统计使用到的模板名称 --- begin ---
            if ( !window.usingTemplateNameList ) {
                window.usingTemplateNameList = [];
                window.usingTemplateNameList.toString = function() {
                    return ('"/' + this.join( '\n' )
                            .replace( /\./g, '/' )
                            .replace( /\n/g, '.html",\n"/' ) + '.html"')
                            .replace( /[\/]+/g, '/' );
                };
            }
            usingTemplateNameList.push( templateName );
            // --- 统计使用到的模板名称 --- end ---
            
            // 转换成url
            var url = _tplRootPath + templateName.replace( /[.]/g, '/' ) + '.html';
            // 同步载入模板文件
            Class.Loader.loadFile( url, function( content ) {
                template = (content || '').trim();

                // 存入缓存
                Fan.cache.template.add( {
                    id : templateName,
                    template : template
                } );
                
//                window.tmpList = window.tmpList || [];
//                window.tmpList.push(templateName);
                
                Fan.call( success, null, [ templateName, template ] );

                logger.info( '[载入模板] - 成功: ' + templateName );
            }, function() {
                Fan.call( failure );
                logger.info( '[载入模板] - 失败: ' + templateName );
                // throw new Error( '加载模板文件失败:' + url );
            }, {
                async : !!async
            } );
        }
        
        return template;
    };
    
    /**
     * 动态批量获取模板文件
     */
    this.loadTemplate = function( templateNames, success, failure, async ) {
        var loadList = [];
        var isLoadPack = /^(all([&]mode\=[\s\S]*)?)|(loginbefore([&]mode\=[\s\S]*)?)|(other([&]mode\=[\s\S]*)?)/i.test( templateNames );
        if ( !isLoadPack ) {
            Class.each( templateNames, function( i ) {
                var name = this + '';
                // 若缓存中有该模板, 则无需去服务器上取
                var store = Fan.cache.template.get( name );
                if ( !store ) {
                    var tplUrl = name.replace( /[.]/g, '/' ) + '.html';
                    loadList.push( tplUrl );
                }
            } );
        }
        
        // 同步载入模板文件
        // 当第一参数非all时,则加载指定列表的模板
        if ( isLoadPack || loadList.length > 0 ) {
            var url = '/dynamic/template-pack.html',
                params = 'file=' + (encodeURIComponent( loadList.join( '|' ) ) || templateNames),
                method = loadList.length > 0 ? 'POST' : 'GET';
            Class.Loader.loadFile( url, function( data ) {
                try{
                    data = data || '';
                    // 抓取模板
                    data.replace( /\n\n\n---begin---([^\s]+)---begin---\n\n\n([\s\S]*?)\n\n\n---end---\1---end---\n\n\n/g, function ( v1, v2, v3 ) {
                        var name = v2;
                        var tpl = v3;
                        
                        // 存入缓存
                        Fan.cache.template.add( {
                            id : name,
                            template : tpl
                        } );
                        return '';
                    } );
                    Fan.call( success, null, [ data ] );
                    logger.info( '[批量载入模板] - 成功: \n' + loadList.join( '\n' ) );
                } catch ( _ ) {
                    Fan.call( failure );
                    logger.error( '[批量载入模板] - 失败: ' + _ );
                }
                loadList = templateNames = success = failure = async = null;
            }, function() {
                logger.error( 'Request Error' );
                Fan.call( failure );
                logger.info( '[批量载入模板] - 失败: \n' + loadList.join( '\n' ) );
                loadList = templateNames = success = failure = async = null;
            }, {
                async : !!async,
                method : method,
                params : params
            } );
        }
    };
    
    /**
     * 解析填充
     * @override
     */
    this.parse = function( template, obj ) {
        return Fan.formatTemplet( template, obj );
    };
    
    /**
     * 解析填充列表, 接收一个item模板,和一个对象数组
     * 返回一个填充数据后的item模板的结果数组
     * @override
     */
    this.parseList = function( template, objArr ) {
        return Fan.formatTempletList( template, objArr );
    };
    
} );