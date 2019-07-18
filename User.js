const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// const crypto = require('crypto-js');

const moment = require('moment');

const jwt = require('jsonwebtoken');


try {
    mongoose.connect(uri , {useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false});
} catch (e) {
    return console.log('connect refused');
}



const userSchema = new mongoose.Schema({
    username: {
        required: true,
        type: String,
        unique: true,
        minlength: 3,
        maxlength: 20
    },
    
    password: {
        required: true,
        type: String, 
        minlength: 6
    },

    security: {
        securityPin: {
            required: false, 
            type: Number
        }
    },

    discord: {

        isVerified: {
            required: true,
            type: Boolean,
            default: false
        },

        verificationString: {
            type: String,
            default: ''
        },

        discordTag: {
            type: String,
            default: ''
        },

        invites: {
            type: Number,
            default: 0
        }
    },

    moderation: {

        moderationHistory: [{
            timeBanned : {
                type: Number,
                required: true

            },

            timeUnbanned : {
                type: Number,
                required: true
            },

            moderationReason: {
                type: String, 
                required: false,
            },

            appliedBy: {
                type: String,
                required: true
            }
        }]
    },

    accountCreated: {
        type: Number,
        default: new Date().getTime()
    },

    authTokens: [{
        token: {
            required: false,
            type: String
        }
    }]

});


userSchema.pre('save', async function() {

    if (this.isModified('password')) {

        this.password = await bcrypt.hash(this.password, 8);

    }

});

userSchema.methods.generateAuthToken = async function() {
    const user = this;

    if (user.moderation.moderationHistory) {

        user.moderation.moderationHistory.forEach(moderation => {
            
            if (new Date().getTime() < moderation.timeUnbanned) {

                return console.log('You are currently banned, you are not authorized to login');

            }

        });

        const now = new Date().getTime();

        const Token = {username: user.username, cookieExpire: moment(now).add(7, 'days').valueOf()};

        //console.log(moment(token.cookieExpire).format('DD','DD','YYYY'));

        const token = jwt.sign(Token, 'secret');

        user.authTokens = user.authTokens.concat( { token } );

        await user.save();

        return {
            user,
            token
        };
        
        
    }
};

userSchema.methods.publicAccount = function() {

    const user = this.toObject();

    delete user.password;
    delete user.authTokens;
    delete user._id;
    delete user.discord.verificationString;

    return user; 

}; 

const User = mongoose.model('User', userSchema);

module.exports = User;