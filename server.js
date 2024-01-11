const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get("/",(req,res)=>{
    res.send("vercell server is ok");
})
app.listen(process.env.PORT || 4000, () => console.log("server is connected on port 4000"));