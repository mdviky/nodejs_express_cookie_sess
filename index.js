var express = require('express');
var app = express();

var cookieSession = require('cookie-session');
var mysql = require("mysql");
var http = require('http').Server(app);
var io = require('socket.io')(http);

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(function (req, res, next) {
    console.log('Time: %d', Date.now());
    //res.locals.user = req.session;
    //res.locals.authenticated = ! req.user.anonymous;
    next();
});

app.set('trust proxy', 1) // trust first proxy
app.set('view engine', 'ejs')
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
}))
//setting up connection object
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "nodejs_express_cookie_sess"
});
////making the connection 
con.connect(function (err) {
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established');
});
//con.end();

app.get('/', function (req, res, next) {
    //next('/logout');
    // Update views
    //req.session.views = (req.session.views || 0) + 1
    res.render(__dirname + '/index.ejs');
    // Write response
    //res.end(req.session.views + ' views')
})
app.get('/login', function (req, res, next) {
    // Update views
    //req.session.views = (req.session.views || 0) + 1
    res.render(__dirname + '/login.ejs');
    // Write response
    //res.end(req.session.views + ' views')
})
app.post('/register', function (req, res) {
    //console.log(res);
    var mail = req.body.email;
    var pass = req.body.pass;
    var ins_data = {
        id: '',
        email: mail,
        pass: pass,
    }
    con.query('INSERT INTO user SET ?', ins_data, function (error, result) {
        if (!error) {
            console.log(result.insertId);
            res.send('Done!. <a href="/login">Login</a>');
        } else {
            console.log(error);
            console.log("Query failed");
        }
    });
})
app.post('/loginuser', function (req, res) {
    var mail = req.body.email;
    var pass = req.body.pass;
    var ins_data = {
        id: '',
        email: mail,
        pass: pass,
    }
    con.query('SELECT * from user WHERE email = ? AND pass = ?', [mail, pass], function (err, rows, fields) {
        if (!err) {
            console.log('rows : ', rows);
            if (rows.length > 0) {
                //io.emit('rows', JSON.stringify(rows));
                req.session.userinfo = JSON.stringify(rows);
                //res.send(req.session.userinfo);

                res.redirect('users');
                //res.write(JSON.stringify(rows));
                //res.end();
            } else {
                rows = [];
                //io.emit('rows', rows);
                res.write(JSON.stringify(rows));
                res.end();
            }
        } else {
            console.log(err);
            console.log("Query failed");
        }
    });
});
app.get('/users', function (req, res) {

    if (!req.session.userinfo) {
        res.redirect('/');
    } else {
        //console.log(req.session.userinfo);

        var sess = JSON.parse(req.session.userinfo);

        //console.log('sess:', sess);
        //console.log('sess user id:', sess[0].id);

        //Update users table for online status 
        con.query('UPDATE user SET online = ? WHERE id = ?', [1, sess[0].id], function (upd_err, upd_results, fields) {
            if (!upd_err) {
                //console.log(upd_results);

            } else {
//                console.log('upd_err ',upd_err);
  //              console.log("Query failed");
            }
        });

        //console.log(req.session);
        //var html = '<div>test</div>';

        //var err = '';
        //var data = {userinfo: req.session.userinfo};

        //Check who are online
        con.query('SELECT * from user WHERE online = ?', [1], function (err, rows, fields) {
            if (!err) {
                //console.log('online user rows: ',rows);
                if (rows.length > 0) {
                    //io.emit('online_users', JSON.stringify(rows));
                    req.session.online_users = JSON.stringify(rows);
                }
            }
        });
        //console.log(req.session.online_users);
        res.render(__dirname + '/members.ejs', {'userinfo': req.session.userinfo,'online_usr':req.session.online_users});
    }

});

app.get('/logout', function (req, res, next) {
    var sess = JSON.parse(req.session.userinfo);

    console.log('sess:', sess);
    console.log('sess user id:', sess[0].id);

    //Update users table for online status 
    con.query('UPDATE user SET online = ? WHERE id = ?', [0, sess[0].id], function (upd_err, upd_results, fields) {
        if (!upd_err) {
            //console.log(fields);

        } else {
            console.log(upd_err);
            console.log("Query failed");
        }
    });

    req.session.userinfo = null;
    req.session.userinfo = '';
    res.redirect('/');
    //res.send(res.session)
});

app.listen(3000, function () {
    console.log('server runnning at :3000');
})