'use strict';

const fs = require('fs');
const express = require('express');
const pg = require('pg'); // adding pg
const PORT = process.env.PORT || 3000;
const app = express();

// Windows and Linux users: You should have retained the user/password from the pre-work for this course.
// Your OS may require that your conString is composed of additional information including user and password.
// const conString = 'postgres://USER:PASSWORD@HOST:PORT/DBNAME';

// Mac:
const conString = 'postgres://localhost:5432/kilovolt';

const client = new pg.Client( {connectionString: conString });

// REVIEWed: Use the client object to connect to our DB.
client.connect();


// REVIEWed: Install the middleware plugins so that our app can parse the request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));


// REVIEWed: Routes for requesting HTML resources
app.get('/new-article', (request, response) => {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js, if any, is interacting with this particular piece of `server.js`? What part of CRUD, if any, is being enacted/managed by this particular piece of code?
  // This route is returning the new.html file to the browser. So in the full-stack-diagram, this is step 2) request and step 5) response. There is no database calls as of yet (no CRUD), and no interaction with any of the article.js methods. The route requests a resource, which is rendered.
  response.sendFile('new.html', { root: './public' });
});


// REVIEWed: Routes for making API calls to use CRUD Operations on our database
app.get('/articles', (request, response) => {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This route encompasse the following: step 2) request, step 3) select from database (the RETRIEVE portion of CRUD), step 4) return the result to server.js, and 5) respond with the results to the browser. This route is called by the Article.fetchAll() method in article.js.
  client.query('select * from articles')
    .then(function(result) {
      response.send(result.rows);
    })
    .catch(function(err) {
      console.error(err)
      response.status(500).send(err);
    })
});

app.post('/articles', (request, response) => {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This route takes input from the new article form and uses it to insert data into the database. It then responds with either an insert complete console log message or an error. As such, it encompasses these portions of the full stack diagram: 2) request, 3) query (INSERT, or the "Create" portion of CRUD), 4)the result is passed back to server.js, and 5) a response is delivered to the browser. This route is called inside the Article.prototype.insertRecord() method in article.js.
  let SQL = `
    INSERT INTO articles(title, author, author_url, category, published_on, body)
    VALUES ($1, $2, $3, $4, $5, $6);
  `;

  let values = [
    request.body.title,
    request.body.author,
    request.body.author_url,
    request.body.category,
    request.body.published_on,
    request.body.body
  ]

  client.query(SQL, values)
    .then(function() {
      response.send('insert complete!')
    })
    .catch(function(err) {
      console.error(err);
      response.status(500).send(err);
    });
});

app.put('/articles/:id', (request, response) => {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This route is used to update an existing article, so it is managing the UPDATE portion of CRUD. It takes a 2) request, 3) sends an update statement to the database, 4) passes results back to the promise, which 5)responds to the browser with either a success message or an error. This route is called by the Article.prototype.updateRecord() method in article.js.

  let SQL = `UPDATE articles 
              SET title = $1, author=$2, author_url=$3, category=$4, published_on=$5, body=$6
              WHERE article_id = $7`;
  let values = [request.body.title, request.body.author, request.body.author_url, request.body.category, request.body.published_on, request.body.body, request.params.id];

  client.query(SQL, values)
    .then(() => {
      response.send('update complete')
    })
    .catch(err => {
      console.error(err);
      response.status(500).send(err);
    });
});

app.delete('/articles/:id', (request, response) => {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This route manages a single DELETE (this the DELETE portion of CRUD). IT takes a 2) request from the browser, 3) creates and passes a delete statement to the database, 4) retrieves the results from the database (which I believe are attached to the client.query object), and 5) uses a promise to create a response and return it to the browser, either a success message or error. This route is called inside the Article.prototype.deleteRecord() method in article.js.

  let SQL = `DELETE FROM articles WHERE article_id=$1;`;
  let values = [request.params.id];

  client.query(SQL, values)
    .then(() => {
      response.send('Delete complete')
    })
    .catch(err => {
      console.error(err);
      response.status(500).send(err);
    });
});

app.delete('/articles', (request, response) => {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This route manages a complete TRUNCATE of the article table (this the DELETE portion of CRUD). IT takes a 2) request from the browser, 3) creates and passes a TRUNCATE statement to the database, 4) retrieves the results from the database (which I believe are attached to the client.query object), and 5) uses a promise to create a response and return it to the browser, either a success message or error. This route is called from the Article.truncateTable() method in article.js.

  let SQL = `TRUNCATE TABLE articles;`;
  client.query(SQL)
    .then(() => {
      response.send('Delete complete')
    })
    .catch(err => {
      console.error(err);
      response.status(500).send(err);
    });
});

// COMMENTed: What is this function invocation doing?
// This is calling the loadDB() global function, which tests for whether or not there is data in the db, and if not, imports it from the /data/hackerlpsom.json file.
loadDB();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});


//////// ** DATABASE LOADER ** ////////
////////////////////////////////////////
function loadArticles() {

  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // The loadArticles function corresponds to steps 3) query and 4) results of the full stack diagram. It does both a SELECT, and if necessary, an INSERT. (So, both the CREATE and RETRIEVE portions of CRUD.) Since this is called from the loadDB() global function on this script, and is entirely focused on managing the back end, it isn't associated at all to any methods in article.js.

  let SQL = 'SELECT COUNT(*) FROM articles';
  client.query(SQL)
    .then(result => {
      // REVIEWed: result.rows is an array of objects that PostgreSQL returns as a response to a query.
      // If there is nothing on the table, then result.rows[0] will be undefined, which will make count undefined. parseInt(undefined) returns NaN. !NaN evaluates to true.
      // Therefore, if there is nothing on the table, line below will evaluate to true and enter into the code block.
      if (!parseInt(result.rows[0].count)) {
        fs.readFile('./public/data/hackerIpsum.json', 'utf8', (err, fd) => {
          JSON.parse(fd).forEach(ele => {
            let SQL = `
              INSERT INTO articles(title, author, author_url, category, published_on, body)
              VALUES ($1, $2, $3, $4, $5, $6);
            `;
            let values = [ele.title, ele.author, ele.author_url, ele.category, ele.published_on, ele.body];
            client.query(SQL, values);
          })
        })
      }
    })
}

function loadDB() {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // Hmm... this is Data Definition Language (DDL) rather than Data Manipulation Language (DML)... so I don't think strickly speaking CRUD refers to this. But if it does, it would be the CREATE portion. This code is backend only; it is not directly interacted with by any part of article.js. The portions of the full-stack diagram that it corresponds to are 3) query, and 4) via the error promise.
  client.query(`
    CREATE TABLE IF NOT EXISTS articles (
      article_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      author_url VARCHAR (255),
      category VARCHAR(20),
      published_on DATE,
      body TEXT NOT NULL);`)
    .then(() => {
      loadArticles();
    })
    .catch(err => {
      console.error(err);
    });
}
