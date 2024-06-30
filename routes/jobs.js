"use strict";

/** Add routes for jobs. The same routes should be handled as we did for companies (for now, omit 
 * the special filtering on the ***GET /*** route), with the same security requirements (anyone can 
 * get the jobs, but only admins can add, update, or delete them). Make sure you suitably validate incoming data.

Write tests for the routes.
*/

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = express.Router({ mergeParams: true });


/** POST / { job } => { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin user only (uses middleware ensureAdmin function to validate)
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    // Validate based on new job schema
    const validator = jsonschema.validate(req.body, jobNewSchema);

    // If not valid, throw an error.
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    // If valid, add new job to the database.
    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** Similar to the companies filtering for the ***GET /*** route, add filtering for jobs for 
 * the following possible filters:

- ***title***: filter by job title. Like before, this should be a case-insensitive, 
  matches-any-part-of-string search.
- ***minSalary***: filter to jobs with at least that salary.
- ***hasEquity***: if ***true***, filter to jobs that provide a non-zero amount of equity. 
  If ***false*** or not included in the filtering, list all jobs regardless of equity.

Write comprehensive tests for this, and document this feature well.  
 * 
 * GET / =>
 *   { jobs: [ { id, title, salary, equity, companyHandle, companyName }, ...] }
 *
 * Can provide search filter in query:
 * - minSalary
 * - hasEquity (true returns only jobs with equity > 0, other values ignored)
 * - title (will find case-insensitive, partial matches)

 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const q = req.query;
  if (q.minSalary !== undefined) q.minSalary = +q.minSalary;
  q.hasEquity = q.hasEquity === "true";

  try {
    const validator = jsonschema.validate(q, jobSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const jobs = await Job.findAll(q);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[jobId] => { job }
 *
 * Returns { id, title, salary, equity, company }
 *   where company is { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[jobId]  { fld1, fld2, ... } => { job }
 *
 * Data can include: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: id }
 *
 * Authorization required: admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: +req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
