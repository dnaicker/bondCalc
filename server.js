// server.js
// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const open = require("open");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// init sqlite db
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {

    db.run(
      "CREATE TABLE Calculations (id INTEGER PRIMARY KEY AUTOINCREMENT, calculations TEXT)"
    );
  } else {
    console.log('Database "Calculations" ready to go!');
    db.each("SELECT * from Calculations", (err, row) => {

    });
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

app.get("/getCalculations", (request, response) => {
  db.all("SELECT * from Calculations", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

app.post("/addCalculations", (request, response) => {

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    const cleansedCalc = cleanseString(JSON.stringify(request.body.calculations));
    db.run(`INSERT INTO Calculations (calculations) VALUES (?)`, cleansedCalc, error => {
      if (error) {
        console.log(error)
        response.send({ message: "error!" });
      } else {
        console.log('success')
        response.send({ message: "success" });
      }
    });
  }
});

// helper function that prevents html/css/script malice
const cleanseString = function (string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port http://localhost:${listener.address().port}`);
  open('http://localhost:' + listener.address().port)
});