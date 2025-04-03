const express = require('express');
const session = require("express-session");
const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');

// Database setup
const sequelize = new Sequelize('wt24', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false // isključuje SQL logove
});

// Define models
const Korisnik = sequelize.define('Korisnik', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ime: DataTypes.STRING,
  prezime: DataTypes.STRING,
  username: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
  admin: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  freezeTableName: true, 
  tableName: 'korisnik', 
});

const Nekretnina = sequelize.define('Nekretnina', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  naziv: DataTypes.STRING,
  lokacija: DataTypes.STRING,
  cijena: DataTypes.FLOAT,
  datum_objave: DataTypes.DATE
}, {
  freezeTableName: true, 
  tableName: 'nekretnina', 
});

const Upit = sequelize.define('Upit', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tekst: DataTypes.STRING
}, {
  freezeTableName: true, 
  tableName: 'upit', 
});

const Zahtjev = sequelize.define('Zahtjev', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tekst: DataTypes.STRING,
  trazeniDatum: DataTypes.DATE,
  odobren: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  freezeTableName: true, 
  tableName: 'zahtjev', 
});

const Ponuda = sequelize.define('Ponuda', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tekst: DataTypes.STRING,
  cijenaPonude: DataTypes.FLOAT,
  datumPonude: DataTypes.DATE,
  odbijenaPonuda: { type: DataTypes.BOOLEAN, defaultValue: false },
  idVezanePonude: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Ponuda',
      key: 'id'
    },
    allowNull: true
  }
}, {
  freezeTableName: true, 
  tableName: 'ponuda', 
});

// Define relationships
Korisnik.hasMany(Upit);
Upit.belongsTo(Korisnik);

Korisnik.hasMany(Zahtjev);
Zahtjev.belongsTo(Korisnik);

Korisnik.hasMany(Ponuda);
Ponuda.belongsTo(Korisnik);

Nekretnina.hasMany(Upit);
Upit.belongsTo(Nekretnina);

Nekretnina.hasMany(Zahtjev);
Zahtjev.belongsTo(Nekretnina);

Nekretnina.hasMany(Ponuda);
Ponuda.belongsTo(Nekretnina);

Ponuda.hasMany(Ponuda, { as: 'VezanePonude', foreignKey: 'idVezanePonude' });
Ponuda.belongsTo(Ponuda, { as: 'RootPonuda', foreignKey: 'idVezanePonude' });
sequelize.sync({ force: true })
  .then(() => {
    console.log('Tabele su uspešno kreirane u bazi!');
  })
  .catch(err => {
    console.error('Greška pri povezivanju sa bazom:', err);
  });

// Initialize app
const app = express();
const PORT = 3000;

app.use(session({
  secret: 'tajna sifra',
  resave: true,
  saveUninitialized: true
}));

app.use(express.static(__dirname + '/public'));

// Enable JSON parsing without body-parser
app.use(express.json());

/* ---------------- SERVING HTML -------------------- */

// Async function for serving html files
async function serveHTMLFile(req, res, fileName) {
  const htmlPath = path.join(__dirname, 'public/html', fileName);
  try {
    const content = await fs.readFile(htmlPath, 'utf-8');
    res.send(content);
  } catch (error) {
    console.error('Error serving HTML file:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
}

// Array of HTML files and their routes
const routes = [
  { route: '/nekretnine.html', file: 'nekretnine.html' },
  { route: '/detalji.html', file: 'detalji.html' },
  { route: '/meni.html', file: 'meni.html' },
  { route: '/prijava.html', file: 'prijava.html' },
  { route: '/profil.html', file: 'profil.html' },
  { route: '/vijesti.html', file: 'vijesti.html' },
  { route: '/statistika.html', file: 'statistika.html' },
  { route: '/mojiUpiti.html', file: 'mojiUpiti.html' },
  // Practical for adding more .html files as the project grows
];

// Loop through the array so HTML can be served
routes.forEach(({ route, file }) => {
  app.get(route, async (req, res) => {
    await serveHTMLFile(req, res, file);
  });
});

/* ----------- SERVING OTHER ROUTES --------------- */

// Async function for reading json data from data folder 
async function readJsonFile(filename) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    const rawdata = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(rawdata);
  } catch (error) {
    throw error;
  }
}

// Async function for reading json data from data folder 
async function saveJsonFile(filename, data) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    throw error;
  }
}

/*
Checks if the user exists and if the password is correct based on korisnici.json data. 
If the data is correct, the username is saved in the session and a success message is sent.
*/
const loginAttempts = {};

app.post('/login', async (req, res) => {
  const jsonObj = req.body;
  const currentTime = Date.now();
  const vrijemeZaPrijavu = new Date();
  try {
    const korisnik = await Korisnik.findOne({ where: { username: jsonObj.username } });
    if (!korisnik) {
      return res.status(401).json({ greska: 'Pogrešno korisničko ime ili lozinka' });
    }
    const isPasswordMatched = jsonObj.password=== korisnik.password;
    
    if (isPasswordMatched) {
      req.session.username = korisnik.username;
      loginAttempts[jsonObj.username] = { pokusaj: 0, blockedUntil: 0 };
      req.session.userId = korisnik.id;
      req.session.admin = korisnik.admin;
      res.json({ poruka: 'Uspješna prijava' });
    } else {
      if (!loginAttempts[jsonObj.username]) {
        loginAttempts[jsonObj.username] = { pokusaj: 0, blockedUntil: 0 };
      }
      
      const pokusajiKorisnika = loginAttempts[jsonObj.username];
      pokusajiKorisnika.pokusaj++;
      
      if (pokusajiKorisnika.pokusaj === 3) {
        pokusajiKorisnika.blockedUntil = currentTime + 60000;
        return res.status(429).json({ greska: 'Previše neuspješnih pokušaja. Pokušajte ponovo za 1 minut.' });
      }
      
      res.json({ poruka: 'Neuspješna prijava' });
      fs.appendFile('prijave.txt', `[${vrijemeZaPrijavu}] - username: ${jsonObj.username} - status: neuspješno\n`);
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
app.get('/nekretnine/top5', async (req, res) => {
  const lokacija = req.query.lokacija;
  try {
    const top5 = await Nekretnina.findAll({
      where: {
        lokacija: lokacija
      },
        limit: 5
    });

    res.status(200).json(top5);
  } catch (error) {
    console.error('Greška prilikom dohvata top 5 nekretnina:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
app.post('/logout', (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }
  req.session.destroy((err) => {
    if (err) {
      console.error('Greška prilikom odjave:', err);
      return res.status(500).json({ greska: 'Internal Server Error' });
    }
    res.status(200).json({ poruka: 'Uspješno ste se odjavili' });
  });
});
app.get('/korisnik', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }
  try {
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });
    if (!korisnik) {
      return res.status(404).json({ greska: 'Korisnik nije pronađen.' });
    }
    res.status(200).json({
      id: korisnik.id,
      ime: korisnik.ime,
      prezime: korisnik.prezime,
      username: korisnik.username,
      admin: korisnik.admin
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
app.post('/upit', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }
  const { nekretnina_id, tekst } = req.body;
  try {
    const existingUpiti = await Upit.findAll({
      where: { nekretnina_id, korisnik_id: req.session.userId }
    });
    if (existingUpiti.length >= 3) {
      return res.status(429).json({ greska: 'Previše upita za istu nekretninu.' });
    }
    const upit = await Upit.create({
      tekst,
      nekretnina_id,
      korisnik_id: req.session.userId
    });
    res.status(201).json(upit);
  } catch (error) {
    console.error('Error adding query:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
app.get('/upiti/moji', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }
  try {
    const upiti = await Upit.findAll({
      where: { korisnik_id: req.session.userId },
      include: [{ model: Nekretnina, attributes: ['naziv'] }]
    });
    if (upiti.length === 0) {
      return res.status(404).json([]);
    }
    const response = upiti.map(upit => ({
      id_nekretnine: upit.nekretnina_id,
      tekst_upita: upit.tekst
    }));
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching user queries:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
app.get('/nekretnina/:id', async (req, res) => {
  const nekretnina_id = parseInt(req.params.id);
  try {
    const nekretnina = await Nekretnina.findByPk(nekretnina_id, {
      include: [{
        model: Upit,
        limit: 3,
        order: [['id', 'DESC']]
      }]
    });
    if (!nekretnina) {
      return res.status(404).json({ greska: 'Nekretnina nije pronađena.' });
    }
    res.status(200).json(nekretnina);
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
app.get('/next/upiti/nekretnina/:id', async (req,res)=>{
  const nekretninaId = parseInt(req.params.id)
  let page = parseInt(req.query.page, 10) 
    const nekretnine = await readJsonFile('nekretnine');
    const nekretnina = nekretnine.find(n => n.id === nekretninaId)
    if (!nekretnina) {
      return res.status(404).json([]);
    }
    if(page<0){
      return res.status(404).json([]);
    }
    let upiti
 
    if(page===0){
      upiti=nekretnina.upiti.slice(-3)
    }else {
      page++
      upiti = nekretnina.upiti.slice(-3*page,-3*page+3);
      }
    if (upiti.length === 0) {
      return res.status(404).json([]);
    }
    res.status(200).json(upiti);
})
app.put('/korisnik', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  const { ime, prezime, username, password, blocked } = req.body;

  try {
    const korisnik = await Korisnik.findOne({ where: { username: req.session.username } });

    if (!korisnik) {
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    if (ime) korisnik.ime = ime;
    if (prezime) korisnik.prezime = prezime;
    if (username) korisnik.username = username;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      korisnik.password = hashedPassword;
    }
    if (blocked !== undefined) korisnik.blocked = blocked;

    await korisnik.save();
    res.status(200).json({ poruka: 'Podaci su uspješno ažurirani' });
  } catch (error) {
    console.error('Greška pri ažuriranju korisnika:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
app.get('/nekretnine', async (req, res) => {
  try {
    const nekretnine = await Nekretnina.findAll();
    res.status(200).json(nekretnine);
  } catch (error) {
    console.error('Greška pri dohvaćanju nekretnina:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
/* ----------------- SPIRALA 4   ----------------- */
app.get('/nekretnina/:id/interesovanja', async (req, res) => {
  try {
    const nekretninaId = req.params.id;
    const isAdmin = req.session.admin;

    const interesovanja = await Promise.all([
      Upit.findAll({ where: { nekretnina_id: nekretninaId } }),
      Zahtjev.findAll({ where: { nekretnina_id: nekretninaId } }),
      Ponuda.findAll({
        where: { nekretnina_id: nekretninaId },
        attributes: isAdmin
          ? undefined
          : ['id', 'tekst', 'datumPonude', 'odbijenaPonuda'],
      }),
    ]);
    const [upiti, zahtjevi, ponude] = interesovanja;
    res.status(200).json({ upiti, zahtjevi, ponude });
  } catch (error) {
    console.error('Greška pri dohvaćanju interesovanja:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
app.post('/nekretnina/:id/ponuda', async (req, res) => {
  const nekretninaId = req.params.id;
  const { tekst, ponudaCijene, datumPonude, idVezanePonude, odbijenaPonuda } = req.body;
  try {
    const korisnik = await Korisnik.findByPk(req.session.userId);
    const nekretnina = await Nekretnina.findByPk(nekretninaId);
    if (!nekretnina) {
      return res.status(404).json({ greska: 'Nekretnina nije pronađena' });
    }
    if (idVezanePonude) {
      const parentPonuda = await Ponuda.findByPk(idVezanePonude);
      if (parentPonuda && parentPonuda.odbijenaPonuda) {
        return res.status(400).json({ greska: 'Odbijena ponuda.' });
      }
    }
    const novaPonuda = await Ponuda.create({
      tekst,
      cijenaPonude: ponudaCijene,
      datumPonude,
      odbijenaPonuda,
      idVezanePonude: idVezanePonude || null,
      korisnik_id: korisnik.id,
      nekretnina_id: nekretnina.id,
    });
    res.status(201).json(novaPonuda);
  } catch (error) {
    console.error('Greška pri dodavanju ponude:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
app.post('/nekretnina/:id/zahtjev', async (req, res) => {
  const nekretninaId = req.params.id;
  const { tekst, trazeniDatum } = req.body;
  try {
    if (new Date(trazeniDatum) < new Date()) {
      return res.status(400).json({ greska: 'Datum pregleda nije validan.' });
    }
    const zahtjev = await Zahtjev.create({
      tekst,
      trazeniDatum,
      nekretnina_id: nekretninaId,
      korisnik_id: req.session.userId,
    });
    res.status(201).json(zahtjev);
  } catch (error) {
    console.error('Greška pri kreiranju zahtjeva:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
app.put('/nekretnina/:id/zahtjev/:zid', async (req, res) => {
  const { odobren, addToTekst } = req.body;
  try {
    if (!req.session.admin) {
      return res.status(403).json({ greska: 'Samo admin može odobriti zahtjev.' });
    }
    const zahtjev = await Zahtjev.findByPk(req.params.zid);
    if (!zahtjev) {
      return res.status(404).json({ greska: 'Zahtjev nije pronađen.' });
    }
    zahtjev.odobren = odobren;
    if (!odobren && addToTekst) {
      zahtjev.tekst += ` ODGOVOR ADMINA: ${addToTekst}`;
    }
    await zahtjev.save();
    res.status(200).json(zahtjev);
  } catch (error) {
    console.error('Greška pri ažuriranju zahtjeva:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});
/* ----------------- MARKETING ROUTES ----------------- */

// Route that increments value of pretrage for one based on list of ids in nizNekretnina
app.post('/marketing/nekretnine', async (req, res) => {
  const { nizNekretnina } = req.body;

  try {
    // Load JSON data
    let preferencije = await readJsonFile('preferencije');

    // Check format
    if (!preferencije || !Array.isArray(preferencije)) {
      console.error('Neispravan format podataka u preferencije.json.');
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // Init object for search
    preferencije = preferencije.map((nekretnina) => {
      nekretnina.pretrage = nekretnina.pretrage || 0;
      return nekretnina;
    });

    // Update atribute pretraga
    nizNekretnina.forEach((id) => {
      const nekretnina = preferencije.find((item) => item.id === id);
      if (nekretnina) {
        nekretnina.pretrage += 1;
      }
    });

    // Save JSON file
    await saveJsonFile('preferencije', preferencije);

    res.status(200).json({});
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/nekretnina/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const nekretninaData = preferencije.find((item) => item.id === parseInt(id, 10));

    if (nekretninaData) {
      // Update clicks
      nekretninaData.klikovi = (nekretninaData.klikovi || 0) + 1;

      // Save JSON file
      await saveJsonFile('preferencije', preferencije);

      res.status(200).json({ success: true, message: 'Broj klikova ažuriran.' });
    } else {
      res.status(404).json({ error: 'Nekretnina nije pronađena.' });
    }
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/pretrage', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, pretrage: nekretninaData ? nekretninaData.pretrage : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/klikovi', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, klikovi: nekretninaData ? nekretninaData.klikovi : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
