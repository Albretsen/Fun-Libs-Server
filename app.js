let express = require('express');
let bodyParser = require('body-parser');
let fs = require('fs');
let mongo = require('mongodb');
let ObjectId = require('mongodb').ObjectID;

/*

TO DO

- DO MongoDB

*/

let app = express();
let port = 3000;

let MongoClient = mongo.MongoClient;
let url = "mongodb+srv://Asgeir:Wmh!l@IjO40XsUCT@funlibs-1-sbur9.mongodb.net"

// Create new database and collection
/*MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    let dbo = db.db("FunLibsTest");
    dbo.createCollection("texts", function(err, res) {
        if (err) throw err;
        console.log("Collection created");
        db.close();
    });
});*/



setup();

function setup() {
    
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// Start server
app.listen(port, () => {
    console.log("Server started on port " + port);
});

// ONLY USED FOR TESTING
/*function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
   }
 }*/

// Upload route
app.post("/:playedOrCreated/upload", (req, res, next) => {

    console.log("POST request recieved with text name:");

    let date = new Date().getTime();

    let obj = JSON.parse(JSON.stringify(req.body));
    console.log(obj["name"]);

    obj["date"] = date;

    UploadText(obj, req.params.playedOrCreated);

    res.status(200);
    res.json({});

});

function UploadText(obj, playedOrCreated) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("FunLibsTest");
        dbo.collection(playedOrCreated).insertOne(obj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
    });
}

// Retrieval routes 

app.get("/:playedOrCreated/search/:sort/:query/:callNum", (req, res, next) => {

    console.log("GET request recieved for " + req.url);

    //req.params.query = "";
    if (req.params.query == "14FvlKDU^CnYBu5rJg$W7") {
        req.params.query = "";
    }

    switch (req.params.sort) 
    {
        case "newest":
            FetchTextsBySearchAndDate(req.params.query, req.params.callNum, 1, req.params.playedOrCreated).then((results) => {
                res.status(200);
                res.json(results);
            });
            break;
        case "oldest":
            FetchTextsBySearchAndDate(req.params.query, req.params.callNum, -1, req.params.playedOrCreated).then((results) => {
                res.status(200);
                res.json(results);
            });
            break;
        case "rating":
            FetchTextsByRatingAndSearch(req.params.query, req.params.callNum, req.params.playedOrCreated).then((results) => {
                res.status(200);
                res.json(results);
            });
            break;
        case "playcount":
            FetchTextsByPlayCountAndSearch(req.params.query, req.params.callNum, req.params.playedOrCreated).then((results) => {
                res.status(200);
                res.json(results);
            });
            break;
    }

});

// These are the functions used for retrieving texts from the MongoDB database
// - fetchedDocPerCall is the amount of documents/texts returned per call
// - callNum works like the page number. callNum 1 is the 20 newest texts, while callNum 2 is the 20 texts after the first 20 texts.
let fetchedDocPerCall = 20;

// Searches for texts by name and "pagenumber", returns in newest first order
// - query is the search term
// - callNum is used as a call number tracker by the Fun Libs app, but functions exactly the same as page numbers. 
// - dateSort 1 is newest, -1 is oldest.
async function FetchTextsBySearchAndDate(query, callNum, dateSort, playedOrCreated) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("FunLibsTest");
            dbo.collection(playedOrCreated).find({"name": { $regex: "(?i)" + query + "(?-i)" }}).sort( { date: dateSort } ).skip(fetchedDocPerCall * (callNum - 1)).limit(fetchedDocPerCall).toArray((err, result) => {
                if (err) reject(err);
                db.close();
                resolve(result);
            });
        });
    });
}

/*async function FetchTextsByRating(callNum) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("FunLibsTest");
            dbo.collection("created-texts").find().sort( { rating: -1 } ).skip(fetchedDocPerCall * (callNum - 1)).limit(fetchedDocPerCall).toArray((err, result) => {
                if (err) reject(err);
                db.close();
                resolve(result);
            });
        });
    });
}*/

async function FetchTextsByRatingAndSearch(query, callNum, playedOrCreated) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("FunLibsTest");
            dbo.collection(playedOrCreated).find({"name": { $regex: "(?i)" + query + "(?-i)" }}).sort( { rating: -1 } ).skip(fetchedDocPerCall * (callNum - 1)).limit(fetchedDocPerCall).toArray((err, result) => {
                if (err) reject(err);
                db.close();
                resolve(result);
            });
        });
    });
}

async function FetchTextsByPlayCountAndSearch(query, callNum, playedOrCreated) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("FunLibsTest");
            dbo.collection(playedOrCreated).find({"name": { $regex: "(?i)" + query + "(?-i)" }}).sort( { playcount: -1 } ).skip(fetchedDocPerCall * (callNum - 1)).limit(fetchedDocPerCall).toArray((err, result) => {
                if (err) reject(err);
                db.close();
                resolve(result);
            });
        });
    });
}

// Give rating route
app.get("/:playedOrCreated/rate/:id/:rating", (req, res, next) => {

    FetchTextsByID(req.params.id).then((results) => {
        let ratingArray = results[0]["allRatings"].split(",");
        ratingArray[req.params.rating - 1]++;
        results[0]["allRatings"] = ratingArray[0] + "," + ratingArray[1] + "," + ratingArray[2] + "," + ratingArray[3] + "," + ratingArray[4] + ",";
        results[0]["rating"] = (((parseInt(ratingArray[0]) * 1) + (parseInt(ratingArray[1]) * 2) + (parseInt(ratingArray[2]) * 3) + (parseInt(ratingArray[3]) * 4) + (parseInt(ratingArray[4]) * 5)) / (parseInt(ratingArray[0]) + parseInt(ratingArray[1]) + parseInt(ratingArray[2]) + parseInt(ratingArray[3])+parseInt(ratingArray[4]))).toFixed(2);

        UpdateTextRatingByID(req.params.id, results[0], req.params.playedOrCreated);

        res.status(200);
        res.json({"succeded": "1"});
    });

});

async function FetchTextsByID(id) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("FunLibsTest");
            dbo.collection("created-texts").find({"_id": ObjectId(id)}).toArray((err, result) => {
                if (err) reject(err);
                db.close();
                resolve(result);
            });
        });
    });
}

async function UpdateTextRatingByID(id, text, playedOrCreated) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("FunLibsTest");
            dbo.collection(playedOrCreated).update({"_id": ObjectId(id)}, { $set: {
                "allRatings": text["allRatings"],
                "rating": text["rating"]
            }})
        });
    });
}

// Add plays
app.get("/:playedOrCreated/addplays/:id", (req, res, next) => {

    FetchTextsByID(req.params.id).then((results) => {
        let plays = parseInt(results[0]["plays"]);
        plays++;
        results[0]["plays"] = plays;

        UpdateTextPlaysByID(req.params.id, results[0], req.params.playedOrCreated);

        res.status(200);
        res.json({"succeded": "1"});
    });

});

async function UpdateTextRatingByID(id, text, playedOrCreated) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("FunLibsTest");
            dbo.collection(playedOrCreated).update({"_id": ObjectId(id)}, { $set: {
                "plays": text["plays"]
            }})
        });
    });
}

