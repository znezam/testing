const express = require('express');

const app = express();

app.set('view engine', 'hbs');



const passport = require('passport');

const User = require('./User');

const bcrypt = require('bcrypt');

// Express middleware
const flash = require('express-flash');
const session = require('express-session');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));

const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
    async (username, password, done) => {

        try {

            const user = await User.findOne({ username });

            if (!user) {
                done(null, false, {message: 'This user does not exists.'});
            }; 


            
            if (await bcrypt.compare(password, user.password)) {
                // In the case that the passwords compare.
                done(null, user);

            } else {
                // In the case that the account exists, and passwords do not compare then:

                done(null, false, { message: 'Please provide a valid password'});
            }

            passport.serializeUser( async (user, done) => {

                if (user) {
                    done(null, user._id);
                }
            
            });

            passport.deserializeUser( async (id, done) => {

                const newUser = await User.findOne({id});

                done(null, newUser);

            });
          } catch (e) {};

        

})
);

const registerUser = async (req, res, next) => {
    try {
        
        const {username, password} = req.body;

     const user = new User({
         username,
           password
        });

        await user.save();

        next();
    
    } catch (e) {
        console.log(e.message);
        next();
    }
};

app.use(flash());

app.use(session({
    
    secret: 'okokok',
    resave: false,
    saveUninitialized: false

    }));

app.use(passport.initialize());
app.use(passport.session());

app.get('/login', (req, res) => {

    res.render('index.hbs');
});

app.post('/login', passport.authenticate('local', {
    failureFlash: true,
    successFlash: true, 
    successMessage: 'You have successfully logged in',
    failureRedirect: '/register',
    successRedirect: '/home'
}));

app.get('/register', (req, res) => {

    res.render('register.hbs');
    
});

app.post('/register', registerUser, passport.authenticate('local', {
    successFlash: true,
    failureFlash: true,
    successRedirect: '/home',
    failureRedirect: '/register'
}), async (req, res) => {

}); 

app.get('/home', (req, res) => {
    res.send({ hi: req.user});

    console.log(req.user);

});

app.get('/signout', (req, res) => {
    req.logout();
    res.redirect('/home');

});

app.listen(7000, console.log('Server running!'));