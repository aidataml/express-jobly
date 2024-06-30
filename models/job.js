/* Add a model for jobs — you can pattern-match this from the companies model.

Updating a job should never change the ID of a job, nor the company associated with a job.

Write tests for the model.*/

"use strict";

const db = require("../db");
const {NotFoundError} = require("../expressError");
const {sqlForPartialUpdate} = require("../helpers/sql");

class Job {
  // Add a new job to the database based on the data object with job information.
  static async create(data) {
    // Store result of SQL query into result variable. Insert data for title, salary, etc. into the job table
    const result = await db.query(
          `INSERT INTO jobs (title,
                             salary,
                             equity,
                             company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          data.title,
          data.salary,
          data.equity,
          data.companyHandle,
        ]);
    let job = result.rows[0];
    
    // Return the new job added to the database
    return job;
  }

  /* Similar to the companies filtering for the ***GET /*** route, add filtering for jobs for the following 
  possible filters:

- ***title***: filter by job title. Like before, this should be a case-insensitive, 
  matches-any-part-of-string search.
- ***minSalary***: filter to jobs with at least that salary.
- ***hasEquity***: if ***true***, filter to jobs that provide a non-zero amount of equity. 
  If ***false*** or not included in the filtering, list all jobs regardless of equity.

Write comprehensive tests for this, and document this feature well.*/

  
// Find all jobs with empty object or find jobs based on salary, equity and title.
  static async findAll({ minSalary, hasEquity, title } = {}) {
    // Perform SQL query on jobs table and join the company name
    let query = `SELECT j.id,
                        j.title,
                        j.salary,
                        j.equity,
                        j.company_handle AS "companyHandle",
                        c.name AS "companyName"
                 FROM jobs j 
                   LEFT JOIN companies AS c ON c.handle = j.company_handle`;

    // Create variables for empty arrays that capture WHERE clauses for the SQL query and query parameter values. 
    let queryWhereClauses = [];
    let queryParameters = [];

    // If minimum salary is defined, add the parameter values to the queryParameters array where the salary is greater than min.
    if (minSalary !== undefined) {
      queryParameters.push(minSalary);
      queryWhereClauses.push(`salary >= $${queryParameters.length}`);
    }

    // If job filter has equity selected, add a condition to the where clause specifying that equity should be greater than 0.
    if (hasEquity === true) {
      queryWhereClauses.push(`equity > 0`);
    }

    /* If title is defined, partially match the title within the database, add the value to the queryParameters array and
    add condition to the where clause array to filter case-insensitive matches.*/  
    if (title !== undefined) {
      queryParameters.push(`%${title}%`);
      queryWhereClauses.push(`title ILIKE $${queryParameters.length}`);
    }

    // If there are where clauses, add a where clause to the query.
    if (queryWhereClauses.length > 0) {
      query += " WHERE " + queryWhereClauses.join(" AND ");
    }

    // Sort results in alphabetical order by title.
    query += " ORDER BY title";
    const jobResults = await db.query(query, queryParameters);
    return jobResults.rows;
  }



  static async get(id) {
    // Store job query by id in jobResults variable.
    const jobResults = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);

    const job = jobResults.rows[0];
    
    // If ID not found, throw an error.
    if (!job) throw new NotFoundError(`No job: ${id}`);

    
    // Save related company  data to companyResults variable.
    const companyResults = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`, [job.companyHandle]);
    
    // Update the job object - remove companyHandle and add company object.
    delete job.companyHandle;
    job.company = companyResults.rows[0];

    // return job with associated company data.
    return job;
  }

  
  // Method for updating job data based on parameters for the job ID and data
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    
    // Store the index of the SQL query id parameter
    const jobIdIndex = "$" + (values.length + 1);
    
    // Create SQL query for job update
    const sqlQuery = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${jobIdIndex} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(sqlQuery, [...values, id]);
    const job = result.rows[0];

    // If job id not found, throw an error.
    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }


  // Method for deleting a job from database based on the job ID.
  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]);
    const job = result.rows[0];

    // If job ID not found, throw an error.
    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
