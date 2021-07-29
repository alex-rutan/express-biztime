"use strict"

const express = require("express");
const { NotFoundError } = require("./expressError");

const db = require("./db");
const router = new express.Router();


/** GET /companies: return list of companies, 
 * like {companies: [{code, name}, ...]}  */

router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
        FROM companies
        ORDER BY name`
  )
  const companies = results.rows;

  return res.json({ companies });
});

/** GET /companies/[code]: Return obj of company: 
 * {company: {code, name, description, invoices: [id, ...]}} */

router.get("/:code", async function (req, res, next) {
  const code = req.params.code
  const cResults = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`,
    [code]
  );
  const company = cResults.rows[0];

  const invResults = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
     FROM invoices
     WHERE comp_code = $1`,
     [code]
  );
  
  if (!company) {
    throw new NotFoundError();
  }
  
  company.invoices = invResults.rows;

  return res.json({ company });
});

/** POST /companies: Return obj of created company: 
* {company: {code, name, description}} */

router.post("/", async function (req, res, next) {
  const { code, name, description } = req.body;
  
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
    [code, name, description]
  );
  
  const company = results.rows[0];

  return res.status(201).json({ company });
});

/** PUT /companies/:code: Return obj of updated company: 
* {company: {code, name, description}} */

router.put("/:code", async function (req, res, next) {
  const code = req.params.code;
  const { name, description } = req.body;
  
  const results = await db.query(
    `UPDATE companies
            SET name=$1,
                description=$2
            WHERE code = $3
            RETURNING code, name, description`,
    [name, description, code]
  );
  
  const company = results.rows[0];
  
  if (!company) {
    throw new NotFoundError();
  }

  return res.json({ company });
});

/** DELETE /companies/[code]: Returns {status: "deleted"} */

router.delete("/:code", async function (req, res, next) {
  const code = req.params.code
  const result = await db.query(
    `DELETE FROM companies WHERE code = $1
     RETURNING code`,
    [code]
  );
  
  if (!result.rowCount) {
    throw new NotFoundError();
  }
  
  return res.json({ message: "deleted" });
});


module.exports = router;