// @ts-check
const express = require('express');
const bodyParser = require('body-parser');
const formidable = require('formidable');
const { ObjectID } = require('mongodb')

const { connectServer } = require('./config/mongoUtil');

const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//get route
app.get('/', (req, res) => {
    res.send('work');
});


// DataForm upload process route
app.post("/general-information", (req, res) => {
    let successMsg = {
        status: 'pass',
        message: 'Successfully uploaded'
    };
    let errorMsg = {
        status: 'fail',
        message: 'Upload Failed'
    };
    let user = {};

    // let arrFiles = [];

    let form = new formidable.IncomingForm();

    form.on('file', (field, file) => {
        console.log(`file: ${file.name}, size: ${file.size}`);
        successMsg.message += " " + file.name;
        user.path = "d:/idPhotos/" + file.name;
        // successMsg.path = "d:/idPhotos/" + file.name;

        // arrFiles.push([field, file]);
    });

    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send(errorMsg);
            return;
        }

        // Check if personalId is empty
        if (!fields.personalId) {
            errorMsg.message = 'Please input personalId';
            res.send(errorMsg);
            return;
        }

        // Check if personalId is empty
        if (!fields.email) {
            errorMsg.message = 'Please input email';
            res.send(errorMsg);
            return;
        }

        user.personalId = fields.personalId;
        user.email = fields.email;

        //console.log('user: ', user);

        connectServer().then(function (client) {
            console.log('Connected to MongoDB server');

            const db = client.db('GCQuestionnaire');
            db.collection('Members').insertOne(user).then((response) => {
                successMsg.token = response.ops[0]._id;
                res.send(successMsg);
                console.log(response.ops[0]);
            })
                .catch(
                    (err) => {
                        console.log('Unable to insert Member', err);
                        errorMsg.message = 'Unable to insert Member';
                        res.send(errorMsg);
                        client.close;
                        return;
                    });

            client.close;

        }).catch((err) => {
            console.log('Unable to connect to MongoDB server');
        });


        console.log(JSON.stringify(successMsg, undefined, 2));



        //res.send({ fields: fields, files: arrFiles });
    });
})

// birth-place post route
app.post("/birth-place", (req, res) => {
    let successMsg = {
        status: 'pass',
        message: 'Successfully saved'
    };
    let errorMsg = {
        status: 'fail',
        message: 'Unable to save'
    };

    connectServer().then(function (client) {
        console.log('Connected to MongoDB server');
        const db = client.db('GCQuestionnaire');
        console.log('req.body: ', req.body);

        if (!ObjectID.isValid(req.body.token)) {
            console.log('Token is not valid');
            errorMsg.message = 'Token is not valid';
            res.send(errorMsg);
            return;
        }

        //feilds not null validation befor insert to db by token
        let objForUpdate = {};
        if (req.body.yearOfBirth) objForUpdate.yearOfBirth = req.body.yearOfBirth;
        if (req.body.placeOfBirth) objForUpdate.placeOfBirth = req.body.placeOfBirth;
        if (req.body.gender) objForUpdate.gender = req.body.gender;
        if (req.body.ethnicity) objForUpdate.ethnicity = req.body.ethnicity;

        db.collection('Members').findOneAndUpdate({
            _id: new ObjectID(req.body.token)
        },
            {
                $set: objForUpdate
            },
            {
                returnOriginal: false
            })
            .then((response) => {
                console.log('response', response);
                if (!response.lastErrorObject.updatedExisting) {
                    errorMsg.message = 'Unable to update Member';
                    res.send(errorMsg);
                    return;
                }
                successMsg.token = response.value._id;
                res.send(successMsg);

            }).catch(
                (err) => {
                    errorMsg.message = 'Unable to update Member';
                    res.send(errorMsg);
                    console.log('Unable to update Member', err);
                    return;
                });

        client.close;

    }).catch((err) => {
        console.log('Unable to connect to MongoDB server');
    });
})

const port = 3000;

app.listen(port, () => {
    console.log(`Server listen the port ${port}`);
});