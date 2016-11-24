/**
 * Created by Administrator on 2016/11/22.
 */
var mongo=require('./db');
//设计留言处理对象
function  Comment(name,minute,title,comment) {
      this.name=name;
      this.minute=minute;
    this.title=title;
      this.comment=comment;
}
module.exports=Comment;
Comment.prototype.save=function (callback) {
   var name=this.name;
    var minute=this.minute;
    var title=this.title;
    var comment=this.comment;
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
               return callback(err);
            }
            collection.update({
                "name":name,
                "time.minute":minute,
                "title":title
            },{
                $push:{"comments":comment}
            },function (err) {
                mongo.close();
                if(err){
                   return callback(err);
                }
                callback(null);
            })
        })
    })
}
