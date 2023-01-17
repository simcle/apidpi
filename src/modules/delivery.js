const Delivery = require('../models/delivery')
const Warehouse = require('../models/warehouse');
const activity = require('../modules/activityHistory');
module.exports = async (sales, userId) => {
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

    let deliveryNo = await Delivery.findOne({createdAt: {$gte: today}}).sort({createdAt: -1})
 
    if(deliveryNo) {
        const no = deliveryNo.deliveryNo.substring(15)
        const newNo = parseInt(no)+1
        newID = `${dd}${mm}/WH/OUT/${yy}/${newNo}`
    } else {
        newID = `${dd}${mm}/WH/OUT/${yy}/1`
    }
    const delivery = new Delivery({
        deliveryNo: newID,
        salesId: sales._id,
        customerId: sales.customerId,
        shipTo: sales.shipTo,
        warehouseId: warehouse._id,
        scheduled: new Date(),
        items: sales.items,
        status: 'Ready', 
        shipping: sales.shipping,
        userId: userId
    })
    let result = await delivery.save()
    activity('insert','Delivery Orders', result.salesId, result._id, result.deliveryNo, userId, result, result)
}
