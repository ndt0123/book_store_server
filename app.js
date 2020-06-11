var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var bodyParser = require("body-parser");

var allBookRouter = require('./routes/all_books');
var bookDetailsRouter = require('./routes/book_details');
var searching = require('./routes/searching');
var auth = require('./routes/auth');
var newBook = require('./routes/new_book');
var accountInfo = require('./routes/account_info');
var message = require('./routes/message');
var messageSocket = require('./routes/message_socket');
var notification = require('./routes/notification');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  resave: true, 
  saveUninitialized: true, 
  secret: 'somesecret', 
  cookie: { maxAge: 60000 }})
);


app.use('/home', allBookRouter);
app.use('/book-details', bookDetailsRouter);
app.use('/searching', searching);
app.use('/auth', auth);
app.use('/new-book', newBook);
app.use('/account-info', accountInfo);
app.use('/message', message);
app.use('/message-socket', messageSocket);
app.use('/notification', notification);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
