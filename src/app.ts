/*
 * Express App
 */

import * as express from "express";
import * as compression from "compression";  // compresses requests
import * as bodyParser from "body-parser";
import * as logger from "morgan";
import * as path from "path";
import * as favicon from "serve-favicon";
import * as session from "express-session";
// import SfmcApiDemoRoutes from './SfmcApiDemoRoutes';
import SfmcAppDemoRoutes from './SfmcAppDemoRoutes';
import Utils from './Utils';

const PORT = process.env.PORT || 5000

// Create & configure Express server
const app = express();

// Express configuration
app.set("port", PORT);
app.set("views", path.join(__dirname, "../views"));
app.set('view engine', 'ejs');

// Use helmet. More info: https://expressjs.com/en/advanced/best-practice-security.html
var helmet = require('helmet')
app.use(helmet());
// Allow X-Frame from Marketing Cloud. Sets "X-Frame-Options: ALLOW-FROM http://exacttarget.com".
app.use(helmet.frameguard({
    action: 'allow-from',
    domain: 'http://exacttarget.com'
  }))

app.use(session({
    name: 'server-session-cookie-id',
    secret: 'sanagama-df18',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(compression());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Setup static paths
app.use(express.static(path.join(__dirname, "../static")));
app.use(favicon(path.join(__dirname,'../static','images','favicons', 'favicon.ico')));

// Routes: pages
app.get("/", function (req, res) {
  if (req.query.code === undefined) {
    const redirectUri = `https://${process.env.BASE_URL}.auth.marketingcloudapis.com/v2/authorize?response_type=code&client_id=${process.env.CLIENTID}&redirect_uri=${process.env.REDIRECT_URL}`;

    res.redirect(redirectUri);
  } else {
    res.render("apidemo.ejs", {
      authorization_code: req.query.code,
      tssd: req.query.tssd ? req.query.tssd : process.env.BASE_URL,
    });
  }
});



 app.get('/appdemo', function(req, res) { Utils.initSampleDataAndRenderView(req, res, 'appdemo.ejs') });

//const apiDemoRoutes = new SfmcApiDemoRoutes();
const appDemoRoutes = new SfmcAppDemoRoutes();

// Routes: used by this demo app that internally call Marketing Cloud REST APIs
//app.get('/apidemooauthtoken', function(req, res) {
 // apiDemoRoutes.getOAuthAccessToken(req, res); });

// app.get('/loaddata', function(req, res) {
//   apiDemoRoutes.loadData(req, res); });
    
// Routes: called when this demo app runs as a Marketing Cloud app in an IFRAME in the Marketing Cloud web UI
  app.get('/appdemoauthtoken', function(req, res) {
  appDemoRoutes.getOAuthAccessToken(req, res); });

  // app.post("/datafoldercheck", function (req, res) {
  //   appDemoRoutes.dataFolderCheck(req, res);
  // });

  // app.post("/retrievingdataextensionfolderid", function (req, res) {
  //   appDemoRoutes.retrievingDataExtensionFolderID(req, res);
  // });

  // app.post("/createsparkpostintegrationfolder", function (req, res) {
  //   appDemoRoutes.createSparkpostIntegrationFolder(req, res);
  // });

  // app.post("/domainconfigurationde", function (req, res) {
  //   appDemoRoutes.domainConfigurationDE(req, res);
  // });

// // Marketing Cloud POSTs the JWT to the '/login' endpoint when a user logs in
// app.post('/login', function(req, res) {
//   appDemoRoutes.login(req, res); });

// // Marketing Cloud POSTs to the '/logout' endpoint when a user logs out
// app.post('/logout', function(req, res) {
//   appDemoRoutes.logout(req, res); });

module.exports = app;