const express = require('express')
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
const cors = require('cors')
require('dotenv').config()
// console.log(process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3kxg0.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const port = 5000

const app = express()
app.use(cors());
app.use(express.json());

var serviceAccount = require("./configs/burj-al-arab-ak-firebase-adminsdk-9oesa-4663aa5b27.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});





const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");
    //   console.log('db connected')

    app.get('/bookings', (req, res) => {
        // console.log(req.query.email)
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log({ idToken });
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    // const uid = decodedToken.uid;
                    // console.log({uid})
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    // console.log(tokenEmail, queryEmail)
                    if (tokenEmail == queryEmail) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else{
                        res.status(401).send('unauthorized access')
                    }
                })
                .catch((error) => {
                    res.status(401).send('unauthorized access')
                });
        }
        else{
            res.status(401).send('unauthorized access')
        }
    });



    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
        // console.log(newBooking)
    })
});




app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port)