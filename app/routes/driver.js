const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Driver = require("../models/driver");

const router = express.Router();

// adding driver by super-admin
router.post('/addDriver', (req, res) => {
    bcrypt.hash(req.body.password, 10)
        .then(hashedPassword => {
            const driver = new Driver({
                name: req.body.name,
                cellNo: req.body.cellNo,
                cnic: req.body.cnic,
                region: req.body.region,
                regionCode: req.body.regionCode,
                capacity: req.body.capacity,
                emailId: req.body.emailId,
                password: hashedPassword,
                isRouteAssigned: false
            });
            driver.save()
                .then(result => {
                    res.status(200).json({
                        message: "Driver Added!",
                        driverDetails: driver
                    });
                });
        })
        .catch(err => {
            console.log(err);
            res.status(401).json({
                message: "Cannot add Driver due to the error: " + err
            });
        });
    
});

// get all the drivers of a region by regional-admin
router.get('/get-driver-by-region/:regionCode', (req, res) => {
    Driver.find({ regionCode: req.params.regionCode })
        .then((drivers) => {
            res.status(200).json({
                message: "Drivers Fetched!",
                driversData: drivers
            });
        })
        .catch(err => {
            res.status(401).json({
                message: "Drivers cannot be fetched due to an error: " + err
            });
        });
});

// toggling the isRouteAssigned Property
router.put('/toggle-route-assigned', (req, res) => {
    Driver.findOne({emailId: req.body.emailId})
        .then(driver => {
            if (driver) {
                Driver.findOneAndUpdate({emailId: req.body.emailId}, {$set: {isRouteAssigned: !driver.isRouteAssigned}}, (err, newD) => { 
                    if (err) { 
                        console.log(err); 
                    } else { 
                        //console.log(newD); 
                    } 
                });   
                return res.json(200).json({
                    message: "route toggled!"
                });       
            } else {
                return res.status(404).json({
                    message: "Driver not found!"
                });
            }
        })
        .catch(err => {
            res.status(400).json({
                message: "Cannot enable route due to error: " + err
            });
        });
})

// driver login and sending driver data from frontend
router.post('/driverLogin', (req, res) => {
    Driver.findOne( {emailId: req.body.email} )
        .then((user) => {
            if (user) {
                fetchedUser = user;
                return bcrypt.compare(req.body.password, user.password);
            } else {
                return res.status(401).json({
                    message: "Driver Not Found, Please enter valid credentials!"
                });
            }
        })
        .then(isUser => {
            if (isUser) {
                const token = jwt.sign({ email: fetchedUser.email, id: fetchedUser._id }, 'Secret_Token', { expiresIn: '1h' });
                return res.status(200).json({
                    message: "Token Generated",
                    user: "driver",
                    token: token,
                    expiresIn: 3600,
                    email: fetchedUser.emailId,
                    driverRegionCode: fetchedUser.regionCode
                });
            } else {
                return res.status(402).json({
                    message: "Please Enter valid Password!"
                });
            }
        })
        .catch(error => {
            res.status(404).json({
                message: "Cannot login Due to the following error: " + error
            });
        });
});

// get driver details by email
router.get('/get-driver-details-by-email/:email', (req, res) => {
    Driver.findOne({ emailId: req.params.email })
        .then((driver) => {
            if (driver) {
                res.status(200).json({
                    driverDetails: driver
                });
            }
            else {
                res.status(404).json({
                    message: "cannot find driver!"
                });
            }
        })
        .catch((err) => {
            res.status(403).json({
                message: "cannot fetch data due to the following error: " + err
            });
        });
});

// deleting driver
router.delete('/delete-driver/:email', (req, res) => {
    console.log('test');
    console.log('Ye -> ' + req.params.email);
    Driver.findOneAndDelete({ emailId: req.params.email })
        .then((result) => {
            console.log(result);
        })
        .catch((err) => {
            console.log("cannot delete driver due to the error: " + err);
            res.status(404).json({
                message: "cannot delete driver due to the error: " + err
            });
        });
})

module.exports = router;