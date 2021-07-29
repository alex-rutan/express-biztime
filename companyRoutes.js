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
        FROM companies`
    )
    const companies = results.rows;

    // if (companies.length === 0) {
    //     throw new NotFoundError();
    // }
    return res.json({companies});
});


/** GET /companies/[code]: Return obj of company: 
 * {company: {code, name, description}} */
router.get("/:code", async function (req, res, next) {
    const code = req.params.code
    const results = await db.query(
        `SELECT code, name, description
        FROM companies
        WHERE code = $1`,
        [code]
    );
    const company = results.rows[0];
    if (!company) {
        throw new NotFoundError();
    }
    return res.json({company});
});







module.exports = router;