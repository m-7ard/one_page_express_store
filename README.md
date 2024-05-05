<<<<<<< HEAD
<div style="background-color: red;">
    Documentation
</div>
=======
# Documentation

**Frontend**

`Specifications`
```
    React (with Vite)
    Tailwind
    Headless UI
    Zod
    Tanstack
    Heroicons
    Typescript
```

    
**Backend**

`Specifications`
```
    Express (with Multer to handle incoming FormData)
    Lucia Auth
    Zod
    Tanstack
    Heroicons
    Typescript
    MariaDB / mysql
    mysql2 [*]
```
> [!NOTE]
> While MariaDB is used for this project, all the querying is done using the mysql2 library, with database dumping also being done using mysqldump.
> The reason for this is that Lucia Auth does not have a MariaDB connector, however, one can be written if necessary.



`Unit Testing`
> [!IMPORTANT]
> This project utilitses globally installed TSX to run unit tests written in Typescript.
> You can install it here: https://www.npmjs.com/package/tsx


Due to clashes in configuration between typescript, express and popular unit testing modules (such as Jest or Mocha), this project utilises expandable unit tests written by the author. The unit tests hierarchy is as follows:

* `testCase` Is an async function that takes as argument 'callback', a callback that returns a promise. 
* It will first create a connection to the existing 'one_page_store' database, execute a CREATE database query to create a new database called 'one_page_store_testing'.
* Subsequently, it will try to create a new Pool using "one_page_store_testing" as database, and set the context[1] pool, followed by a copying of all tables from the original database to the testing database (without inserting existing data).
* Finally, it'll set up the app with the pool that was set in the context, and run the callback, effectively giving us a database without data with all the same tables as our original one.
  
...

* `mixins (optional)` These are functions that will create prop data to test with. e.g. sample users, sample products, sessions.

...

* `test` Is an async function that takes as argument 'callback', a callback that returns a promise.
* It will first make a backup of the database using the dbSave function, and the run the tester, and print a corresponding log in the console when successful, unsuccessful or it runs into an error, and finally revert the database to how it was when dbSave was called.

> [!IMPORTANT]
> For testCase to work, a 'one_page_store' database needs to already exist.



`Context [1]` 


In order to be able to mock the database for testing, we need to be able to switch our main Pool, for this we use a context object, starting with all it's properties set to null. To access the context, getFromContext is used, to ensure that any and all null errors are caught.


`Setting up what tests to run` 


In order to run all tests in a file, at the top level, set `context.testsToRun = "__all__";`. In order to only run certain tests set `context.testsToRun = ['test1', 'test2', ...];`, where the contents of the array are the names assigned to the tests.
>>>>>>> 07c2ed4ccd579d67a323ea5c508f80ea51617a48
