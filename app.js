/** BizTime express application. */

const express = require("express");
const { NotFoundError } = require("./expressError");

const morgan = require('morgan');
const companyRoutes = require("./companyRoutes");
const invoiceRoutes = require("./invoiceRoutes");

const app = express();

app.use(express.json());
app.use(morgan('dev'));

// apply a prefix to every route in itemRoutes
app.use("/companies", companyRoutes);
app.use("/invoices", invoiceRoutes);




/** 404 handler: matches unmatched routes; raises NotFoundError. */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Error handler: logs stacktrace and returns JSON error message. */
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  const message = err.message;
  if (process.env.NODE_ENV !== "test") console.error(status, err.stack);
  return res.status(status).json({ error: { message, status } });
});



module.exports = app;
