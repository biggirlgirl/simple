/**
 * Created by Administrator on 2016/11/17.
 */
//对用户登录和注册的逻辑进行设计
    //   1. 首先引用数据库连接文件
var mongo = require('./db');
//2.创建一个user类，在这里面对登录和注册进行设计
//user类的主要功能就是为了完成新增和查询，那么它应该是针对
//用户信息（users集合）进行的
function User (user) {
    this.name=user.name;
    this.password=user.password;
    this.email=user.email;
}
module.exports=User;
//保存用户信息的save方法
//1.打开数据库
//2.将用户信息放到数据库，存放起来
User.prototype.save=function (callback) {
    //接收表单数据，保存user对象
    var user={
        name:this.name,
        password:this.password,
        email:this.email
    }
    //使用open方法打开数据库
    mongo.open(function (err,db) {
        if (err){
          return callback(err);
        }
        db.collection('users',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
        //    将用户的信息存放到users集合中
            collection.insert(user,{safe:true},function (err,user) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                return callback(user[0]);//返回注册成功的用户名
            })
        })
    })
}
//根据名称获取用户信息的get方法，登录
User.get=function (name,callback) {
//    打开数据库
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('users',function (err,collection) {
            if(err){
               mongo.close();
                return callback(err);
            }
            collection.findOne({name:name},function (err,user) {
                if(err){
                    return callback(err);
                }
                callback(null,user);//成功返回查询数据
            })
        })
    })
}