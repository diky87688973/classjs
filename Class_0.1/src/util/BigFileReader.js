/**
 * @namespace Fan.util
 * @author Fan
 * @version 0.1
 */

Package( 'Fan.util' );

/**
 * 大文件读取, 例如日志文件
 *   var reader = new Fan.util.BigFileReader( file );
 *   reader.setBatchBufferSize( 5 * 1024 * 1024 );
 *   reader.batchReadAsText( function ( order, result, proportion ) {
 *       // 每批读取回调
 *       var txts = result.split( /\n+/ );
 *       
 *       for ( var i = 0; i < txts.length; i++ ) {
 *           readLine( order, txts[ i ], proportion );
 *       }
 *       
 *       // return false; // false结束后续批量读取
 *       
 *   }, function() {
 *       console.log( '解析完毕' );
 *   }, function() {
 *       console.log( '解析异常' );
 *   } );
 */
Class( 'Fan.util.BigFileReader', function () {
    // 被读取的文件
    var _file;
    var _fileSize;

    // 分段读取
    var _batchBufferSize;
    
    // 构造方法, 传入文件file : input.files[ 0 ]
    this.BigFileReader = function( file ) {
        Super();
        this.setFile( file );
        this.setBatchBufferSize( 5 * 1024 * 1024 ); // 每批任务读取5mb
    };
    
    this.getFile = function() {
        return _file;
    };
    this.setFile = function( file ) {
        _file = file;
        _fileSize = _file.size;
    };
    
    this.getFileSize = function() {
        return _fileSize;
    };
    
    this.getBatchBufferSize = function() {
        return _batchBufferSize;
    };
    this.setBatchBufferSize = function( batchBufferSize ) {
        _batchBufferSize = batchBufferSize;
    };
    
    // 从文件中读取指定位置的内容
    // readAs( type, success [, error] )
    // readAs( type, start, [end,] success [, error] )
    this.readAs = function( type, start, end, success, error ) {
        switch ( arguments.length ) {
        case 1 : throw new Error( 'arguments error' ); break;
        case 2 :
            success = start;
            start = null;
            break;
        case 3 :
            if ( start instanceof Function ) {
                success = start;
                error = end;
                start = end = null;
            } else if ( end instanceof Function ) {
                success = end;
                end = null;
            }
            break;
        case 4 :
            if ( start instanceof Function ) {
                throw new Error( 'arguments error' );
            } else if ( end instanceof Function ) {
                error = success;
                success = end;
                end = null;
            }
            break;
        }
    
        start = !start ? 0 : start;
        end = !end ? _fileSize : end;
        
        var me = this;
        
        // 获取文件指定位置内容, 位置是字节单位
        var result = start == 0 && end == _fileSize ? _file : _file.slice( start, end );
        
        var reader = new FileReader();
        reader.onload = function() {
            success && success.call( me, this.result );
            reader = success = error = result = me = null;
        };
        reader.onerror = function() {
            error && error.call( me );
            reader = success = error = result = me = null;
        };
        
        switch ( type ) {
        case 'text'         : reader.readAsText( result );          break;
        case 'dataurl'      : reader.readAsDataURL( result );       break;
        case 'arraybuffer'  : reader.readAsArrayBuffer( result );   break;
        case 'binarystring' : reader.readAsBinaryString( result );  break;
        }
        
    };
    
    // 分批从文件中读取内容, 指定每次读取的内容大小, 字节为单位
    this.batchReadAs = function( type, batchCallback, doneCallback, error ) {
        var start = 0;
        var order = 0;
        var me = this;
        
        // 读取一批
        this.readAs( type, start, _batchBufferSize + start, function( result ) {
        
            // 读取结束的字节位置 < 文件的总字节数
            if ( _batchBufferSize + start < _fileSize ) {
                if ( batchCallback ) {
                    var ret = batchCallback.call( me, order, result, start / _fileSize * 100 );
                    if ( false === ret )
                        return;
                }
                
                order++;
                start = _batchBufferSize + start;
                
                // 读取下一批
                this.readAs( type, start, _batchBufferSize + start, arguments.callee, doneCallback, error );
            } else {
                // 最后一次循环
                batchCallback && batchCallback.call( me, order, result, 100 );
                
                // 完成
                doneCallback && doneCallback.call( me );
                
                me = batchCallback = doneCallback = null;
            }
        
        }, error );
    };
    
    // 从文件中读取指定位置的内容
    // readAsText( success [, error] )
    // readAsText( start, [end,] success [, error] )
    this.readAsText = function( start, end, success, error ) {
        return this.readAs( 'text', start, end, success, error );
    };
    
    // 从文件中读取指定位置的内容
    // readAsDataURL( success [, error] )
    // readAsDataURL( start, [end,] success [, error] )
    this.readAsDataURL = function( start, end, success, error ) {
        return this.readAs( 'dataurl', start, end, success, error );
    };
    
    // 从文件中读取指定位置的内容
    // readAsArrayBuffer( success [, error] )
    // readAsArrayBuffer( start, [end,] success [, error] )
    this.readAsArrayBuffer = function( start, end, success, error ) {
        return this.readAs( 'arraybuffer', start, end, success, error );
    };
    
    // 从文件中读取指定位置的内容
    // readAsBinaryString( success [, error] )
    // readAsBinaryString( start, [end,] success [, error] )
    this.readAsBinaryString = function( start, end, success, error ) {
        return this.readAs( 'binarystring', start, end, success, error );
    };
    
    // 分批从文件中读取内容, 指定每次读取的内容大小, 字节为单位
    // batchCallback - 接受参数( order - 批次的序号, result - 当前批次的结果, proportion - 总进度 )
    this.batchReadAsText = function( batchCallback, doneCallback, error ) {
        return this.batchReadAs( 'text', batchCallback, doneCallback, error );
    };
    
    this.batchReadAsDataURL = function( batchCallback, doneCallback, error ) {
        return this.batchReadAs( 'dataurl', batchCallback, doneCallback, error );
    };
    
    this.batchReadAsArrayBuffer = function( batchCallback, doneCallback, error ) {
        return this.batchReadAs( 'arraybuffer', batchCallback, doneCallback, error );
    };
    
    this.batchReadAsBinaryString = function( batchCallback, doneCallback, error ) {
        return this.batchReadAs( 'binarystring', batchCallback, doneCallback, error );
    };
} );
