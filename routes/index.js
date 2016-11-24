var User=require('../models/user');
var Post=require('../models/post');
//引入加密模块
var crypto=require('crypto');
//引入留言需要的comment类
var Comment=require('../models/comment');
//引入multer插件
var multer=require('multer');
var storage=multer.diskStorage({
  //这个是上传图片的地址
  destination:function (req,file,cb) {
    cb(null,'./public/images')
  },
  //上传到服务器上图片的名字
  filename:function (req,file,cb) {
    cb(null,file.originalname)
  }
})
var upload=multer({storage:storage,size:10225});

//一个权限的问题
//1.用户未登录的情况下，是无法访问/post,/logout的
//2.用户在登陆的情况下，是无法访问/login,/reg的
//那么，如何才能完成这个权限的问题
function checkLogin(req,res,next) {
if(!req.session.user){
  req.flash('error','未登录');
  res.redirect('/login');
}
  next();

}
function checkNotLogin(req,res,next) {
if(req.session.user){
  req.flash('error','已登录');
  res.redirect('back');
}
next();
}
module.exports=function (app) {
  //首页

  app.get('/',function (req,res) {
    var page=parseInt(req.query.p)||1;
    Post.getTen(null,page,function (err,posts,total) {
      if(err){
        posts=[];
      }
      res.render('index',{
        title:'首页',
        user:req.session.user,
        page:page,
        posts:posts,
        isFirstPage:(page - 1)==0,
       isLastPage:(page -1) * 10 + posts.length == total,
        success:req.flash('success').toString(),
          error:req.flash('error').toString()
      })

    })
    // Post.getAll(null,function (err,posts) {
    //   if(err){
    //     posts=[];
    //   }
    //   res.render('index',{
    //     title:'主页',
    //     user:req.session.user,
    //     posts:posts,
    //     success:req.flash('success').toString(),
    //     error:req.flash('error').toString(),
    //   });
    // });

  })
  //注册
  app.get('get',checkNotLogin);
  app.get('/reg',function (req,res) {
    res.render('reg',{
      title:'注册',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  })
  //注册行为
  app.post('/reg',checkNotLogin);
  app.post('/reg',function (req,res) {
  //  1.收集用户的注册信息
  //  2.将用户注册信息传入到user类中，实例化一个
  //  3.调用user.save方法将数据存放到users集合中
  //  4.跳转到登录页面完成
  //  5.可以给用户一个提示
    console.log(req.body);
    var name=req.body.name;
    var password=req.body.password;
    var password_re=req.body['password-repeat'];
    var email=req.body.email;
    //如果未填写的情况下，提示用户
    if (name=='' || password == '' || email==''){
      req.flash('error','请正确填写信息');
      return res.redirect('/reg');
    }
    //1.首先检查一下两次密码是否一样

    if(password_re!=password){
      //先保存一下错误信息
      req.flash('error','用户两次输入的密码不一样');
      return res.redirect('/reg');
    }
    //2.对密码进行加密处理
    var md5 =crypto.createHash('md5');
    var password=md5.update(req.body.password).digest('hex');
   // console.log(password);
   //3.可以实例化user对象
    var newUser=new User({
      name:name,
      password:password,
      email:email
    });
    //4.检查用户名是否存在
    User.get(newUser.name,function (err,user) {
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      if(user){
        req.flash('error','用户名已存在');
        return res.redirect('/reg');
      }
      newUser.save(function (err,user) {
        if(err){
          req.flash('error',err);
        }
        req.session.user=newUser;
        req.flash('success','注册成功');
        res.redirect('/');
      })
    })

  })
  //登录
  app.get('/login',checkNotLogin);
  app.get('/login',function (req,res) {
    res.render('login',{
      title:'登录',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  })
  //登录行为
  app.post('/login',checkNotLogin);
  app.post('/login',function (req,res) {
  //1.检查下用户名
    //2.检查下密码
    //3.存储到session中用户的登录信息
    //4.跳转到首页
    var md5 = crypto.createHash('md5');
     var  password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!');
        return res.redirect('/login');
      }
      if (user.password != password) {
        req.flash('error', '密码错误!');
        return res.redirect('/login');
      }
      req.session.user = user;
      req.flash('success', '登陆成功!');
      res.redirect('/');
    });
  })
  //发表
  app.get('/post',checkLogin);
  app.get('/post',function (req,res) {
    res.render('post',{
      title:'发表',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  })
  //发表行为
  app.post('/post',checkLogin);
  app.post('/post',function (req,res) {
    // console.log(req.body);
    if(req.body.title=='' || req.body.post==''){
      req.flash('error','请正确填写信息');
      return res.redirect('/post');
    }
    //添加标签信息
    var tags=[req.body.tag1,req.body.tag2,req.body.tag3];
    var currentuser=req.session.user;
    var post=new Post(currentuser.name,req.body.title,tags,req.body.post);

    post.save(function (err) {
      if(err){
        req.flash('error',err);
      }
      // req.session.post=post;
      req.flash('success','发表成功');
      res.redirect('/');
    })
  })
  //上传
  app.get('/upload',checkLogin);
  app.get('/upload',function (req,res) {
    res.render('upload',{
      title:'文件上传',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()

    })
  })
  //上传行为
  app.post('/upload',checkLogin);
  app.post('/upload',upload.array('field1',5),function (req,res) {
    req.flash('success','文件保存成功');
    res.redirect('/upload');
  })
  //退出
  app.get('/logout',checkLogin);
  app.get('/logout',function (req,res) {
   //1.清除session
    //2.给用户提示
    //3.跳转到首页
    req.session.user=null;
    req.flash('success','成功退出');
    res.redirect('/');
  })

//  点击用户名，可以看到用户发布的所有文章
  //   app.get('/u/:name',function (req,res) {
//     //req.params.name就可以获取到get请求中的参数
//   //  1.检查下用户名是否存在
//     User.get(req.params.name,function (err,user) {
//       if(!user){
//         req.flash('error','用户名不存在');
//         return res.redirect('/');
//       }
//     //  2.使用post的getall方法来获取用户对应的文章
//       Post.getAll(user.name,function (err,posts) {
//         if(err){
//           req.flash('error','没有找到用户文章');
//           return res.redirect('/')
//         }
//         res.render('user',{
//           title:user.name,
//           posts:posts,
//           user:req.session.user,
//           success:req.flash('success').toString(),
//           error:req.flash('error').toString()
//         })
//       })
//     })
//   })
  app.get('/u/:name', function (req, res) {
    var page = parseInt(req.query.p) || 1;
    //检查用户是否存在
    User.get(req.params.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!');
        return res.redirect('/');
      }
      //查询并返回该用户第 page 页的 10 篇文章
      Post.getTen(user.name, page, function (err, posts, total) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        res.render('user', {
          title: user.name,
          posts: posts,
          page: page,
          isFirstPage: (page - 1) == 0,
          isLastPage: ((page - 1) * 10 + posts.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });
  });


//  文章详情页面
  app.get('/u/:name/:minute/:title', function (req, res) {
    console.log(req.params.name);
    console.log(req.params.minute);
    console.log(req.params.title);
    Post.getOne(req.params.name, req.params.minute, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('article', {
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.post('/comment/:name/:minute/:title',function (req,res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) +
            "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ?
            '0' + date.getMinutes() : date.getMinutes());
    var comment={
      name:req.body.name,
      time:time,
      content:req.body.content
    }
    var newContent=new Comment(req.params.name,req.params.minute,req.params.title,comment);
    newContent.save(function (err) {
      if(err){
        req.flash('error',err);
        return res.redirect('back');
      }
      req.flash('success','留言成功');
      res.redirect('back');
    })
  })

//  文章编辑
  app.get('/edit/:name/:minute/:title',checkLogin)
  app.get('/edit/:name/:minute/:title',function (req,res) {
          var currentUser=req.session.user;
          Post.edit(currentUser.name,req.params.minute,req.params.title,function (err,post) {
            if(err){
              req.flash('error',err);
              return res.redirect('back');
            }
            res.render('edit',{
              title:'编辑文章',
              user:req.session.user,
              post:post,
              success:req.flash('success').toString(),
              error:req.flash('error').toString()

            })
          })
  })

//  文章编辑行为
  app.post('/edit/:name/:minute/:title',checkLogin);
  app.post('/edit/:name/:minute/:title',function (req,res) {
    Post.update(req.params.name,req.params.minute,req.params.title,req.body.post,function (err) {
       var url=encodeURI('/u/'+req.params.name+'/'+req.params.minute+'/'+req.params.title);
      if(err){
        req.flash('error',err);
        return res.redirect(url);
      }
      req.flash('success','编辑成功');
      return res.redirect(url);
    })
  })

//  文章删除行为
  app.get('/remove/:name/:minute/:title',checkLogin);
  app.get('/remove/:name/:minute/:title',function (req,res) {
    Post.remove(req.params.name,req.params.minute,req.params.title,function (err) {
      if(err){
        req.flash('error',err);
        return res.redirect('back');
      }
      req.flash('success','删除成功');
      res.redirect('/');
    })

  })
//  文章存档
  app.get('/archive',function (req,res) {
    Post.getArchive(function (err,posts) {
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('archive',{
        title:'存档',
        posts:posts,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      })
    })
  })
  
  app.get('/tags',function (req,res) {
    Post.getTags(function (err,posts) {
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('tags',{
          title:'标签',
          posts:posts,
          user:req.session.user,
          success:req.flash('success').toString(),
          error:req.flash('error').toString()
      })
    })
  })
  //标签对应的文章集合
  app.get('/tags/:tag',function (req,res) {
    Post.getTag(req.params.tag,function (err,posts) {
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('tag',{
        title:'TAG:'+req.params.tag,
        posts:posts,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()

      })
    })
  })

//  搜索
  app.get('/search',function (req,res) {
    Post.search(req.query.keyword,function (err,posts) {
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('search',{
        title:"SEARCH:" + req.query.keyword,
        posts:posts,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      })
    })
  })
  
}
