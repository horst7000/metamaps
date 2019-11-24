const express = require("express");
const Datastore = require('nedb');

// init database and express
const dbTheorems    = new Datastore("db/theorems.db");
dbTheorems.loadDatabase();
const dbDefinitions = new Datastore("db/definitions.db");
dbDefinitions.loadDatabase();

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

function getAllTheoremIDs() {
    return new Promise(resolve => {
        dbTheorems.find({}, (err, docs) => {
            // console.log(docs);        
            resolve(docs);
        });
    });
}

function getTheoremHeader(id) {
    return new Promise(resolve => {
        dbTheorems.find({ _id: id }, (err, docs) => {
            if(docs.length > 0 && !err) 
                resolve({title: docs[0].title, tags: docs[0].tags});
            
        });
    });
}

function getAllDefinitionIDs() {
    return new Promise(resolve => {
        dbDefinitions.find({}, (err, docs) => {
            resolve(docs);
        });
    });
}

function getDefinitionHeader(id) {
    return new Promise(resolve => {
        dbDefinitions.find({ _id: id }, (err, docs) => {
            if(docs.length > 0 && !err)
                resolve({title: docs[0].title, tags: docs[0].tags});
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
        const defs = await getAllDefinitionIDs();
        const thes = await getAllTheoremIDs();
        res.render('root', { definitions : defs, theorems : thes});
    });

app.route("/the/:id") 
    .get( async (req,res) => {
        const defs = await getAllDefinitionIDs();
        const thes = await getAllTheoremIDs();
        const h = await getTheoremHeader(req.params.id); 
        res.render('edit', {
            definitions : defs,
            theorems : thes,
            title : h.title,
            tags : h.tags,
            theorem : true
        });
    });

app.route("/def/:id") 
    .get( async (req,res) => {
        const defs = await getAllDefinitionIDs();
        const thes = await getAllTheoremIDs();
        const h = await getDefinitionHeader(req.params.id); 
        res.render('edit', {
            definitions : defs,
            theorems : thes,
            title : h.title,
            tags : h.tags,
            definition : true
        });
    });

app.route("/view")
    .get( async (req,res) => {
        const docs = await getAllTheoremIDs();
        res.render('viewmap');
    });


app.route("/api/the")
    .post((req,res) => { // new definiton
        const data = req.body;
        dbTheorems.insert(data, (err, newDoc) => {
            res.send({_id: newDoc._id, title: newDoc.title});
        });
    })
    .get((req,res) => { // return all definitions
        dbTheorems.find({}, (err,docs) => {
            res.json(docs);
        });
    });

app.route("/api/def")
    .post((req,res) => { // new definiton
        const data = req.body;
        dbDefinitions.insert(data, (err, newDoc) => {
            res.send({_id: newDoc._id, title: newDoc.title});
        });
    })
    .get((req,res) => { // return all definitions
        dbDefinitions.find({}, (err,docs) => {
            res.json(docs);
        });
    });

app.route("/api/the/titles")
    .get((req,res) => { // return all titles with Ids
        dbTheorems.find({}, (err,docs) => {
            let data = [];
            docs.forEach(el => {
                data.push({key: el.title, id: el._id});
            });
            res.json(data);
        });
    });

app.route("/api/def/titles")
    .get((req,res) => { // return all titles with Ids
        dbDefinitions.find({}, (err,docs) => {
            let data = [];
            docs.forEach(el => {
                data.push({key: el.title, id: el._id});
            });
            res.json(data);
        });
    });

app.route("/api/titles")
    .get((req,res) => { // return all titles with Ids
        let data = [];
        dbTheorems.find({}, (err,docs) => {
            docs.forEach(el => {
                data.push({
                    key: el.title,
                    id: el._id,
                    value: el.title,
                    type: "the/"
                });
            });
            dbDefinitions.find({}, (err,docs) => {
                docs.forEach(el => {
                    data.push({
                        key: el.title,
                        id: el._id,
                        value: el.title,
                        type: "def/"
                    });

                    el.block.alt.forEach(alt => {
                        data.push({
                            key: el.title+": "+alt,
                            id: el._id,
                            value: alt,
                            type: "def/"
                        });
                    });
                });
                res.json(data);
            });
        });
    });


app.route("/api/the/:id")
    .get((req,res) => {
        dbTheorems.find({ _id: req.params.id }, (err,docs) => {
            res.json(docs[0]);
        });
        
    })
    .put((req,res) => {
        const tags  = req.body.pop();
        const title = req.body.pop();
        const data  = req.body;
        dbTheorems.update({ _id: req.params.id }, { $set: { title: title, blocks : data, tags: tags } }, {});

        res.json(data);
    });


app.route("/api/def/:id")
    .get((req,res) => {
        dbDefinitions.find({ _id: req.params.id }, (err,docs) => {
            res.json(docs[0]);
        });
        
    })
    .put((req,res) => {
        const title = req.body.title;
        const tags  = req.body.tags;
        delete req.body.title;
        delete req.body.tags;
        const data  = req.body;
        dbDefinitions.update({ _id: req.params.id }, { $set: { title: title, block: data, tags: tags } }, {});

        res.json(data);
    });