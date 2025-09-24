import express from "express";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import * as router from './router.js';
import Storage from "./storage.js";
import RecurringStorage from "./storage_recurring.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// use your own parameters for database
const mysqlConfig = {
	"connectionLimit": 10,
	"host": "localhost",
	"user": "root",
	"password": "",
	"database": "scheduler_howto_node"
};

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.dhtmlx.com", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://cdn.dhtmlx.com", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://cdn.dhtmlx.com"],
    },
  })
);
// scheduler sends application/x-www-form-urlencoded requests,
app.use(express.urlencoded({ extended: true }));

// you'll need these headers if your API is deployed on a different domain than a public page
// in production system you could set Access-Control-Allow-Origin to your domains
// or drop this expression - by default CORS security is turned on in browsers
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Methods", "*");
	next();
});

// return static pages from "./public" directory
app.use(express.static(path.join(__dirname, "public")));

// open connection to mysql
const connectionPool = mysql.createPool(mysqlConfig);

// add listeners to basic CRUD requests
const storage = new Storage(connectionPool);
// Setup routes
router.setRoutes(app, "/events", storage);

// add listeners to basic CRUD with recurring events support
const recurringEventsStorage = new RecurringStorage(connectionPool);
router.setRoutes(app, "/recurring_events", recurringEventsStorage)

// start server
app.listen(port, () => {
	console.log("Server is running on port " + port + "...");
});