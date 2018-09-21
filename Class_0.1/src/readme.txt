Improt( 'Class.aaa.bbb.Class1' );

'Class.aaa.bbb.Class1' --- 映射成 ---> home/src/aaa/bbb/Class1.js
所有类名以Class开头则类文件必须在当前src目录下
即：Class 映射 src 目录

其他目录下的类文件，需要设置classpath指向其目标目录才能正确加载到类文件