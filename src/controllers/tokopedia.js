const axios = require('axios');
const client_id = '4b7a1970238e4857abe5ccced8dfe2e8'
const client_secret = 'd96588670aad48229a4ae38ca01d497a'
const shop_id = '556525'
const fs_id = '15088'
const baseURL = 'https://fs.tokopedia.net'
const Products = require('../models/products')
const Warehouses = require('../models/warehouse')
const Inventories = require('../models/inventory')
const path = require('path')
const sharp = require('sharp');
const inventory = require('../models/inventory');
const pusher = require('../modules/pusher');

const authenticate = async () => {
    let result = await axios.post('https://accounts.tokopedia.com/token?grant_type=client_credentials', {}, {
        auth: {
            username: client_id,
            password: client_secret
        }
    })
    return result.data.access_token
}
async function dwonloadImage (url, fileName) {
    const filePath = path.join(__dirname, '../../public/img/products/700', fileName)
    const filePathSmall = path.join(__dirname, '../../public/img/products/200', fileName)
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
      })
    await sharp(response.data).resize({height: 700}).toFile(filePath)
    await sharp(response.data).resize({height: 200}).toFile(filePathSmall)
}
exports.exportProduct = async (req, res) => {
    let token = await authenticate()
    let page = 1
    async function getData (p) {
        let name, condition, description, sku, sellingPrice, measurements = {
            width: {value: '', unit: 'mm'},
            height: {value: '',unit: 'mm'},
            depth: {value: '',unit: 'mm'},
            weight: {value: '',unit: 'gr'},
        }, status, tokopediaId, tokopediaUrl
        try {
            let result = await axios.get(`${baseURL}/inventory/v1/fs/${fs_id}/product/info`, {
                params: {
                    shop_id: shop_id,
                    page: p,
                    per_page: 50
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            let productCount = 0
            for await (let data of result.data.data) {
                let productId = await Products.findOne({tokopediaId: data.basic.productID})
                let warehouse = await Warehouses.findOne({isDefault: true})
                if(!productId) {
    
                    tokopediaId = data.basic.productID
    
                    if(data.basic.status == 1 || data.basic.status == 2) {
                        status = true
                    } else {
                        status = false
                    }
    
                    name = data.basic.name
    
                    if(data.basic.condition == 1) {
                        condition = 'NEW'
                    } else {
                        condition = 'USED'
                    }
    
                    description = data.basic.shortDesc
                    sellingPrice = data.price.value
                    measurements.weight.value = data.weight.value
    
                    if(data.weight.unit == 1) {
                        measurements.weight.unit = 'gr'
                    } else {
                        measurements.weight.unit = 'kg'
                    }
                    sku = new Date().getTime()
    
                    tokopediaUrl = data.other.url
    
                    let images = []
                    for await (img of data.pictures) {
                        const fileName = new Date().getTime().toString()+'.png'
                        images.push(fileName)
                        await dwonloadImage(img.OriginalURL, fileName)
                    }
                    const product = new Products({
                        images: images,
                        name: name,
                        condition: condition,
                        description: description,
                        sku: sku,
                        sellingPrice: sellingPrice,
                        measurements: measurements,
                        tokopediaId: tokopediaId,
                        tokopediaUrl: tokopediaUrl,
                        status: status
                    })
                    let result = await product.save()
                    const inventory = new Inventories({
                        warehouseId: warehouse._id,
                        productId: result._id,
                        sectionId: warehouse.sections[0],
                        isDefault: true,
                        qty: 0
                    })
                    await inventory.save()
                    productCount+=1
                    console.log(productCount)
                }
            }
            console.log('page', page)
            // IF PER PAGE > 50
            if(result.data.data.length == 50) {
                page+=1
                getData(page)
            } else {
                res.status(200).json('OK')
            }
        } catch(err) {
            console.log(err);
            res.status(400).send(err.data)
        }   
    }
    getData(1)
    res.status(200).json('OK')
}

