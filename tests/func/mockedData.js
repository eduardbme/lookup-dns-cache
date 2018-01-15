'use strict';

const noDataError = new Error('ENOTFOUND');
noDataError.code = 'ENOTFOUND';

module.exports = {
    ipv4: {
        family: 4,
        addresses: ['1.2.3.4', '5.6.7.8'],
        error: new Error('queryA ENOTFOUND')
    },
    ipv6: {
        family: 6,
        addresses: ['0:1:2:3:4:5:6:7', '8:9:10:11:12:13:14:15'],
        error: new Error('queryAaaa ENOTFOUND')
    },
    noDataError: noDataError
};
