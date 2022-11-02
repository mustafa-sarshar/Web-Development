const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
    res.sendFile("./views/index.html", {root: __dirname});
});

app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });
