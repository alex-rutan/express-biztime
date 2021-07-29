"use strict"

const express = require("express");
const { NotFoundError } = require("./expressError");

const db = require("./db");
const router = new express.Router();


/** GET /invoices: return list of invoices,
 * like {invoices: [{id, comp_code}, ...]}  */

router.get("/", async function (req, res, next) {
    const results = await db.query(
        `SELECT id, comp_code
        FROM invoices
        ORDER BY id`
    )
    const invoices = results.rows;

    return res.json({ invoices });
});


/** GET /invoices: return specific invoice by id,
 * like {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}} */

router.get("/:id", async function (req, res, next) {
    const id = req.params.id;
    const iResults = await db.query(
        `SELECT id, amt, paid, add_date, paid_date
        FROM invoices
        WHERE id = $1`,
        [id]
    )
    const invoice = iResults.rows[0];

    if (!invoice) {
        throw new NotFoundError();
    }
    
    const cResults = await db.query(
        `SELECT code, name, description
        FROM companies
        JOIN invoices ON code = comp_code
        WHERE id = $1
        ORDER BY code`,
        [id]
    );
    
    invoice.company = cResults.rows[0];
    return res.json({ invoice });
});


/** POST /invoices: Adds an invoice and  
* Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */

router.post("/", async function (req, res, next) {
    const { comp_code, amt } = req.body;

    const results = await db.query(
        `INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [comp_code, amt]
    );

    const invoice = results.rows[0];

    return res.status(201).json({ invoice });
});

/** POST /invoices: Adds an invoice and
* Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} or 404 */

router.put("/:id", async function (req, res, next) {
    const id = req.params.id;
    const { amt, paid } = req.body;
    let results;
    if (paid) {
      results = await db.query(
        `UPDATE invoices
            SET amt = $1, 
                paid = $3,
                paid_date = CURRENT_DATE
            WHERE id = $2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, id, paid]
      ); 
    } else {
        results = await db.query(
            `UPDATE invoices
            SET amt = $1,
                paid = $3,
                paid_date = NULL
            WHERE id = $2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, id, paid]
        );
    }

    const invoice = results.rows[0];

    if (!invoice) {
        throw new NotFoundError();
    }

    return res.json({ invoice });
});


/** DELETE /invoices/[id]: Returns {status: "deleted"} */

router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;
  const result = await db.query(
    `DELETE FROM invoices 
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  
  if (!result.rowCount) {
    throw new NotFoundError();
  }
  
  return res.json({ message: "deleted" });
});


module.exports = router;