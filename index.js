require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Sedide is here!");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5a1umhj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const postCollection = client.db("sedide").collection("posts");

    app.post("/post", async (req, res) => {
      const post = req.body;
      const result = await postCollection.insertOne(post);
      res.send(result);
    });
    app.get("/post", async (req, res) => {
      const result = await postCollection.find({}).toArray();
      res.send(result);
    });
    app.get("/myposts", async (req, res) => {
      const email = req.query.email;
      const filter = { authorEmail: email };
      const result = await postCollection.find(filter).toArray();
      res.send(result);
    });

    app.patch("/updatepost/:id", async (req, res) => {
      const id = req.params.id;
      const newDescription = req.body.newDescription;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          description: newDescription,
        },
      };
      const result = await postCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/deletepost/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await postCollection.deleteOne(filter);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
