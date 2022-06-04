const Provinces = require('../models/provinces');
const Cities = require('../models/cities');
const Subdiscticts = require('../models/subdistricts');

exports.getProvinces = (req, res) => {
    Provinces.find()
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

exports.getCities = (req, res) => {
    const provinceId = Number(req.params.provinceId);
    Cities.find({province_id: provinceId})
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

exports.getSubdistricts = (req, res) => {
    const cityId = Number(req.params.cityId)
    Subdiscticts.find({city_id: cityId})
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    })
}