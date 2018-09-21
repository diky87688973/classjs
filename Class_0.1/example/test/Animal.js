// Animal.js
class Animal {

    this.age = 0;
    this.sex = '未知';
    
    Animal( age, sex ) {
        super();        // 调用父类构造方法

        this.age = age;
        this.sex = sex;
    }

    say( msg ) {
        return this.age + ',' + this.sex + ',say:' + msg;
    }
}