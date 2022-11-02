const Provinces = require('../models/provinces');
const Cities = require('../models/cities');
const Subdisctricts = require('../models/subdistricts');

exports.getProvinces = (req, res) => {
    const search = req.query.search
    let query;
    if(search !== undefined && search !== '') {
        query = {name: {$regex: '.*'+search+'.*', $options: 'i'}}
    } else {
        query = {}
    }
    Provinces.find(query)
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

exports.getCities = (req, res) => {
    const cityId = Number(req.query.cityId)
    const provinceId = req.query.provinceId
    const search = req.query.search
    let query;
    if(cityId) {
        query = {
            _id: cityId
        }
    } else if(provinceId !== 'undefined'&& provinceId !== '') {
        query = {
            $and: [{province_id: provinceId}, {name: {$regex: '.*'+search+'.*', $options: 'i'}}]
        }
    } else {
        query = {name: {$regex: '.*'+search+'.*', $options: 'i'}}
    }
    Cities.find(query)
    .limit(7)
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    });
}

exports.getSubdistricts = (req, res) => {
    const cityId = Number(req.query.cityId);
    const search = req.query.search;
    let query;
    if(cityId && cityId) {
        query = {
            $and: [{city_id: cityId}, {name: {$regex: '.*'+search+'.*', $options: 'i'}}]
        }
    } else {
        query = {
            name: {$regex: '.*'+search+'.*', $options: 'i'}
        }
    }
    Subdisctricts.find(query)
    .limit(7)
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        res.status(400).send(err);
    })
}