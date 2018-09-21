// Dog.js
import Animal;
import IMyItface;

class Dog extends Animal implements IMyItface {
    
    var a = 'aaa';          // 私有成员
    this.name = 'dog';      // 公有成员, 实例通过 this.name 访问
    
    Dog( age, sex, name ) {
        super( age, sex );
        
        this.name = name;
    }
    
    say( msg ) {
//        try{
//            throw new Error('xxx');
//        } catch ( e ) {
//            Class.printError( e );
//        }
        return this.name + ',' + super( msg );   // super(...) 调用父类同名方法
    }
    
    method1() {
        return 'method1 call ' + IMyItface.PROPERTY1;
    }
      
    method2() {
        return 'method2 call ' + IMyItface.PROPERTY2;
    }
      
}