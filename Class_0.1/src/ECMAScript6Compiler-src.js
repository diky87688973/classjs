/**
 * ECMAScript 6 类机制编译器 v0.1
 * 
 * 将 ECMAScript 6 代码转换成新的 Class.js 所支持的语法, 
 * 模拟 ECMAScript 6 草案规定的类系统, 用于跨浏览器支持 
 * ECMAScript 6 OOP 语法, 使得在不支持 ECMAScript 6 的
 * 浏览器上, 也能正常使用类机制 
 * 
 * 
 * 
 * 示例:
 * 
 * 定义类:
 * class Animal {
 *
 *  Animal( age, sex ) {
 *      super();
 *      this.age = age;
 *      this.sex = sex;
 *  }
 *
 *  say( msg ) {
 *      return this.age + ',' + this.sex + ',say:' + msg;
 *  }
 * }
 * 
 * 定义接口:
 * interface IMyItface {
 *  method1();      // 接口方法定义
 *  method2();
 *  this.PROPERTY1 = '接口中的静态常量';
 *  this.PROPERTY2 = true;
 * }
 * 
 * 继承类
 * class Dog extends Animal {
 *
 *  var a = 'aaa';          // 私有成员
 *  this.name = 'dog';      // 公有成员, 实例通过 this.name 访问
 *
 *  Dog( age, sex, name ) {
 *      super( age, sex );  // 调用父类构造方法
 *      this.name = name;
 *  }
 *
 *  say( msg ) { // 简洁写法的成员方法定义, 效果同等于完整写法: this.say = function(...){}
 *      return this.name + ',' + super( msg ); // super() 调用父类同名方法
 *  }
 * }
 * 
 * 实现接口
 * class Dog implements IMyItface {
 *
 *  Dog( age, sex, name ) {
 *      super( age, sex );
 *      this.name = name;
 *  }
 *
 *  method1() {
 *      return 'method1 call ' + IMyItface.PROPERTY1;
 *  }
 *  
 *  method2() {
 *      return 'method2 call ' + IMyItface.PROPERTY2;
 *  }
 * }
 * 
 * 继承类同时实现接口, 多接口实现用逗号分隔
 * class Dog extends Animal implements IMyItface {
 *
 *  Dog( age, sex, name ) {
 *      super( age, sex );
 *      this.name = name;
 *  }
 *
 *  say( msg ) {
 *      return this.name + ',' + super( msg );
 *  }
 *  
 *  method1() {
 *      return 'method1 call ' + IMyItface.PROPERTY1;
 *  }
 *  
 *  method2() {
 *      return 'method2 call ' + IMyItface.PROPERTY2;
 *  }
 *  
 * }
 * 
 * 
 * 尚未实现:
 * 1, 成员方法收集, 调用时允许缺省前缀 this.
 * 2, 成员属性收集, 访问成员属性时, 允许缺省前缀 this.
 * 
 */
Class( 'Class.ECMAScript6Compiler', Class.Compiler, function() {
    
    var
        logFlag      = 0,       // 输出日志的控制变量,logFlag > 1 时输出更多的编译细节
    
        // 栈实现括号配对, 从而找到公有方法成员
        maxKH        = [],      // {                大括号
        minKH        = [],      // (                小括号
        midKH        = [],      // [                中括号
        fmaxKH       = [],      // }                大括号
        fminKH       = [],      // )                小括号
        fmidKH       = [],      // ]                中括号
        regKH        = [],      // /.../            正则表达式
        regMidKH     = [],      // /...[...].../    正则中的中括号, 用于辅助辨别正则的结束符号
        sinYH        = [],      // '...'            单引号
        dblYH        = [],      // "..."            双引号
        isZS         = !1,      // 是否处于注释状态
        sinZS        = -1,      // //...            单行注释, 记录注释的起点
        morZS        = -1,      // /* ... */        多行注释
        docZS        = -1,      // /** ... */       文档注释
        zsCharLength = 0,       // 注释文本的长度
        errIdx       = -1,      // 语法错误时的断点位置

        // 代码转换所需
        keyword      = '',      // 最后一个连续的关键字
        prevKeyword  = '',      // 前一个有效关键字
        keywordIndex = -1,      // 关键字的起始位置
        nextIdentifier  = null, // 下一个标识符的处理函数
        lastPackageName = '',   // 最近的包名称
        inClass         = false, // 是否正在解析class中
        inInterface     = false; // 是否正在解析interface中
    
    // 标识符过滤器
    // var identifierFilter = new Filter();

    // 关键字过滤器
    // var keywordFilter = new Filter();
    
    function clearParams() {
        maxKH        = [],
        minKH        = [],
        midKH        = [],
        fmaxKH       = [],
        fminKH       = [],
        fmidKH       = [],
        regKH        = [],
        regMidKH     = [],
        sinYH        = [],
        dblYH        = [],
        isZS         = !1,
        sinZS        = -1,
        morZS        = -1,
        docZS        = -1,
        zsCharLength = 0,
        errIdx       = -1,

        // 代码转换所需
        keyword      = '',
        prevKeyword  = '',
        keywordIndex = -1,
        nextIdentifier = null,
        lastPackageName = '',
        
        inClass         = false,
        inInterface     = false;
    }
    
    /**
     * 处理关键字
     * @param keyword   - 关键字
     * @param code      - 源码
     * @param index     - 关键字所在的位置
     * @returns 返回新的代码
     */
    this.processKeyword = function( keyword, code, index ) {
        switch ( keyword ) {
        case 'package' :
            code = this.insertCodeAtIndex( 'Package(', code, index, keyword.length );
            nextIdentifier = function( identifier ) {
                nextIdentifier = null;
                lastPackageName = identifier;
                return '"' + identifier + '" )';
            };
            break;
        case 'class' :
            _hasClassKeyword = true;
            inClass = true;
            code = this.insertCodeAtIndex( 'Class(', code, index, keyword.length );
            // [重要回调设置]:根据当前关键字, 预设最临近的一个标识符.
            // 如:当前是class关键字,下一个标识符为类名, 故而需要替换前后带引号并且增加前缀包名
            nextIdentifier = function( identifier ) {
                nextIdentifier = null;
                return '"' + (lastPackageName ? lastPackageName + '.' : '') + identifier + '"';
            };
            break;
        case 'interface' :
            _hasClassKeyword = true;
            inInterface = true;
            code = this.insertCodeAtIndex( 'Interface(', code, index, keyword.length );
            // [重要回调设置]:根据当前关键字, 预设最临近的一个标识符.
            // 如:当前是class关键字,下一个标识符为类名, 故而需要替换前后带引号并且增加前缀包名
            nextIdentifier = function( identifier ) {
                nextIdentifier = null;
                return '"' + (lastPackageName ? lastPackageName + '.' : '') + identifier + '"';
            };
            break;
        case 'import' : // 暂不支持一个import导入多个文件的写法
            code = this.insertCodeAtIndex( 'Import(', code, index, keyword.length );
            nextIdentifier = function( identifier ) {
                nextIdentifier = null;
                return '"' + identifier + '" )';
            };
            break;
        case 'extends' :
            code = this.insertCodeAtIndex( ',', code, index, keyword.length );
            break;
        case 'implements' :
            code = this.insertCodeAtIndex( ',', code, index, keyword.length );
            break;
        case 'super' :
            // 关键字转换: super -> Super
            code = this.insertCodeAtIndex( 'Super', code, index, keyword.length );
            break;
        }
        
        return code;
    };

    /**
     * 关键字标识符
     * @param identifier    - 标识符
     * @param prevKeyword   - 前一个关键字
     * @param code          - 源码
     * @param index         - 关键字在源码中的起始位置
     * @returns 返回新的代码
     */
    this.processIdentifier = function( identifier, prevKeyword, code, index ) {
        var newIdentifier = nextIdentifier ? nextIdentifier( identifier ) : identifier;
        
        if ( newIdentifier != identifier )
            code = this.insertCodeAtIndex( newIdentifier, code, index, identifier.length );
        
        return code;
    };

    /**
     * 处理成员方法
     * @param funcName      - 方法名
     * @param code          - 源码
     * @param index         - 关键字在源码中的起始位置
     * @returns 返回新的代码
     */
    this.processFunction = function( funcName, code, index ) {
        code = this.insertCodeAtIndex( 'this.' + funcName + '=function', code, index, funcName.length );
        return code;
    };
    
    /**
     * 处理接口方法
     * @param funcName          - 方法名
     * @param code              - 源码
     * @param startIndex        - 方法名在源码中的起始位置
     * @param leftKuohaoIndex   - 当前方法名的左括号在源码中的位置, 主要用于让结尾剩余的"()"不干扰代码
     * @returns 返回新的代码
     */
    this.processItfsFunction = function( funcName, code, startIndex, curIndex ) {
        code = this.insertCodeAtIndex( '\tClass.noop(', code, curIndex, 1 ); // ( -> void(0
        code = this.insertCodeAtIndex( 'this.' + funcName + '=Function;', code, startIndex, funcName.length );
        return code;
    };

    /**
     * 插入代码到指定的位置
     * @param code           - 需插入的新代码
     * @param srcCode        - 源码
     * @param index          - 插入位置
     * @param overrideLength - 从插入位置开始, 覆盖指定长度的源码
     * @returns newCode      - 返回新代码
     */
    this.insertCodeAtIndex = function( newCode, srcCode, index, overrideLength ) {
        overrideLength >>= 0;
        logFlag > 1 && Class.log( '%c ' + srcCode.substring( index, index + overrideLength ) + '%c ->%c ' + newCode, 'color:#777', 'color:#ccc', 'color:#333' );
        return srcCode.substring( 0, index ) + newCode + srcCode.substring( index + overrideLength );
    };
    
    // 检索是否使用了Class()方法所用的正则
    var _checkClassReg = /((?:^|[,;\(\){}=]|(?:\*[\/])|(?:\/\/[^\n]*\n))\s*(Class|Interface)(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\((?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*(['"])([a-zA-Z0-9._$]+)\3(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*(?:,(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*[a-zA-Z0-9._$]+(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*)*?,(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*function(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\((?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*\)(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*{)/;
    var _keywordReg = /^(?:package|import|class|interface|extends|implements|new|this|super|var|let|const|function|do|while|for|in|continue|break|switch|case|default|return|throw|try|catch|finally|delete|true|false)$/;
    // [1]是否存在class关键字, 用于辅助判断是否需要插入:",function()"
    var _hasClassKeyword = false;
    // [2]记录发现class关键字时的大括号匹配差, 用于辅助判断是否插入:");"
    var _maxKHSpeedForClassKeyword = null; 
    
    /**
     * 解析编译
     * @param code                      - 需要编译的代码
     * @param buildSuccessCallback      - 编译成功时的回调, 接受字符串参数:新的代码
     * @param buildErrorCallback        - 编译错误时的回调, 接受数组参数:[错误行,错误列,错误描述,错误代码片段]
     * @param buildStepByCodeCallback   - 解析每个字符时的回调, 接受参数:编译中的代码,解析到的位置
     * @return {Array}  - 返回4个长度的数组, 表示[错误行,列,错误描述,错误代码], 若无错误, 返回null
     */
    this.build = function( code, buildSuccessCallback, buildErrorCallback, buildStepByCodeCallback ) {
        clearParams();
        code = code.replace( /\r\n/g, '\n' ); // 换行统一为 \n
        var srcCode = code + '';

        // 记录编译过程中出现的错误
        var errMsg = '';
        
        _hasClassKeyword = false;
        _maxKHSpeedForClassKeyword = null; // null表示尚未计算差值
        
        // 初始化匹配位置
        _checkClassReg.lastIndex = 0;
        
        var tmpCode; // 因var作用域是整个函数内, 故而避免多次在语句快中重复声明, 仅在此处声明一次
        
        // 无需编译
        if ( _checkClassReg.test( srcCode ) ) {
            Class.log( '[编译] - 无需编译' );
            buildSuccessCallback && buildSuccessCallback( code );
            return code;
        }
        
        Class.log( '[编译] - 正在编译...' );
        
        // 循环遍历每一个字符, lastCh 最后一个有效字符(不包含注释和空白符,用于辅助判断是否为正则与除号)
        for ( var prevCh, lastCh, ch, i = 0, srcIdx = 0; ch = code.charAt( i ); i++, srcIdx++, prevCh = ch ) {
            buildStepByCodeCallback && buildStepByCodeCallback( code, i );
            
            // # 注释, 凡事注释中的内容, 检测不继续往下, 直接进入下一次循环
            if ( '/' === ch || isZS ) {
                if ( isZS ) {
                    zsCharLength++;
                    
                    if ( sinZS >= 0 ) {
                        if ( '\n' === ch ) { // 遇到换行, 则解除单行注释
                            sinZS = -1;
                            isZS = false;
                            zsCharLength = 0;
                        }
                    } else if ( '/' === ch && '*' === prevCh ) { // 遇到 */, 则解除多行注释(包括文档注释)
                        morZS = -1;
                        docZS = -1;
                        isZS = false;
                        zsCharLength = 0;
                    }
                    
                    continue;
                }
                
                else if ( 0 === sinYH.length && 0 === dblYH.length && 0 === regKH.length ) {
                    // 单行注释
                    if ( '/' === code.charAt( i + 1 ) ) {
                        sinZS = i;      // 记录注释位置
                        isZS = true;    // 正处于注释状态
                        i += 1;         // 跳过注释起点
                        zsCharLength = 2;
                        continue;
                    } else if ( '*' === code.charAt( i + 1 ) ) {
                        // [视为多行注释] 文档注释
                        if ( false && '*' === code.charAt( i + 2 ) ) {
                            docZS = i;
                            i += 2;
                            zsCharLength = 3;
                        }
                        // 多行注释
                        else {
                            morZS = i;
                            i += 1;
                            zsCharLength = 2;
                        }
                        isZS = true;
                        continue;
                    }
                }
            }
            
            // 循环控制
            var ii, count;
            
            // # { [ ( 三种括号开始
            if ( '{' === ch ) {
                // 符号不在 单引号, 双引号, 和正则表达式中, 方为有效符号
                if ( 0 === sinYH.length && 0 === dblYH.length && 0 === regKH.length ) {
                    // 在检索到class关键字后的第一个大括号, 需要转换: { -> function(){
                    if ( _maxKHSpeedForClassKeyword == null && _hasClassKeyword ) {
                        code = this.insertCodeAtIndex( ',function(){', code, i, 1 );
                        i += 11; // i下标前进11位
                        
                        // 记录大括号的匹配差
                        _maxKHSpeedForClassKeyword = maxKH.length - fmaxKH.length;
                        //Class.log('{' + _maxKHSpeedForClassKeyword);
                    }
                    maxKH.push( i ); // 对应源码中的括号位置
                }
            } else if ( '(' === ch ) {
                if ( 0 === sinYH.length && 0 === dblYH.length && 0 === regKH.length ) {
                    minKH.push( i );
                }
            } else if ( '[' === ch ) {
                if ( 0 === sinYH.length && 0 === dblYH.length && 0 === regKH.length ) {
                    midKH.push( i );
                } else if ( regKH.length ) {
                    regMidKH.push( i ); // 记录正则中的中括号
                }
            }
            
            // # } ] ) 三种括号结束
            else if ( '}' === ch ) {
                if ( 0 === sinYH.length && 0 === dblYH.length && 0 === regKH.length ) {
                    fmaxKH.push( i );
                    
                    // 结束括号多余起始括号,则视为错误
                    if ( fmaxKH.length > maxKH.length ) {
                        errIdx = i;
                        errMsg = '括号不匹配, 多余的 } 号';
                        break;
                    }
                    
                    // maxKH.pop();
                    // 最后一个大括号, 且大括号匹配差相等, 则需要转换: } -> });
                    if ( (_maxKHSpeedForClassKeyword == maxKH.length - fmaxKH.length) && _hasClassKeyword ) {
                        code = this.insertCodeAtIndex( '});', code, i, 1 );
                        i += 2; // i下标前进2位
                     
                        // class关键字的范围结束, 则该标识赋予false
                        _hasClassKeyword = false;
                        inClass = false;
                        inInterface = false;
                        //Class.log('}' + _maxKHSpeedForClassKeyword);
                        _maxKHSpeedForClassKeyword = null;
                    }
                }
            } else if ( ')' === ch ) {
                if ( 0 === sinYH.length && 0 === dblYH.length && 0 === regKH.length ) {
                    fminKH.push( i );
                    
                    // 结束括号多余起始括号,则视为错误
                    if ( fminKH.length > minKH.length ) {
                        errIdx = i;
                        errMsg = '括号不匹配, 多余的 ) 号';
                        break;
                    }
                    
                    //minKH.pop();
                }
            } else if ( ']' === ch ) {
                if ( 0 === sinYH.length && 0 === dblYH.length && 0 === regKH.length ) {
                    fmidKH.push( i );
                    
                    // 结束括号多余起始括号,则视为错误
                    if ( fmidKH.length > midKH.length ) {
                        errIdx = i;
                        errMsg = '括号不匹配, 多余的 ] 号';
                        break;
                    }
                    
                    //midKH.pop();
                } else if ( regKH.length ) {
                    regMidKH.pop();
                }
            }
            
            // # 若在字符串或者正则中出现换行符号, 视为语法错误
            else if ( '\n' === ch && ( sinYH.length || dblYH.length || regKH.length ) ) {
                // 引号中出现了换行
                break;
            }
            
            // # 单引号 | 双引号 | 正则
            else if ( "'" === ch ) {
                // 符号不在 双引号, 和正则表达式中, 且不属于转义字符, 方为有效符号
                if ( 0 === dblYH.length && 0 === regKH.length ) {
                    ii = i - 1, count = 0;
                    while ( code.charAt( ii-- ) === '\\' ) count++;
                    if ( count % 2 == 0 ){ // 'aa\\'' 处理重复转义符号
                        sinYH.length ? sinYH.pop() : sinYH.push( i );
                    }    
                }
            } else if ( '"' === ch ) {
                // 符号不在 单引号, 和正则表达式中, 且不属于转义字符, 方为有效符号
                if ( 0 === sinYH.length && 0 === regKH.length ) {
                    ii = i - 1, count = 0;
                    while ( code.charAt( ii-- ) === '\\' ) count++;
                    if ( count % 2 == 0 ) { // "aa\\""
                        dblYH.length ? dblYH.pop() : dblYH.push( i );
                    } 
                }
            } else if ( '/' === ch && (!/[a-z0-9_$)]/i.test( lastCh ) || regKH.length) ) {
                // 符号不在 单引号, 双引号中, 不在正则内部的中括号中, 且不属于转义字符, 方为有效符号
                if ( 0 === sinYH.length && 0 === dblYH.length && 0 === regMidKH.length ) {
                    ii = i - 1, count = 0;
                    while ( code.charAt( ii-- ) === '\\' ) count++;
                    if ( count % 2 == 0 ) { // /aa\\//
                        regKH.length ? regKH.pop() : regKH.push( i );
                    } 
                }
            }
            
            // # 关键字标识符, 不在 单引号 & 双引号 & 正则内, 且在可用作标识符
            var flg = true;
            if ( 0 === sinYH.length && 0 === dblYH.length && 0 === regKH.length ) {
                if ( /[a-z0-9_$.]/i.test( ch ) && keyword != 'super' ) {
                    if ( (keyword.length == 0 || i - keywordIndex == keyword.length) ) {
                        if ( 0 != keyword.length ) {
                            keyword += ch;    // 追加合法标识符
                        } else if ( /[^0-9.]/.test( ch ) ) {
                            keyword = ch;
                            keywordIndex = i; // 记录关键字的起始位置
                        }
                        flg = false;
                    } else {
                        i -= 1;
                        srcIdx -= 1;
                    }
                }
                
                if ( flg && keyword.length ) {
                    // 若存在关键字标识符, 则分析是甚么标识符
                    
                    // 是否为js语法关键字
                    if ( _keywordReg.test( keyword ) ) {
                        logFlag > 1 && Class.log( '%c 关键字:' + keyword, 'color:blue' );
                        
                        // 关键字处理
                        tmpCode = this.processKeyword( keyword, code, keywordIndex );
                        i += tmpCode.length - code.length;
                        code = tmpCode;
                        prevKeyword = keyword;
                        keyword = '';
                        keywordIndex = -1;
                    }
                    // 检测方法标识符
                    else if ( /[\s(]/.test( ch ) && (_maxKHSpeedForClassKeyword == maxKH.length - fmaxKH.length - 1) ) {
                        keyword += ch; // 追加合法标识符
                        if ( /^[a-z0-9_$\s]+\($/i.test( keyword ) ) {
                            if ( inClass ) {
                                logFlag > 1 && Class.log( '%c 成员方法:' + keyword, 'color:#8A2BE2' );
                                
                                // 处理成员方法
                                tmpCode = this.processFunction( keyword.substring( 0, keyword.length - 1 ).trim(), code, keywordIndex );
                                i += tmpCode.length - code.length;
                                code = tmpCode;
                            } else if ( inInterface ) {
                                logFlag > 1 && Class.log( '%c 接口方法:' + keyword, 'color:red' );
                                
                                // 处理接口方法
                                //var tmpCode = this.processItfsFunction( keyword.substring( 0, keyword.length - 1 ).trim(), code, keywordIndex );
                                tmpCode = this.processItfsFunction( keyword.substring( 0, keyword.length - 1 ).trim(), code, keywordIndex, i );
                                i += tmpCode.length - code.length;
                                code = tmpCode;
                            }
                        }
                    }
                    // 纯标识符
                    else {
                        logFlag > 1 && Class.log( '%c 标识符:' + keyword, 'color:green' );
                        
                        // 标识符处理
                        tmpCode = this.processIdentifier( keyword, prevKeyword, code, keywordIndex );
                        i += tmpCode.length - code.length;
                        code = tmpCode;
                        prevKeyword = '';
                        keyword = '';
                        keywordIndex = -1;
                    }
                }
            }
            
            if ( /[^\s]/i.test( ch ) )
                lastCh = ch;
        }

        // 检测代码是否有错误 
        switch ( true ) {
        case errIdx      >= 0 : break;
        case sinYH.length > 0 : errMsg = "括号不匹配, 缺少结束的 ' 号"; errIdx = errIdx >=0 ? errIdx : sinYH; break;
        case dblYH.length > 0 : errMsg = '括号不匹配, 缺少结束的 " 号'; errIdx = errIdx >=0 ? errIdx : dblYH; break;
        case regKH.length > 0 : errMsg = '括号不匹配, 缺少结束的 / 号'; errIdx = errIdx >=0 ? errIdx : regKH; break;
        
        case midKH.length > fmidKH.length : errMsg = '括号不匹配, 缺少结束的 ] 号'; errIdx = midKH[ midKH.length - 1 ]; break;
        case minKH.length > fminKH.length : errMsg = '括号不匹配, 缺少结束的 ) 号'; errIdx = minKH[ minKH.length - 1 ]; break;
        case maxKH.length > fmaxKH.length : errMsg = '括号不匹配, 缺少结束的 } 号'; errIdx = maxKH[ maxKH.length - 1 ]; break;
        
        case midKH.length < fmidKH.length : errMsg = '括号不匹配, 多余的 ] 号'; errIdx = fmidKH[ fmidKH.length - 1 ]; break;
        case minKH.length < fminKH.length : errMsg = '括号不匹配, 多余的 ) 号'; errIdx = fminKH[ fminKH.length - 1 ]; break;
        case maxKH.length < fmaxKH.length : errMsg = '括号不匹配, 多余的 } 号'; errIdx = fmaxKH[ fmaxKH.length - 1 ]; break;
        }

        // 根据错误位置, 指出错误位置前后代码
        if ( errIdx >= 0 ) {
            // 截取错误断点之前的代码
            tmpCode     = code.substring( 0, errIdx ) || '',
            errLine     = tmpCode.split( /\n/ ).length, // 错误行数
            idx         = tmpCode.lastIndexOf( '\n' ),
            errColumn   = errIdx - idx,// 错误列数
            errCode     = '';
            
            // 输出错误代码片段, 错误位置的行开头到错误断点后20个字符
            errCode = tmpCode.substring( idx + 1, errIdx )
                      + '>>> ' + code.substring( errIdx, errIdx + 1 ) + ' <<<'
                      + code.substring( errIdx + 1, errIdx + 21 );
            
            Class.log( '[编译] - 编译失败' );
            
            buildErrorCallback && buildErrorCallback( [ errLine, errColumn, errMsg, errCode ] );
            return [ errLine, errColumn, errMsg, errCode ];
        }
        
        Class.log( '[编译] - 编译完毕' );
        
        buildSuccessCallback && buildSuccessCallback( code );
        return code;
    };
    
    // 获取带颜色的代码,通过代码中插入html标签
    this.coloring = function( code ) {
        
        // 关键字
        code = code.replace(
                /\b(package|import|class|interface|extends|implements|new|this|super|var|let|const|function|do|while|for|in|continue|break|switch|case|default|return|throw|try|catch|finally|delete|true|false)\b/g,
                function( v1, v2, v3 ) {
                    return '<span class=code-keyword>' + v1 + '</span>';
                } );
        
        // 字符串
        code = code.replace( /('[^']*'|"[^"]*")/g, function( v1, v2, v3 ) {
                    return '<span class=code-exp-string>' + v1 + '</span>';
                } );
        
        // 注释
        code = code.replace( /(\/\*([\s\S]*?)\*\/|\/\/[^\n]*(?:\n|$))/g, function( v1, v2, v3 ) {
                    var prefix = '*' == v3 && v3.charAt( 0 ) ? '<span class=code-doc-comments>' : '<span class=code-comments>';
                    return prefix + v1 + '</span>';
                } );
        
        return code;
    };
} );


/**
 * 关键字处理
 * @param keyword       - 关键字
 * @param code          - 源码
 * @param index         - 关键字在源码中的起始位置
 * @return newKeyword   - 返回新的关键字
 */
//function Filter() {
//    var keys = {};
//    
//    // 增加一个过滤
//    this.add = function( key, handler ) {
//        var handlers = keys[ key ];
//        if ( !handlers ) {
//            handlers = [];
//            keys[ key ] = handlers;
//        }
//        handlers.push( handler );
//    };
//    
//    // 触发过滤器
//    this.trigger = function( key ) {
//        var handlers = keys[ key ];
//        if ( handlers ) {
//            for ( var i = 0, l = handlers.length; i < l; i++ ) {
//                var handler = handlers[ i ];
//                if ( handler )
//                    handler.apply( this, arguments );
//            }
//        }
//    };
//    
//    // 删除一个过滤, 或者一组过滤(未指定handler时)
//    this.remove = function( key, handler ) {
//        var handlers = keys[ key ];
//        if ( handlers ) {
//            if ( handler ) {
//                for ( var i = 0, l = handlers.length; i < l; i++ ) {
//                    if ( handler == handlers[ i ] )
//                        handlers.splice( 1, 1 );
//                }
//            } else {
//                keys[ key ] = null;
//                delete keys[ key ];
//            }
//        }
//    };
//}


//var codeText = '';
//function loadFile( path ) {
//  var xhr = new XMLHttpRequest();
//  var okFn, noFn, doneFn;
//  var xhrProxy = {
//          xhr : xhr,
//          ok : function( okCallback ) {
//              okFn = okCallback;
//              return this;
//          },
//          no : function( noCallback ) {
//              noFn = noCallback;
//              return this;
//          },
//          done : function( doneCallback ) {
//              doneFn = doneCallback;
//              return this;
//          },
//          cancel : function() {
//              okFn = noFn = doneFn = null;
//          }
//  };
//  
//  setTimeout( function() {
//      xhr.open( 'GET', path, true );
//      xhr.onreadystatechange = function() {
//          if ( 4 !== this.readyState )
//              return;
//          
//          var status = this.status;
//          var respText = this.responseText;
//          
//          doneFn && doneFn( respText, status );
//          
//          if ( status >= 200 && status < 300 || status === 304 || status === 0 || status === 1223 )
//              okFn && okFn( respText, status );
//          else
//              noFn && noFn( respText, status );
//          
//          doneFn = okFn = noFn = null;
//      };
//      xhr.send();
//      xhr = xhrProxy = null;
//  }, 0 );
//  
//  return xhrProxy;
//}
//
///**
//* 检测代码位置
//*/
//function checkCodeWithIndex( code, index, newCodeWrap ) {
//newCodeWrap.innerHTML = code.substring( 0, index )
//   + '<span style="color:red;background-color:gray;">'
//   + code.charAt( index ) + '</span>' + code.substring( index + 1 );
//}
//
//window.onload = function() {
//  
//  loadFile( 'Dog.js' ).ok( function( content, status ) {
//
//      codeText = content.replace( /\r\n/g, '\n' ); // 换行统一为 \n
//
//      var srcCodeWrap = document.getElementById( 'srcCodeWrap' );
//      var newCodeWrap = document.getElementById( 'newCodeWrap' );
//      
//      srcCodeWrap.innerHTML = codeText;
//      newCodeWrap.innerHTML = codeText;
//      
//      // 创建javascript编译器
//      window.compiler = new ECMAScript6Compiler( 'aaa' );
//      
//      compiler.build( codeText, function( code ) { // 检测成功回调
//          // newCodeWrap.innerHTML = zhuanhuan( code );
//          
//          ParseClass( code );
//          
//      }, function( errLine, errColumn ) { // 检测失败回调
//          
//      }, function( code, index ) { // 检测每个字符的回调
//          checkCodeWithIndex( code, index, newCodeWrap );
//      } );
//      
//  } ).no( function( content, status ) {
//      
//      console.log( '文件载入失败' );
//      
//  } ).done( function( content, status ) {
//      
//      console.log( '载入文件操作完成' );
//      
//  } );
//  
//};
