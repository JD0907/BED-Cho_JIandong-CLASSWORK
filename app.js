require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const app = express();

app.use(express.json());

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { trustServerCertificate: true },
};

app.get("/publisher", async (req, res) => {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request().query("SELECT * FROM Publisher");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  } finally {
    if (connection) await connection.close();
  }
});

app.get("/publishers/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("publisherId", sql.SmallInt, id)
      .query("SELECT * FROM Publisher WHERE PublisherID = @publisherId");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  } finally {
    if (connection) await connection.close();
  }
});

app.post("/publishers", async (req, res) => {
  const { publisherId, name } = req.body;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection
      .request()
      .input("publisherId", sql.SmallInt, publisherId)
      .input("name", sql.VarChar(50), name)
      .query(
        "INSERT INTO Publisher (PublisherID, Name) VALUES (@publisherId, @name)",
      );
    res.status(201).json(req.body);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  } finally {
    if (connection) await connection.close();
  }
});

app.put("/publishers/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const { name } = req.body;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("publisherId", sql.SmallInt, id)
      .input("name", sql.VarChar(50), name)
      .query(
        "UPDATE Publisher SET Name = @name WHERE PublisherID = @publisherId",
      );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    res.json({ publisherId: id, name });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  } finally {
    if (connection) await connection.close();
  }
});

app.delete("/publishers/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("publisherId", sql.SmallInt, id)
      .query("DELETE FROM Publisher WHERE PublisherID = @publisherId");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Publisher not found" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  } finally {
    if (connection) await connection.close();
  }
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
