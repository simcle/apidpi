const Receipets = require('../models/receipts');
const Warehouse = require('../models/warehouse');
const activity = require('../modules/activityHistory');
module.exports = async (purchase, userId) => {
    let warehouse  = await Warehouse.findOne({isDefault: true}).select('_id');
    let newID;
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

    let receiveNo = await Receipets.findOne({createdAt: {$gte: today}}).sort({createdAt: -1})
 
    if(receiveNo) {
        const no = receiveNo.receiveNo.substring(14)
        const newNo = parseInt(no)+1
        newID = `${dd}${mm}/WH/IN/${yy}/${newNo}`
    } else {
        newID = `${dd}${mm}/WH/IN/${yy}/1`
    }
    const receive = new Receipets({
        receiveNo: newID,
        purchaseId: purchase._id,
        supplierId: purchase.supplierId,
        warehouseId: warehouse._id,
        scheduled: new Date(),
        items: purchase.items,
        status: 'Ready', 
        shipping: purchase.shipping,
        userId: userId
    })
    let result = await receive.save()
}
