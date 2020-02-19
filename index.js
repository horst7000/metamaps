const express = require("express");
const Datastore = require('nedb');
const posi = require('./positioning');

// init database and express
const dbTheorems    = new Datastore("db/theorems.db");
dbTheorems.loadDatabase();
const dbDefinitions = new Datastore("db/definitions.db");
dbDefinitions.loadDatabase();
const dbTags = new Datastore("db/tags.db");
dbTags.loadDatabase();

const NULLTAG = "null";

const app = express();
app.listen(3000, () => console.log("listening on Port 3000"));
app.use(express.static("public"));  
// panzoom.min.js -> delete >>>>>preventDefault();<<<<<}}function handleTouchEnd(e){if(e.touches.length>0)
app.use("/panzoom", express.static(__dirname + "/node_modules/panzoom/dist"));
app.use(express.json()) // for parsing application/json

// configure pug
app.set('views', './templates')
app.set('view engine', 'pug')

// routing
app.get('/bla', (req, res) => 
    res.send({data: "Homepage"})
);

function getAllTheorems() {
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
            resolve();
        });
    });
}

function getAllDefinitions() {
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
            resolve();
        });
    });
}

function getAllTags() {
    return new Promise(resolve => {
        dbTags.find({}, (err, docs) => {
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
        const defs = await getAllDefinitions();
        const thes = await getAllTheorems();
        res.render('root', { definitions : defs, theorems : thes});
    });

app.route("/the/:id") 
    .get( async (req,res) => {
        const defs = await getAllDefinitions();
        const thes = await getAllTheorems();
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
        const defs = await getAllDefinitions();
        const thes = await getAllTheorems();
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
        const docs = await getAllTheorems();
        res.render('viewmap');
    });


app.route("/api/the")
    .post((req,res) => { // new theorem
        const data = req.body;
        dbTheorems.insert(data, (err, newDoc) => {
            res.send({_id: newDoc._id, title: newDoc.title});
        });
    })
    .get((req,res) => { // return all theorems
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

app.route("/api/tags")
    .get((req,res) => { // return all tags
        dbTags.find({}, (err,docs) => {
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
    .put(async (req,res) => {
        const tags  = req.body.pop();
        const title = req.body.pop();
        const data  = req.body;
        dbTheorems.update({ _id: req.params.id }, { $set: { title: title, blocks : data, tags: tags } }, {});
        await updateTags(req.params.id, tags.split(/; */));

        res.json(data);
        updatePositions(50);
    });


app.route("/api/def/:id")
    .get((req,res) => {
        dbDefinitions.find({ _id: req.params.id }, (err,docs) => {
            res.json(docs[0]);
        });
        
    })
    .put(async (req,res) => {
        const title = req.body.title;
        const tags  = req.body.tags;
        delete req.body.title;
        delete req.body.tags;
        const data  = req.body;
        dbDefinitions.update({ _id: req.params.id }, { $set: { title: title, block: data, tags: tags } }, {});
        await updateTags(req.params.id, tags.split(/; */));

        res.json(data);
        updatePositions(50);
    });

function updateTags(usedById, tags) {
    if(tags.length == 1 && !tags[0]) //tags[0] == "" or ''
        tags = [NULLTAG]; //default tag (invisible)

    // check if tag still used in objects of usedByIds
    // tags == query(tags with usedById in tag.usedByIds)
    dbTags.find({ usedByIds: { $elemMatch: usedById } }, (err, docs) => {
        // docs = previous tags of usedById
        docs.forEach(doc => {
            // is tag still used by usedById (is doc.name in tags)?
            let found = tags.find((tag) => tag == doc.name );
            if(!found)
                dbTags.update({ _id: doc._id }, { $pull: { usedByIds: usedById } });
        });
    });
    
    // add new tags / add id to existing tags
    tags.forEach(tag => {
        if(tag == "") return;
        let data = {
            name: tag,
            color: "rgb(78, 93, "+(Math.floor(Math.random()*158))+")", 
            x: 0,
            y: 0,
            usedByIds: [usedById],
            con: [],
        };

        dbTags.findOne({ name: tag }, (err, doc) => {
            if(doc == null) { // create new tag
                dbTags.insert(data);     //TODO: handle if same tag twice in tags
            } else { // add def/the id to existing tags
                dbTags.update({ _id: doc._id }, { $addToSet: { usedByIds: usedById } });
            }
        });
    });

    dbTags.remove({ usedByIds: [] }, {multi: true});
    return new Promise(resolve => setTimeout(resolve, 3000)); //TODO: promise waits till previous db updates are done
    // return new Promise(resolve => dbTags.remove({ usedByIds: [] }, {multi: true}, resolve));
}






// ###################################
// 
// 
// 
// position stuff

app.route("/api/positions") //TMP (get changes DB)
    .get(async (req,res) => {
        await updatePositions(1);
        let data = [];
        dbDefinitions.find({}).projection({x:1, y:1}).exec((err, defs) => {
            dbTheorems.find({}).projection({x:1, y:1}).exec((err, ths) => {
                dbTags.find({}).projection({x:1, y:1}).exec((err,tags) => {
                    data = data.concat(defs, ths, tags);
                    res.json(data);
                });
            });
        });
    });

app.route("/api/positions/reset") // temporary
    .get((req,res) => {
        dbTags.update({ }, { $set: { x: 0, y: 0} }, {multi : true});  
        dbDefinitions.update({ }, { $set: { x: 0, y: 0} }, {multi : true});  
        dbTheorems.update({ }, { $set: { x: 0, y: 0} }, {multi : true});  

        res.json();
    });

app.route("/api/positions/update") // temporary
    .get((req,res) => {
        dbTags.update({ $or: [{ x : null }, { y : null }] }, { $set: { x: 0, y: 0} }, {multi : true});  
        dbDefinitions.update({ $or: [{ x : null }, { y : null }] }, { $set: { x: 0, y: 0} }, {multi : true});  
        dbTheorems.update({ $or: [{ x : null }, { y : null }] }, { $set: { x: 0, y: 0} }, {multi : true});  
        updatePositions(500);

        res.json();
    });



async function updatePositions(repetitions) {
    // preparation
    let defs = await getAllDefinitions();
    let ths  = await getAllTheorems();
    let tags = await getAllTags();

    let prepared = posi.prepareForUpdate(defs, ths, tags);

    // acutally calculate and update positions
    await posi.calculatePositions(prepared.tags, null,repetitions,
        vertices => updatePositionInDB(vertices));
    posi.calculatePositions(prepared.vertices,prepared.tags,repetitions,
        vertices => updatePositionInDB(vertices));
}

function updatePositionInDB(vertices) {
    // update position in DB
    vertices.forEach(el => {        
        if(el.blocks)
            dbTheorems.update({ _id: el._id }, { $set: { x: el.x, y: el.y} });
        else if (el.block)
            dbDefinitions.update({ _id: el._id }, { $set: { x: el.x, y: el.y} });
        else
            dbTags.update({ _id: el._id }, { $set: { x: el.x, y: el.y, con: el.con} });
    });
}

