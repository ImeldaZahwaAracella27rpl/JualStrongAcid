const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const session = require('express-session')
const jwt = require('jsonwebtoken')

const app = express()
const port = 2000;

const secretKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

const db = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: "project1"
})

const isAuthorized = (request, result, next) => {
    // cek apakah user sudah mengirim header 'x-api-key'
    if (typeof(request.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }

    // get token dari header
    let token = request.headers['x-api-key']

    // melakukan verifikasi token yang dikirim user
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })

    // lanjut ke next request
    next()
}

// LOGIN ADMIN
app.post('/login/penjual', function(request, response) {
    let data = request.body
	var username = data.username;
	var password = data.password;
	if (username && password) {
		db.query('SELECT * FROM penjual WHERE username= ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = data.username;
				response.redirect('/login/penjual');
			} else {
				response.send('Username dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Username and Password!');
		response.end();
	}
});


app.get('/login/penjual', function(request, results) {
	if (request.session.loggedin) {
        let data = request.body
        let token = jwt.sign(data.username + '|' + data.password, secretKey)

        results.json({
            success: true,
            message: 'Login success, welcome back Admin!',
            token: token
        })
	} else {
        results.json({
            success: false,
            message:'Mohon login terlebih dahulu!'
        })
        }
	
	results.end();
});

//LOGIN PEMBELI
app.post('/login/pembeli', function(request, response) {
	var email = request.body.email;
	var password = request.body.password;
	if (email && password) {
		db.query('SELECT * FROM pembeli WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.email = email;
				response.redirect('/home');
			} else {
				response.send('Email dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Email and Password!');
		response.end();
	}
});


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Selamat Datang, ' + request.session.email + '!');
	} else {
		response.send('Mohon login terlebih dahulu!');
	}
	response.end();
});

//CRUD PEMBELI

//ini sama dengan register yang dilakukan oleh pembeli
app.post('/pembeli/register',(req, res) => {
    let data = req.body

    let sql = `
        insert into pembeli (nama_pembeli, kontak, alamat, email, password)
        values ('`+data.nama_pembeli+`', '`+data.kontak+`','`+data.alamat+`', '`+data.email+`', '`+data.password+`')
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Register berhasil",
            data: result
        })
    })
})

app.get('/pembeli', isAuthorized, (req, res) => {
    let sql = `
        select id_pembeli, nama_pembeli, kontak, alamat from pembeli
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Berhasil mendapatkan data pembeli",
            data: result
        })
    })
})

app.get('/pembeli/:id_pembeli', isAuthorized, (req, res) => {
    let sql = `
        select nama_pembeli, kontak, alamat from pembeli
        where id_pembeli = `+req.params.id_pembeli+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Dapat data pembeli dari id",
            data: result[0]
        })
    })
})

app.put('/pembeli/:nama_pembeli', (req, res) => {
    let data = req.body

    let sql = `
        update pembeli
        set nama_pembeli = '`+data.nama_pembeli+`', kontak = '`+data.kontak+`', alamat = '`+data.alamat+`', email = '`+data.email+`', password = '`+data.password+`'
        where nama_pembeli = '`+req.params.nama_pembeli+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "DATA DIUPDATE",
            data: result
        })
    })
})

app.delete('/pembeli/:id_pembeli', isAuthorized,(req, res) => {
    let sql = `
        delete from pembeli
        where id_pembeli = '`+req.params.id_pembeli+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "DATA DIHAPUS",
            data: result
        })
    })
})

//CRUD Barang

app.post('/barang',  isAuthorized,(req, res) => {
    let data = req.body

    let sql = `
        insert into barang (merk_brg, netto_brg, harga_brg, stock)
        values ('`+data.merk_brg+`', '`+data.netto_brg+`','`+data.harga_brg+`','`+data.stock+`')
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Berhasil Menambahkan Data",
            data: result
        })
    })
})

app.get('/barang',  (req, res) => {
    let sql = `
        select id_brg, merk_brg, netto_brg, harga_brg from barang
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Berhasil mendapatkan data barang",
            data: result
        })
    })
})


app.put('/barang/:id_brg',  isAuthorized,(req, res) => {
    let data = req.body

    let sql = `
        update barang
        set merk_brg = '`+data.merk_brg+`', netto_brg = '`+data.netto_brg+`', harga_brg = '`+data.harga_brg+`', stock = '`+data.stock+`'
        where id_brg = '`+req.params.id_brg+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "DATA DIUPDATE",
            data: result
        })
    })
})

app.delete('/barang/:id_brg', isAuthorized,(req, res) => {
    let sql = `
        delete from barang
        where id_brg = '`+req.params.id_brg+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "DATA DIHAPUS",
            data: result
        })
    })
})

//Transaksi
app.get('/produk/:id_brg', (req, res)=>{
    db.query(`
        select * from barang where id_brg = ?
    `, [req.params.id_brg], (error,results)=> {
        if (error) throw error

        if(results.length <=0){
            res.json({
                success: false,
                message: 'Tidak ada barang dengan id' + req.params.id_brg
            })
        }else{
            res.json({
                success: true,
                message: 'Sukses mendapatkan barang dengan id ' + req.params.id_brg,
                data: results[0]
            })
        }
    })
})

app.post('/produk/:id_brg/buy', (req, res) =>{
    let data = req.body
    
    db.query(`
        insert into transaksi (id_brg, nama_pembeli, qty, harga_brg, total_bayar)
        values ( '`+req.body.id_brg+`', '`+req.body.nama_pembeli+`', '`+req.body.qty+`', '`+req.body.harga_brg+`', '`+req.body.qty+`' * '`+req.body.harga_brg+`')
    `, (err, result) => {
        if (err) throw err
    })

    db.query(`
        update barang
        set stock = stock - '`+req.body.qty+`'
        where id_brg = '`+req.body.id_brg+`'
        `, (err, result) => {
            if (err) throw err
        })
    
        res.json({
            message: "Berhasil melakukan transaksi!"
            
        })
    })
app.get('/nota/:id_transaksi', (req, res)=>{
    let sql = `
        select * from transaksi
        where id_transaksi = `+req.params.id_transaksi+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "------- NOTA TRANSAKSI -------",
            data: result[0]
        })
    })
})
app.post('/checkout', (req, res)=>{
    res.json({
        success: true,
        message : 'Berhasil melakukan pembelian'
    })
})

//Run Application
app.listen(port, () => {
    console.log('App running on port ' + port)
})
