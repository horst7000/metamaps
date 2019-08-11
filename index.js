const express = require("express");
const Datastore = require('nedb');

// init database and express
const database = new Datastore("database.db");
database.loadDatabase();

const app = express();
app.listen(3000, () => console.log("listening on Port 3000"));
app.use(express.static("public"));  
app.use(express.json()) // for parsing application/json

// configure pug
app.set('views', './templates')
app.set('view engine', 'pug')

// routing
app.get('/bla', (req, res) => 
    res.send({data: "Homepage"})
);

function findAllIDs() {
    return new Promise(resolve => {
        database.find({}, (err, docs) => {
            // console.log(docs);        
            resolve(docs);
        });
    });
}

// --------------  not used ---------
// function findID(id) {
//     return new Promise(resolve => {
//         database.find({ _id: id }, (err,docs) => {
//             console.log(docs);
//             resolve(docs);
//         });
//     });
// }

app.route("/")
    .get( async (req,res) => {
        const docs = await findAllIDs();
        await res.render('index', { definitions : docs });
    });

app.route("/def/:id") 
    .get( async (req,res) => {
        const docs = await findAllIDs();
        // const doc  = await findID(req.params.id);
        // res.render('defedit', { definitions : docs, svgelement : doc });
        res.render('defedit', { definitions : docs });
    });


app.route("/api/def")
    .post((req,res) => { // new definiton
        const data = req.body;
        database.insert(data, (err, newDoc) => {
            res.send({_id: newDoc._id});
        });
    })
    .get((req,res) => { // show all definitions
        database.find({}, (err,docs) => {
            res.json(docs);
        });
    });

app.route("/api/def/:id")
    .get((req,res) => {
        database.find({ _id: req.params.id }, (err,docs) => {
            res.json(docs);
        });
        
    })
    .put((req,res) => {
        const data = req.body.inner;
        database.update({ _id: req.params.id }, { $set: { inner : data } }, {})
    });