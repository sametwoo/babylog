const express=require('express')
const app=express();

const {Pool} = require('pg')
const pool = new Pool({
	connectionString: 'postgresql://ubuntu:"@localhost:5432/baby',
});
pool.on('error',(err, client)=>{
	console.err('Unexpected error on idle client', err)
});
app.use(express.static('public'));
app.get('/query',(req, res)=>{
	res.setHeader('Content-Type','text/html');
	html="<html><form action='/save' method='get'><h1>Milk</h1><input type='text' name='milk'/><h1>Poops</h1><input id='r0' type='radio' checked='checked' name='poops' value='0'/>none<input id='r1' type='radio' name='poops' value='1'/>a little<input id='r2' type='radio' name='poops' value='2'/>much more<p><input type='submit' value='Submit'/></p></form>"
	sql="SELECT * FROM milk ORDER BY time DESC;";
	var t0="<table><tr><th>Time</th><th>Qt. Milk</th></tr>"
	pool.query(sql).then(rs=>{
	  nowTime=new Date();
	  lastFeedTime=new Date(rs.rows[0].time);
		for(i=0; i<rs.rows.length; i++) {
			t=rs.rows[i].time;
			m=rs.rows[i].milk;
			t0+="<tr><td>"+t+"</td><td>"+m+"</td></tr>"
		}
		t0+="</table>"
	}).then(()=>{
		sql="SELECT * FROM poops ORDER BY time DESC;";
		var t1="<table><tr><th>Time</th><th>Qt. Poops</th></tr>"
		pool.query(sql).then(rs=>{
			for(i=0; i<rs.rows.length; i++) {
				t=rs.rows[i].time;
				m=rs.rows[i].poops;
				t1+="<tr><td>"+t+"</td><td>"+m+"</td></tr>"
			}
			t1+="</table>"
		}).then(()=>{
			var tslf=0;
			var nf24=0;
			var qf24=0;
			var pp24=0;
			s0="<p>Time Since Last Feed:"+tslf+"</p>"
			s0+="<p>No. Feeds in 24h:"+nf24+"</p>"
			s0+="<p>Qt. Feeds in 24h:"+qf24+"</p>"
			s0+="<p>Poops in 24h:"+pp24+"</p>"
			html=html+s0+t0+t1+"</html>"
			res.send(html);
		});
	});
});
async function processPoops(req, res) {
	if(req.query.hasOwnProperty('poops') && req.query['poops']!==null){
	  var t=new Date()
		sql="INSERT INTO poops (time, poops) VALUES ($1,$2);";
		await pool.query(sql,[t.toISOString(),req.query['poops']]);
	}
}
async function processMilk(req, res) {
	if(req.query.hasOwnProperty('milk') && req.query['milk']!==null){
	  var t=new Date()
		sql="INSERT INTO milk (time, milk) VALUES ($1,$2);";
		await pool.query(sql,[t.toISOString(),req.query['milk']]);
	}
}
app.get('/save',(req, res)=>{
	processPoops(req, res);
	processMilk(req, res);
	console.log('bad');
	res.redirect('/query');
});
app.listen(3000,()=>{console.log('good')});


