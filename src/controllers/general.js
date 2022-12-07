const mongoose = require('mongoose');
const Currency = require('../models/currencies');
const CreditTerm = require('../models/creditTerm');
const PaymentTerm = require('../models/paymentTerm');
const ShipmentTerm = require('../models/shipmentTerm');
const ShipmentMethod = require('../models/shipmentMethod');
const AdditionalCharge = require('../models/additionalCharge');
const TaxCode = require('../models/taxCode');
const Warehouse = require('../models/warehouse');
const Section = require('../models/section');
const Inventory = require('../models/inventory');
const Forwarding = require('../models/forwarding');

exports.getGeneral =  (req, res) => {
    const currencies =  Currency.find().sort({createdAt: 'desc'});
    const creditterms =  CreditTerm.find().sort({createdAt: 'desc'});
    const paymentterms =  PaymentTerm.find().sort({createdAt: 'desc'});
    const shipmentterms =  ShipmentTerm.find().sort({createdAt: 'desc'});
    const shipmentmethods =  ShipmentMethod.find().sort({createdAt: 'desc'});
    const additionalcharges =  AdditionalCharge.find().sort({createdAt: 'desc'});
    const taxcodes =  TaxCode.find().sort({createdAt: 'desc'});
    const warehouses =  Warehouse.find().populate('sections').sort({order: 'asc'});
    const forwarding = Forwarding.find().sort({company: 'asc'});
    Promise.all([
        currencies, 
        creditterms, 
        paymentterms, 
        shipmentterms, 
        shipmentmethods, 
        additionalcharges,
        taxcodes,
        warehouses,
        forwarding
    ])
    .then(result => {
        res.status(200).json({
            currencies: result[0],
            creditterms: result[1],
            paymentterms: result[2],
            shipmentterms: result[3],
            shipmentmethods: result[4],
            additionalcharges: result[5],
            taxcodes: result[6],
            warehouses: result[7],
            forwarding: result[8]
        })
    })
    .catch(err => {
        res.status(400).send(err);
    });
};
 
exports.postCurrency = (req, res) => {
    const currency = new Currency({
        code: req.body.code,
        name: req.body.name,
        status: true,
        symbolNative: req.body.symbolNative
    })
    currency.save()
    .then(() => {
        Currency.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putCurrency = (req, res) => {
    Currency.findById(req.params.currencyId)
    .then(currency => {
        currency.status = req.body.status
        return currency.save()
    })
    .then(() => {
        res.status(200).send('OK');
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.postPaymentTerm = (req, res) => {
    const paymentTerm = new PaymentTerm({
        code: req.body.code,
        description: req.body.description
    })
    paymentTerm.save()
    .then(() => {
        PaymentTerm.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putPaymentTerm = (req, res) => {
    PaymentTerm.findById(req.params.paymentTermId)
    .then(payment => {
        payment.code = req.body.code;
        payment.description = req.body.description;
        return payment.save()
    })
    .then(() => {
        PaymentTerm.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.deletePaymentTerm = (req, res) => {
    PaymentTerm.findByIdAndDelete(req.params.paymentTermId)
    .then(() => {
        PaymentTerm.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.postShipmentTerm = (req, res) => {
    const shipmentTerm = new ShipmentTerm({
        code: req.body.code,
        description: req.body.description
    })
    shipmentTerm.save()
    .then(() => {
        ShipmentTerm.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        })
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putShipmentTerm = (req, res) => {
    ShipmentTerm.findById(req.params.shipmentTermId)
    .then(shipment => {
        shipment.code = req.body.code,
        shipment.description = req.body.description
        return shipment.save();
    })
    .then(() => {
        ShipmentTerm.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        })
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.deleteShipmentTerm = (req, res) => {
    ShipmentTerm.findByIdAndDelete(req.params.shipmentTermId)
    .then(() => {
        ShipmentTerm.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        })
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.postShipmentMethod = (req, res) => {
    const shipmentMethod = new ShipmentMethod({
        code: req.body.code,
        description: req.body.description
    });
    shipmentMethod.save()
    .then(() => {
        ShipmentMethod.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putShipmentMethod = (req, res) => {
    ShipmentMethod.findById(req.params.shipmentMethodId)
    .then(shipment => {
        shipment.code = req.body.code,
        shipment.description = req.body.description
        return shipment.save();
    })
    .then(() => {
        ShipmentMethod.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.deleteShipmentMethod = (req, res) => {
    ShipmentMethod.findByIdAndDelete(req.params.shipmentMethodId)
    .then(() => {
        ShipmentMethod.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.postAdditionalCharge = (req, res) => {
    const additionalCharge = new AdditionalCharge({
        name: req.body.name,
        unitPrice: req.body.unitPrice,
        isFixed: req.body.isFixed,
        status: true,
        description: req.body.description 
    })
    additionalCharge.save()
    .then(() => {
        AdditionalCharge.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putAdditionalCharge = (req, res) => {
    AdditionalCharge.findById(req.params.additionalChargeId)
    .then(charge => {
        charge.name = req.body.name;
        charge.unitPrice = req.body.unitPrice;
        charge.isFixed = req.body.isFixed;
        charge.status = req.body.status
        return charge.save()
    })
    .then(() => {
        AdditionalCharge.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result)
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.deleteAdditionalCharge = (req, res) => {
    AdditionalCharge.findByIdAndDelete(req.params.additionalChargeId)
    .then(() => {
        AdditionalCharge.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.postTaxCode = (req, res) => {
    const taxcode = new TaxCode({
        code: req.body.code,
        amount: req.body.amount
    });
    taxcode.save()
    .then(() => {
        TaxCode.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putTaxCode = (req, res) => {
    TaxCode.findById(req.params.taxCodeId)
    .then(taxcode => {
        taxcode.code = req.body.code;
        taxcode.amount = req.body.amount;
        return taxcode.save();
    })
    .then(() => {
        TaxCode.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    })
};

exports.deleteTaxCode = (req, res) => {
    TaxCode.findByIdAndDelete(req.params.taxCodeId)
    .then(() => {
        TaxCode.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.getCreditTerm = (req, res) => {
    CreditTerm.find().sort({createdAt: -1})
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        res.status(400).send(err)
    })
    
}

exports.postCreditTerm = (req, res) => {
    const creditTerm = new CreditTerm({
        code: req.body.code,
        duration: req.body.duration,
        description: req.body.description
    })
    creditTerm.save()
    .then(() => {
        CreditTerm.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};


exports.putCreditTerm = (req, res) => {
    CreditTerm.findById(req.params.creditTermId)
    .then(credit => {
        credit.code = req.body.code;
        credit.duration = req.body.duration;
        credit.description = req.body.description;
        return credit.save();
    })
    .then(() => [
        CreditTerm.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        })
    ])
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.deleteCreditTerm = (req, res) => {
    CreditTerm.findByIdAndDelete(req.params.creditTermId)
    .then(() => {
        CreditTerm.find().sort({createdAt: 'desc'})
        .then(result => {
            res.status(200).json(result);
        });
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.postWarehouse = (req, res) => {
    const warehouse = new Warehouse({
        name: req.body.name,
        code: req.body.code,
        order: req.body.order,
    })
    warehouse.save()
    .then(wrs => {
        const sectionCollection = req.body.sections.map(obj => {
            obj.warehouseId = wrs._id
            return obj
        })
        Section.insertMany(sectionCollection)
        .then(result => {
            const sections = result.map(obj => {
                return obj._id.toString()
            })
            wrs.sections = sections
            return wrs.save()
            
        })
        .then(() => {
            Warehouse.find()
            .populate('sections')
            .sort({order: 'asc'})
            .then(result => {
                res.status(200).json(result)
            })
        })
    })
    .catch(err => {
        res.status(400).send(err);
    });
};

exports.putWarehouse = async (req, res) => {
    const sections = req.body.sections.map(obj => {
        if(obj._id == null) {
            obj._id = new mongoose.Types.ObjectId
        }
        return obj;
    })
    const warehouseId = req.params.warehouseId
    for await (let section of sections) {
        await Section.findOneAndUpdate({_id: section._id}, {name: section.name, warehouseId: warehouseId}, {
            new: true,
            upsert: true,
        })
    }
    Section.find({warehouseId: warehouseId})
    .then(result => {
        const updateSection = result.map(obj => {
            return obj._id.toString()
        })
        Warehouse.findById(warehouseId)
        .then(warehouse => {
            warehouse.name = req.body.name;
            warehouse.code = req.body.code;
            warehouse.sections = updateSection
            return warehouse.save()
        })
        .then(() => {
            Warehouse.find().populate('sections').sort({order: 'asc'})
            .then(result => {
                res.status(200).json(result);
            })
        })
    })
    .catch(err => {
        res.status(200).send(err)
    });
};

exports.putWarehouseStatus = (req, res) => {
    Warehouse.findByIdAndUpdate(req.params.warehouseId, {status: req.body.status})
    .then(result => {
        res.status(200).json(result);
    });
}

exports.putWarehouseSetDefault = async (req, res) => {
    await Inventory.updateMany({}, {isDefault: false})
    await Warehouse.updateMany({}, {isDefault: false})
    await Warehouse.findByIdAndUpdate(req.params.warehouseId, {isDefault: true})
    await Inventory.updateMany({warehouseId: req.params.warehouseId}, {isDefault: true})
    Warehouse.find().populate('sections').sort({order: 'asc'})
    .then(result => {
        res.status(200).json(result);
    });
}

exports.putWarehouseOrder =(req, res) => {
    const warehouses = req.body
    const bulkWrite = []
    for(let warehouse of warehouses) {
        bulkWrite.push({
            updateOne: {
                filter: {_id: warehouse._id},
                update: {order: warehouse.order}
            }
        })
    }
    Warehouse.bulkWrite(bulkWrite);
    res.status(200).send('OK');
}

exports.deleteWarehouseSection = (req, res) => {
    const sectionId = req.params.sectionId
    Inventory.find({sectionId: sectionId})
    .then(result => {
        if(result.length > 0) {
            return res.status(400).send('This section has active stock')
        } else {
            Section.deleteOne({_id: sectionId})
            .then(() => {
                res.status(200).json('OK');
            })
        }
    })
}

exports.postForwarding = (req, res) => {
    const forwarding = new Forwarding({
        name: req.body.name,
        company: req.body.company,
        address: req.body.address,
        city: req.body.city,
        country: req.body.country,
        state: req.body.state,
        zip: req.body.zip,
        phone: req.body.phone,
        fax: req.body.fax,
        email: req.body.email,
        shippingMark: req.body.shippingMark
    })
    forwarding.save()
    .then(() => {
        return Forwarding.find().sort({company: 'asc'})
    })
    .then(result => {
        res.status(200).json(result)
    })
}

exports.putForwarding = (req, res) => {
    const forwardingId = req.params.forwardingId
    Forwarding.findById(forwardingId)
    .then(forwarding => {
        forwarding.name = req.body.name
        forwarding.company = req.body.company
        forwarding.address = req.body.address
        forwarding.city = req.body.city
        forwarding.country = req.body.country
        forwarding.state = req.body.state
        forwarding.zip = req.body.zip
        forwarding.phone = req.body.phone
        forwarding.fax = req.body.fax
        forwarding.email = req.body.email
        forwarding.shippingMark = req.body.shippingMark
        return forwarding.save()
    })
    .then(() => {
        return Forwarding.find().sort({company: 'asc'})
    })
    .then(result => {
        res.status(200).json(result)
    })
}

