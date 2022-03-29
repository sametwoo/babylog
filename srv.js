#!/usr/bin/env node
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
	var nowTime=new Date();
	res.setHeader('Content-Type','text/html');
	html="<!doctype html><html lang='en'><head><meta name='viewport' content='with=device-width,initial-scale=1,shrink-to-fit=no'><link rel='stylesheet' type='text/css' href='bootstrap.min.css'/><link rel='stylesheet' type='text/css' href='style.css'></head><body><form action='/save' method='get' role='form'><div class='row m-1 g-0'><div class='col'><input type='number' name='milk' id='milk' class='form-control' placeholder='奶粉'/></div><div class='col col-1'></div><div class='col'><input type='number' id='natrual' name='natrual' class='form-control col pl-3' placeholder='母乳'/></div></div><div class='m-1 row'><select class='form-select' id='poops' name='poops'><option selected value='-1'>记录大小便</option><option value='11'>撒尿了</option><option value='12'>尿很多</option><option value='1'>拉屎了</option><option value='2'>屎很多</option></select></div><div class='row m-1'><input type='submit' value='提  交' class='btn btn-success'/></div></form>"
	var historymilk='';
	var historypoops='';
    var summary='';
    var advise='';
    var ts0, ts1;
	const pMilk=pool.query("SELECT * FROM milk WHERE EXTRACT(EPOCH FROM (now()-time))<24*3600*3 ORDER BY time DESC;").then(rs=>{
        ts0=rs;
        var t0="<p><table class='table table-striped table-primary'><tr class='table-dark'><th>哺喂时间</th><th>牛奶</th><th>母乳</th</tr>"
        for(i=0; i<rs.rows.length; i++) {
			t=new Date(rs.rows[i].time);
			m=rs.rows[i].milk;
			bm=rs.rows[i].natrual;
			if(m==0||m===null) m='';
			if(bm==0||bm===null) bm='';
			t0+="<tr><td>"+t.toLocaleString('zh-CN',{hour12:false})+"</td><td>"+m+"</td><td>"+bm+"</td></tr>"
		}
		t0+="</table></p>"
        historymilk=t0;
	});
	const pPoops=pool.query("SELECT * FROM poops WHERE poops>0 AND EXTRACT(EPOCH FROM (now()-time))<24*3600*3 ORDER BY time DESC;").then(rs=>{
        ts1=rs;
		var t1="<p><table class='table table-striped table-secondary'><tr class='table-dark'><th>检查时间</th><th>大小便</th></tr>"
        for(i=0; i<rs.rows.length; i++) {
			t=new Date(rs.rows[i].time);
			m=rs.rows[i].poops;
			s='';
			if(m==11) {s='小便';} else if(m==12) s='小便多'; else if(m==1) {s='大便';} else if(m==2) {s='大便多';}
			t1+="<tr><td>"+t.toLocaleString('zh-CN',{hour12:false})+"</td><td>"+s+"</td></tr>"
		}
		t1+="</table></p>"
        historypoops=t1;
	});
    const pSummary=Promise.allSettled([pPoops,pMilk]).then(()=>{
    		i=0;
    		while(i<ts0.rows.length && !(ts0.rows[i].milk>0)) i++;
        lastFeedTime=Date.parse(ts0.rows[i].time);
        var tslf=((nowTime-lastFeedTime)/3600/1000).toFixed(2);
        var n=0;
        var q=0;
        var qm=0;
        for(i=0; i<ts0.rows.length; i++){
            d=Date.parse(ts0.rows[i].time);
            if(nowTime-d>24*3600*1000) break;
            n++;
            q+=ts0.rows[i].milk;
            qm+=ts0.rows[i].natrual;
        }
        var nf24=n;
        var qf24=q+qm;
        var pp24=0;
        var pe24=0;
        i=0;
        while(i<ts1.rows.length && nowTime-Date.parse(ts1.rows[i].time)<=24*3600*1000) {
            poops=parseInt(ts1.rows[i++].poops);
            if(poops>10) {pe24++;}
            else if(poops>0 && poops<10) {pp24++;}
        }
        s0='<p><table class="table table-warning table-striped">'
        s0+="<tr><td>距上次哺喂时间</td><td>"+tslf+"小时</td></tr>"
        s0+="<tr><td>24小时内哺喂次数</td><td>"+nf24+"</td></tr>"
        s0+="<tr><td>24小时内哺喂奶量</td><td>"+qf24+"毫升</td></tr>"
        s0+="<tr><td>24小时收集母乳</td><td>"+qm+"毫升</td></tr>"
        s0+="<tr><td>24小时内大便次数</td><td>"+pp24+"</td></tr>"
        s0+="<tr><td>24小时内小便次数</td><td>"+pe24+"</td></tr></table></p>"
        summary=s0;
    });
    const pAdvise=pool.query('SELECT time, milk,natrual FROM milk WHERE EXTRACT(EPOCH FROM (now() - time)) < 7*24*3600 ORDER BY time ASC;').then(rs=>{
        v0=0;
        for(i=0; i<rs.rows.length; i++) {
            v0+=(rs.rows[i].milk+rs.rows[i].natrual);
        }
        v1=(nowTime-Date.parse(rs.rows[0].time))/1000/3600*41.67;
        q0=(v1-v0)/rs.rows.length;
        q1=(nowTime-Date.parse(rs.rows[rs.rows.length-1].time))/1000/3600*41.67;
        rc0='<p>少于建议标准：'+q0.toFixed(2)+'('+(v1-v0).toFixed(2)+')毫升</p>';
        rc1='<p>建议哺喂：'+q1.toFixed(2)+'毫升</p>';
        advise=rc0+rc1;
    });
    Promise.allSettled([pMilk,pPoops,pAdvise,pSummary]).then(()=>{
        html+=summary+advise+historymilk+historypoops+'</body></html>';
        res.send(html);
    });
});
app.get('/save',(req, res)=>{
	var t=new Date()
	const p1=pool.query("INSERT INTO poops (time, poops) VALUES ($1,$2);",[t.toISOString(),parseInt(req.query['poops'])]);
	a=parseInt(req.query['milk']);
	if(isNaN(a)) a=0;
	b=parseInt(req.query['natrual']);
	if(isNaN(b)) b=0;
	const p2=pool.query("INSERT INTO milk (time, milk, natrual) VALUES ($1,$2,$3);",[t.toISOString(),a,b]);
	Promise.allSettled([p1,p2]).then(()=>{
		res.redirect('/query');
	});
});
app.listen(3000,()=>{console.log('good')});
