const path = require('path');
const fs = require('fs');

const Shipping = require('../models/shipping');

// get all shipping data
exports.getShipping = (req, res) => {
    Shipping.find()
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    })
}

// create or add new shipping
exports.postShipping = (req, res) => {
    const shipping = new Shipping({
        name: req.body.name,
        services: JSON.parse(req.body.services),
        logo: req.file.path,
        status: req.body.status
    })
    shipping.save()
    .then(() => {
        Shipping.find()
        .then(result => {
            res.status(201).json(result);
        })
    })
    .catch(err => {
        res.status(400).send(err);
    })
}

// update shipping
exports.putShipping = (req, res) => {
    Shipping.findById(req.params.shippingId)
    .then(shipping => {
        shipping.name = req.body.name;
        shipping.services = JSON.parse(req.body.services);
        shipping.status = req.body.status;
        if(req.file) {
            removeImage(shipping.logo)
            shipping.logo = req.file.path;
        }
        return shipping.save();
    })
    .then((result) => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
}

// update shipping status & service status
exports.putShippingService = (req, res) => {
    Shipping.findById(req.params.shippingId)
    .then(shipping => {
        shipping.services = req.body.services;
        shipping.status = req.body.status;
        return shipping.save()
    })
    .then(() => {
        res.status(200).send('OK');
    })
    .catch(err => {
        res.status(400).send(err);
    })
}

// remove image
const removeImage = (filePath) => {
    filePath = path.join(__dirname, '../..', filePath);
    fs.unlink(filePath, err => {
       if(err) return;
    })
}