const TaxCode = require('../models/taxCode');
const Banks = require('../models/banks');
const Pointofsales = require('../models/pos');
const Invoices = require('../models/invoice');
const Payments = require('../models/payment');
const Inventories = require('../models/inventory');
const updateStock = require('../modules/updateStock');

exports.createPos = (req, res) => {
    const TaxCodes = TaxCode.find().sort({code: 1})
    const BankLists = Banks.find().sort({name: 1})
    Promise.all([
        TaxCodes,
        BankLists
    ])
    .then(result => {
        res.status(200).json({
            taxCodes: result[0],
            banks: result[1]
        })
    })
}

exports.insertPos = async (req, res) => {
    const date = new Date();
    let dd = date.getDate();
    let mm = date.getMonth() +1;
    let yy = date.getFullYear().toString().substring(2);
    let YY = date.getFullYear()
    dd = checkTime(dd);
    mm = checkTime(mm)
    function checkTime (i) {
        if(i < 10) {
            i = `0${i}`
        }
        return i
    }
    let today = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    let pos = await Pointofsales.findOne({createdAt: {$gte: today}}).sort({createdAt: -1})
    let invoice = await Invoices.findOne({$and: [{status: 'Posted'},  {confirmDate: {$gte: today}}]}).sort({confirmDate: -1})

    let posNo;
    if(pos) {
        const no = pos.posNo.substring(16)
        const newNo = parseInt(no) + 1
        posNo = `${dd}${mm}/DPI/POS/${yy}/${newNo}`
    } else {
        posNo = `${dd}${mm}/DPI/POS/${yy}/1`
    }

    let invoiceNo;
    if(invoice) {
        const no = invoice.invoiceNo.substring(16)
        const newNo = parseInt(no) + 1
        invoiceNo = `${dd}${mm}/DPI/INV/${yy}/${newNo}`
    } else {
        invoiceNo = `${dd}${mm}/DPI/INV/${yy}/1`
    }
    const pointOfSales = new Pointofsales({
        customerId: req.body.customerId,
        posNo: posNo,
        shipping: req.body.shipping.shipmentMethodId ? req.body.shipping:'',
        items: req.body.items,
        discount: req.body.discount,
        tax: req.body.tax,
        total: req.body.total,
        grandTotal: req.body.grandTotal,
        paymentMethod: req.body.paymentMethod,
        bankId: req.body.bankId,
        userId: req.user._id
    })
    pointOfSales.save()
    .then(result => {
        const invoice = new Invoices({
            invoiceNo: invoiceNo,
            salesId: result._id,
            customerId: result.customerId,
            dueDate: new Date(),
            confirmDate: new Date(),
            paymentStatus: 'Paid',
            status: 'Posted',
            type: 'Regular',
            items: result.items,
            total: result.total,
            discount: result.discount,
            tax: result.tax,
            totalAdditionalCharges: 0,
            shipping: req.body.shipping.shipmentMethodId ? req.body.shipping:'',
            grandTotal: result.grandTotal,
            amountDue: result.grandTotal,
            userID: req.user._id
        })
        return invoice.save()
    })
    .then(result => {
        const payment = new Payments({
            journal: req.body.paymentMethod,
            invoiceId: result._id,
            customerId: result.customerId,
            paymentDate: new Date(),
            amount: result.grandTotal,
            bankId: req.body.bankId,
            userId: req.user._id
        })
        return payment.save()
    })
    .then(async () => {
        const items = req.body.items
        for (let i=0; i < items.length; i++ ) {
            let item = items[i]
            let inventory = await Inventories.findOne({$and: [{isDefault: true}, {productId: item.productId}]})
            if(inventory) {
                let qty = inventory.qty - item.qty
                inventory.qty = qty
                await inventory.save()
                await updateStock(inventory.productId)
            }
        }
        res.status(200).json('OK')
    })
    .catch(err => {
        res.status(400).send(err)
    })
}