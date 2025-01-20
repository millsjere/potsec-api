const express = require('express')
const app = express();
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const helmet = require('helmet')
const cors = require('cors');
const cookieParser = require('cookie-parser');

//Routers
const studentRouter = require('./routers/studentRouter')//Routers
const adminRouter = require('./routers/adminRouter')

const whiteList = [
  "https://admissions.potsec.edu.gh",
  "https://portal.potsec.edu.gh",
  "http://localhost:5000",
  "http://localhost:8001",
  "http://localhost:8002",
];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || whiteList.indexOf(origin) !== -1) {
      // console.log('Access granted for this: ' + origin)
      cb(null, true);
    } else {
      // console.log('Access restricted')
      cb(new Error("Access Restricted"));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  optionsSuccessStatus: 200, // Response for preflight requests
};

// Enable CORS with options
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Parsers and additional middleware
app.enable("trust proxy");// this enables pre-flight mode
app.use(helmet());
app.use(express.json());
dotenv.config({ path: './config.env' });
app.use(cookieParser());



// All Routes default //
app.use(studentRouter)
app.use(adminRouter)

// Static Files //
//app.use(express.static(path.join(__dirname, '/client/build')))

// Connect to DB //
const db = process.env.DATABASE;
const connectDB = () => {
  mongoose
    .set('strictQuery', true)
    .connect(db)
    .then(() => console.log("Database connected..."))
    .catch((err) => {
      if (err) {
        console.log(err)
        console.log("Database unable to connect please check your internet connection")
      }
    });
};

// Start Server //
const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  connectDB()
  console.log(`Server is running on ${PORT}`)
})
