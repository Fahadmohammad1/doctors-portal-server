const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
var jwt = require("jsonwebtoken");
const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cb4zy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client
      .db("doctors_portal")
      .collection("services");
    const bookingCollection = client
      .db("doctors_portal")
      .collection("bookings");
    const userCollection = client.db("doctors_portal").collection("users");

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });

    // this is not the proper way to query
    // after learning more about mongodb, use aggregate lookup, pipeline, match, group

    app.get("/available", async (req, res) => {
      const date = req.query.date || "May 15, 2022";

      // step 1: get all services

      const services = await serviceCollection.find().toArray();

      // step 2: get the booking on that day
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();

      // step 3: for each service

      services.forEach((service) => {
        // step 4: find bookings for that service.

        const serviceBookings = bookings.filter(
          (b) => b.treatment === service.name
        );

        //step 5:  select slot for the service bookings

        const booked = serviceBookings.map((s) => s.slot);
        service.booked = booked;

        // step 6: select those slots that are not in booked.

        const available = service.slots.filter((s) => !booked.includes(s));

        // step 7: set available slots to make it easier.

        service.slots = available;
      });
      res.send(services);
    });

    app.get("/booking", async (req, res) => {
      const patient = req.query.patient;
      const query = { patient: patient };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    // post
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        date: booking.date,
        patient: booking.patient,
      };
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({ success: true, result });
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("doctors portal running");
});

app.listen(port, () => {
  console.log("listening", port);
});
