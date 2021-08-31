const express=require('express');
var mysql = require("mysql");
const config=require('../../db.json')

var conn = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: true,
  });

  conn.connect(function (err) {
    if (err) throw err;
  
    console.log("Connected!");
  });



const table_exists_sql =
"SELECT table_name FROM information_schema.tables WHERE table_schema = 'Egale' AND table_name = 'Eagle';";

conn.query(table_exists_sql, (err, res, fields) => {
if (res[0] == undefined) {
  console.log("Creating Table");
  var create_table =
    "CREATE TABLE Eagle (client_id BIGINT(64) Primary Key,name VARCHAR(255), email_id VARCHAR(255),status boolean Not NULL)";
  conn.query(create_table, (err, res) => {
    console.log(res);
    console.log(err);
  });
}
});





const router=express.Router();
router.get('/',(req,res,next)=>{
    res.status(200)
    conn.query("select * from Eagle", (err, result) => {
        if (result[0] != undefined) {
          console.log(result);
          res.json(result)
        }
      });

    
})

router.post('/',(req,res,next)=>{
    const data={
        client_id:req.body.client_id,
        name:req.body.name,
        email:req.body.email,
        status:req.body.stats


    }
    var values = [[data.client_id, data.name, data.email, data.status]];
    var sql =
        "INSERT INTO `Eagle`(`client_id`, `name`, `email_id`, `status`) VALUES ?";
      conn.query(sql, [values], function (err, result) {
        if (err) throw err;
        console.log("Number of records inserted: " + result.affectedRows);
      });
    console.log(data)
    
    res.status(200).json(data)
})




module.exports=router