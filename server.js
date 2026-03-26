const express = require("express")
const path = require("path")

const app = express()

app.use(express.static(path.join(__dirname,"frontend")))

app.get("/",(req,res)=>{
res.sendFile(path.join(__dirname,"frontend","dashboard.html"))
})

app.listen(5100,()=>{
console.log("Server running http://localhost:5100")
})