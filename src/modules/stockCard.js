const stockCards = require('../models/stockCard');

module.exports = async (event, warehouseId, productId, documentId, documentName, qty, balance) => {
    switch(event) {
        case 'in':
            const stockin = new stockCards({
                warehouseId: warehouseId,
                productId: productId,
                documentId: documentId,
                documentName: documentName,
                stockIn: qty,
                balance: balance,
            })
            await stockin.save()
            break;
        case 'out':
            const stockout = new stockCards({
                warehouseId: warehouseId,
                productId: productId,
                documentId: documentId,
                documentName: documentName,
                stockOut: qty,
                balance: balance,
            })
            await stockout.save()
            break;
    }
}