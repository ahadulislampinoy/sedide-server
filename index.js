require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5a1umhj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Verify json web token
const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
  });
  next();
};

async function run() {
  try {
    const postCollection = client.db("sedide").collection("posts");
    const userCollection = client.db("sedide").collection("users");

    app.post("/post", async (req, res) => {
      const post = req.body;
      const result = await postCollection.insertOne(post);
      res.send(result);
    });

    app.get("/post", async (req, res) => {
      const result = await postCollection
        .find({}, { sort: { time: -1 } })
        .toArray();
      res.send(result);
    });

    app.get("/myposts", verifyJwt, async (req, res) => {
      const email = req.query.email;
      const filter = { authorEmail: email };
      const result = await postCollection.find(filter).toArray();
      res.send(result);
    });

    app.patch("/updatepost/:id", verifyJwt, async (req, res) => {
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

    app.delete("/deletepost/:id", verifyJwt, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await postCollection.deleteOne(filter);
      res.send(result);
    });

    app.post("/userdata", async (req, res) => {
      const email = req.query.email;
      const user = req.body;
      const query = { email: email };
      const isExist = await userCollection.findOne(query);
      if (isExist) {
        return;
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const user = await userCollection.findOne(filter);
      if (!user) {
        return res.status(401).send({ message: "Unauthorized access" });
      }
      const token = jwt.sign(user, process.env.JWT_TOKEN, { expiresIn: "10d" });
      res.send({ token });
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
