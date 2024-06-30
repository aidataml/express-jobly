const { BadRequestError } = require("../expressError");

/* ### **First Task: sqlForPartialUpdate**

A starting piece to document and test:

We’ve provided a useful method in ***helpers/sql.js*** called ***sqlForPartialUpdate***. 
This code works, and we use it, but the code is undocumented and not directly tested. 
Write unit tests for this, and thoroughly document the function.

****************************************************************************************
Helper for making partial updates to the SQL database. 
dataToUpdate and jsToSql are passed in as parameters. 
dataToUpdate is an object (field: value).
jsToSql is an object (firstName: "first_name", age: "age").
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Save the data to update to a variable called "keys"
  const keys = Object.keys(dataToUpdate);

  // If there is no data provided to update, display an error message.
  if (keys.length === 0) throw new BadRequestError("No data");

  // Create a variable named "cols" that maps the SQL syntax if available. If not, use the column name.
  // Example: {firstName: 'Peter', age: 50} maps to ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // Return an object that joins the columns array of data to update separated by commas. 
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

// Export the sqlForPartialUpdate function so it can be used by other scripts.
module.exports = { sqlForPartialUpdate };
