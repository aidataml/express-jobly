"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companySearchSchema = require("../schemas/companySearch.json");

const router = new express.Router();


/** ### **Companies**

- Retrieving the list of companies or information about a company should remain open to everyone, 
including anonymous users.
- Creating, updating, and deleting companies should only be possible for users who logged in with 
an account that has the ***is_admin*** flag in the database.

Find a way to do this where you don’t need to change the code of these routes, and where you don’t 
need to SELECT information about the user on every request, but that the authentication credentials 
provided by the user can contain information suitable for this requirement.

Update tests to demonstrate that these security changes are working.
 **************************************************************************************************
 * POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin user only (uses the middleware ensureAdmin function to validate)
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    
    // If user is not a valid admin, throw an error.
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    // If user is a valid admin, create add the new company to the database and return a 201 status code.
    const company = await Company.create(req.body);
    return res.status(201).json({company});
  } catch (err) {
    return next(err);
  }
});

/**### **Adding Filtering**

The route for listing all companies (***GET /companies***) works, but it currently shows all companies. 
Add a new feature to this, allowing API users to filter the results based on optional filtering criteria, 
any or all of which can be passed in the query string:

- ***name***: filter by company name: if the string “net” is passed in, this should find any company who 
name contains the word “net”, case-insensitive (so “Study Networks” should be included).
- ***minEmployees***: filter to companies that have at least that number of employees.
- ***maxEmployees***: filter to companies that have no more than that number of employees.
- If the ***minEmployees*** parameter is greater than the ***maxEmployees*** parameter, respond with a 
400 error with an appropriate message.

**Some requirements:**

- Do not solve this by issuing a more complex SELECT statement than is needed (for example, if the user isn’t filtering by ***minEmployees*** or ***maxEmployees***, the SELECT statement should not include anything about the ***num_employees***.
- Validate that the request does not contain inappropriate other filtering fields in the route. Do the actual filtering in the model.
- Write unit tests for the model that exercise this in different ways, so you can be assured different combinations of filtering will work.
    
    Write tests for the route that will ensure that it correctly validates the incoming request and uses the model method properly.
    
- Document all new code here clearly; this is functionality that future team members should be able to understand how to use from your docstrings. 
 * 
 * GET /  =>
 * { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  // store query parameters in variable q
  const q = req.query;

  // If the minimum number of employees is defined, assign store the minimum number. 
  if (q.minEmployees !== undefined) q.minEmployees = +q.minEmployees;

  // If the maximum number of employees is defined, assign store the maximum number. 
  if (q.maxEmployees !== undefined) q.maxEmployees = +q.maxEmployees;

  try {
    // Validate query against schema for company search.
    const validator = jsonschema.validate(q, companySearchSchema);
    if (!validator.valid) {
      // If not valid, throw an error.
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    // Find all companies based on query parameters
    const companies = await Company.findAll(q);
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/** Now that the app includes jobs, change the ***GET /companies/:handle*** feature so that it 
 * includes all of the information about the jobs associated with that company:

`{ ... other data ... , jobs: [ { id, title, salary, equity}, ... ] }`
 * 
 * GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    // Pass in the handle to the company model.
    const company = await Company.get(req.params.handle);

    // Return a json response from based on the handle.
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: admin
 */

router.patch("/:handle", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin
 */

router.delete("/:handle", ensureAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
