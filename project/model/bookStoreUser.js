const mongoose = require('mongoose');

const bookStoreUserSchema = {
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
};

const bookStoreUser = mongoose.model('bookStoreUser', bookStoreUserSchema);

module.exports = bookStoreUser;

