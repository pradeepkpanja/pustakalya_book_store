const mongoose = require('mongoose');

const bookDetailsSchema = new mongoose.Schema({
  // Define your schema fields here
  id: {
    type: String,
    required: true,
},
name: {
    type: String,
    required: true,
},
author: {
    type: String,
    required: true,
},
price: {
    type: String,
    required: true,
},
genre: {
    type:String,
    required:true,
},
image: {
    type:String,
    required:true,
},
quantity: {
    type:String,
    required:true,
}
});

const BookDetails = mongoose.model('BookDetails', bookDetailsSchema);

module.exports = BookDetails;
