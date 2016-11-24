/**
 * Created by Administrator on 2016/11/18.
 */
var mongo=require('./db');
var markdown=require('markdown').markdown;
function  Post(name,title,tags,post) {
    this.name=name;
    this.title=title;
    //接收一下标签信息
    this.tags=tags;
    this.post=post
    // this.post=post.replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
module.exports=Post;
Post.prototype.save=function (callback) {
    var date=new Date();
    var time={
        data:date,
        year:date.getFullYear(),
        month:date.getFullYear()+'-'+(date.getMonth()+1),
        day:date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
        minute:date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+''+
        date.getHours()+':'+(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes()+':'+date.getSeconds())
    }
    var post={
        name:this.name,
        time:time,
        title:this.title,
        tags:this.tags,
        post:this.post,
        comments:[],
        //新增访问量
        pv:0

    }
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.insert(post,{safe:true},function (err) {
                mongo.close();
                if(err){
                    return callback (err);
                }
                callback (null);
            })
        })
    })

}

Post.getTen=function (name,page,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            var query={};
            if(name){
                query.name=name;
            }
            collection.count(query,function (err,total) {
                collection.find(query,{
                    skip:(page - 1) * 10,
                    limit:10
                }).sort({
                    time:-1
                }).toArray(function (err,docs) {
                    mongo.close();
                    if(err){
                        return callback(err);
                    }
                    //得到的是前十篇文章和文章的总数量
                    docs.forEach(function (doc) {
                        doc.post=markdown.toHTML(doc.post);
                    })
                    callback(null,docs,total);
                })
            })
            // collection.find(query).sort({
            //     time:-1
            // }).toArray(function (err,docs) {
            //     mongo.close();
            //     if(err){
            //         return callback(err);
            //     }
            //     docs.forEach(function (doc) {
            //         doc.post = markdown.toHTML(doc.post);
            //     })
            //     callback(null,docs);
            // })
        })
    })
}

//可以根据用户名，发布时间，标题，来查询某一篇具体的文章
Post.getOne = function(name,minute,title,callback){
    //打开数据库
    console.log(name+'/'+minute+'/'+title);
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取post集合
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            //可以根据用户名、发表日期以及文章名进行查询
            collection.findOne({
                "name":name,
                "time.minute":minute,
                "title":title
            },function(err,doc){
                if(err){
                    mongo.close();
                    callback(err);
                }
                //增加访问量的代码
                if(doc){
                    collection.update({
                        "name":name,
                        "time.minute":minute,
                        "title":title
                    },{
                        $inc:{"pv":1}
                    },function (err) {
                        mongo.close();
                        if(err){
                            return callback(err);
                        }
                    });
                    //解析markdown为HTML
                    console.log(doc);
                    doc.post = markdown.toHTML(doc.post);
                    // doc.post=markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content=markdown.toHTML(comment.content)
                    });
                    callback(null,doc);//返回查询的一篇文章
                }
            })
        })
    })
}
//为文章添加编辑功能，返回markdown格式的原始内容
Post.edit=function (name,minute,title,callback) {
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.findOne({
                "name":name,
                "time.minute":minute,
                "title":title
            },function (err,doc) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                return callback(null,doc);
            })
        })
    })
}

//修改操作
Post.update=function (name,minute,title,post,callback) {
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
            },{$set:{post:post}},function (err) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}
Post.remove=function (name,minute,title,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err)
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err)
            }
            collection.remove({
                "name":name,
                "time.minute":minute,
                "title":title
            },{
                w:1
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
//返回包含用户名，发布时间，标题的文章
Post.getArchive=function (callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.find({},{
                "name":1,
                "time":1,
                "title":1
            }).sort({
               time:-1
            }).toArray(function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
}

//返回所有标签
Post.getTags=function (callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.distinct("tags",function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })

        })
    })
}

Post.getTag=function (tag,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.find({
                "tags":tag
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
}

Post.search=function (keyword,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            var pattern=new RegExp(keyword,'i');
            collection.find({
                title:pattern,
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}