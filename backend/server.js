const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.json());

//connected to the database
mongoose.connect("mongodb+srv://ilginelif:Merhaba1@cluster0.ppbdt4d.mongodb.net/lonca", { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((error) => {
console.error('Failed to connect to MongoDB:', error);
});

const vendorsSchema = new mongoose.Schema({
    _id: String,
    name: String
});

const Vendor = mongoose.model('Vendor', vendorsSchema); //fonksiyon icindeki isim ne anlama geliyo bak


const productsSchema = new mongoose.Schema({
    _id: String,
    name: String,
    vendor: String
});

const Product = mongoose.model('Product', productsSchema);


const productVariantSchema = new mongoose.Schema({
    product: String,
    variantId: String,
    series: String,
    item_count: Number,
    quantity: Number,
    cogs: Number,
    price: Number,
    vendor_margin: Number,
    order_status: String,
    _id: String
});

const orderSchema = new mongoose.Schema({
    _id: String,
    cart_item: [productVariantSchema],
    payment_at: Date
});

const Order = mongoose.model('Order', orderSchema);


const vendorJSONData = fs.readFileSync(path.join(__dirname, 'vendors.json'));
const productJSONData = fs.readFileSync(path.join(__dirname, 'parent_products.json'));
const orderJSONData = fs.readFileSync(path.join(__dirname, 'orders.json'));

const vendorData = JSON.parse(vendorJSONData);
const productData = JSON.parse(productJSONData);
const orderData = JSON.parse(orderJSONData);

const transformedVendorData = vendorData.map((vendor) => {
    return {
      _id: vendor._id.$oid,
      name: vendor.name
    };
  });

Vendor.insertMany(transformedVendorData)
  .then(() => {
    console.log(' Vendor data inserted into MongoDB');
  })
  .catch((error) => {
    console.error('Failed to insert vendor data into MongoDB:', error);
  });

const transformedProductData = productData.map((product) => {

    //console.log(product);   //mapleme çalışıyor
    const transformedProduct = {
        _id: product._id.$oid
    };
    if (product.name) {
        transformedProduct.name= product.name
    } else {
        transformedProduct.name= "Unknown"
    }
    if (product.vendor) {
        transformedProduct.vendor= product.vendor.$oid
    } else {
        transformedProduct.vendor= "Unknown"
    }
    return transformedProduct;
  });

Product.insertMany(transformedProductData)
  .then(() => {
    console.log('Product data inserted into MongoDB');
  })
  .catch((error) => {
    console.error('Failed to insert product data into MongoDB:', error);
  });

const transformedOrderData = orderData.map((order) => {

    const myCart_items = [];
    
    order.cart_item.forEach((eachproduct) => {
        
        myCart_items.push({
        product: eachproduct.product ? eachproduct.product.$oid : "Unknown",
        variantId: eachproduct.variantId.$oid,
        series: eachproduct.series,
        item_count: eachproduct.item_count,
        quantity: eachproduct.quantity,
        cogs: eachproduct.cogs,
        price: eachproduct.price,
        vendor_margin: eachproduct.vendor_margin,
        order_status: eachproduct.order_status,
        _id: eachproduct._id.$oid
        });
    });

    const transformedOrder = {
        _id: order._id.$oid,
        payment_at: order.payment_at.$date.$numberLong,
        cart_item: myCart_items
    };
    return transformedOrder;

  });

Order.insertMany(transformedOrderData)
  .then(() => {
    console.log('order data inserted into MongoDB');
  })
  .catch((error) => {
    console.error('Failed to insert order data into MongoDB:', error);
  });

//buraya kadar sorun yok

app.post('/api/vendor', (req, res) => {
    const { name } = req.body;
    let vendorId;
  
    Vendor.findOne({ name })
      .then((vendor) => {
        if (!vendor) {
          res.status(404).json({ error: 'Vendor not found' });
        } else {
          // Vendor found, return the ID
          vendorId = vendor._id;
          //console.log(vendorId);
          return Product.find({ vendor: vendorId });
        }
      })
      .then((product) => {
        const producArray = product.map((product) => product.toObject());
        const producDict = {};
        const myarray = producArray.map(product => {    //myarray is producId array

            producDict[product._id] = product.name;
            return product._id;
        });
        
        //console.log(producIdArray);

        // we have product Ids of the Vendor
        //console.log(producIdArray);
        return {myarray, producDict};
      })
      .then(({myarray, producDict}) => {
          // Note the return here:
          return Order.find().then(allOrders => ({ allOrders, myarray ,producDict}));
      })
      .then(({ allOrders, myarray ,producDict}) => {

        //console.log(allOrders);
          let orderArray = allOrders.filter(eachOrder => 
              eachOrder.cart_item.some(myProduct => myarray.includes(myProduct.product))
          );
          //console.log(orderArray);
          return {orderArray, myarray, producDict};
      })
      .then(({orderArray, myarray, producDict}) => {
          
        let countDictionary = {};
        let monthDictionary = {};

        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
          ];

        monthNames.forEach( eachmonth => {
            monthDictionary[eachmonth] = 0;
        })

        myarray.forEach( eachprodId => {

            const eachprodName = producDict[eachprodId];
            countDictionary[eachprodName] = 0;
        })
        //console.log(countDictionary);

        orderArray.forEach( eachorder => {

            const theproduct = eachorder.cart_item; //array for all the proucts in the order
            const monthString = eachorder.payment_at.getMonth();
            const monthIndex = parseInt(monthString);
            const month = monthNames[monthIndex];


            //console.log(month);
            theproduct.forEach( eachproduct => {
                if (myarray.includes(eachproduct.product)) {   //bu order product benim ürünüm
                    const count = eachproduct.item_count * eachproduct.quantity;

                    const productName = producDict[eachproduct.product];

                    countDictionary[productName] = countDictionary[productName] + count;   //REWISE

                    monthDictionary[month] = monthDictionary[month] + count;
                }
            })
        })
        console.log(countDictionary);
        console.log(monthDictionary);
        return {countDictionary, monthDictionary};         //the dictionaries WORK
      })
      .then(({countDictionary, monthDictionary}) => {
        res.json({countDictionary, monthDictionary});
    })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  });
  




app.listen(5001, function () {
    console.log("server is on port 5001");
});