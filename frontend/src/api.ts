export async function analyze(tx:any){

const res = await fetch(
"http://localhost:8000/analyze",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify(tx)
}
)

return res.json()
}