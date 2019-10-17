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

function getTitle(id) {
    return new Promise(resolve => {
        database.find({ _id: id }, (err, docs) => {
            if(docs.length > 0 && !err)
                resolve(docs[0].title);
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
        res.render('root', { definitions : docs, title : "" });
    });

app.route("/def/:id") 
    .get( async (req,res) => {
        const docs  = await findAllIDs();
        const title = await getTitle(req.params.id); 
        res.render('defedit', { definitions : docs, title : title });
    });

app.route("/view")
    .get( async (req,res) => {
        const docs = await findAllIDs();
        res.render('viewmap', { definitions : docs });
    });


app.route("/api/def")
    .post((req,res) => { // new definiton
        const data = req.body;
        database.insert(data, (err, newDoc) => {
            res.send({_id: newDoc._id, title: newDoc.title});
        });
    })
    .get((req,res) => { // return all definitions
        database.find({}, (err,docs) => {
            res.json(docs);
        });
    });

app.route("/api/def/titles")
    .get((req,res) => { // return all titles with Ids
        database.find({}, (err,docs) => {
            let data = [];
            docs.forEach(el => {
                data.push({title: el.title, id: el._id});
            });
            res.json(data);
        });
    });

app.route("/api/def/:id")
    .get((req,res) => {
        database.find({ _id: req.params.id }, (err,docs) => {
            res.json(docs[0]);
        });
        
    })
    .put((req,res) => {
        const title = req.body.pop();
        const data  = req.body;
        database.update({ _id: req.params.id }, { $set: { title: title, blocks : data } }, {});

        res.json(data);
    });