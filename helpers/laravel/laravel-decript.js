"use strict";

let LCrypt = require('lcrypt');

module.exports.decrypt = function (data) {

    if (data !== "") {
        try {
            let l_crypt = new LCrypt(process.env.LARAVEL_KEY);

            return l_crypt.decode(data);
        }
        catch (r) {
            return false;
        }

    }
    else {
        return false;
    }

};

module.exports.encrypt = function(data) {

    let l_crypt = new LCrypt(process.env.LARAVEL_KEY);

    return l_crypt.encode(data);
};
