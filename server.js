require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());


const userRoutes = require('./src/routers/auth');

app.use('/auth', userRoutes);



const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.DATA_BASE)
.then(() => {
    app.listen(PORT, () => console.log(`Server listen on port ${PORT}`));
});